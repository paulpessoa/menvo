-- Drop existing objects to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_slug() CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_slug() CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.mentors CASCADE;
DROP TABLE IF EXISTS public.mentorship_sessions CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;

-- Create ENUM for user roles
CREATE TYPE user_role AS ENUM ('mentee', 'mentor', 'admin');

-- Create ENUM for mentorship session status
CREATE TYPE session_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- Create user_profiles table
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    location TEXT,
    occupation TEXT,
    skills TEXT[],
    interests TEXT[],
    role user_role DEFAULT 'mentee'::user_role NOT NULL,
    is_profile_complete BOOLEAN DEFAULT FALSE NOT NULL,
    slug TEXT UNIQUE, -- Custom slug for profiles
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create mentors table (specific details for mentors)
CREATE TABLE public.mentors (
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    available_hours JSONB, -- e.g., {'monday': ['09:00-10:00', '14:00-15:00']}
    mentorship_topics TEXT[],
    hourly_rate NUMERIC(10, 2),
    years_of_experience INTEGER,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT
);

-- Create mentorship_sessions table
CREATE TABLE public.mentorship_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    mentee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES public.public.mentors(profile_id) ON DELETE CASCADE NOT NULL,
    session_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status session_status DEFAULT 'pending'::session_status NOT NULL,
    topic TEXT NOT NULL,
    mentee_notes TEXT,
    mentor_notes TEXT,
    meeting_link TEXT,
    CONSTRAINT fk_mentee FOREIGN KEY (mentee_id) REFERENCES public.user_profiles(id),
    CONSTRAINT fk_mentor FOREIGN KEY (mentor_id) REFERENCES public.mentors(profile_id)
);

-- Create events table
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    location TEXT,
    event_url TEXT,
    organizer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_online BOOLEAN DEFAULT TRUE NOT NULL
);

-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- RLS Policies for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.user_profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile." ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for mentors
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors are viewable by everyone." ON public.mentors
  FOR SELECT USING (TRUE);

CREATE POLICY "Mentors can insert their own mentor profile." ON public.mentors
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Mentors can update their own mentor profile." ON public.mentors
  FOR UPDATE USING (auth.uid() = profile_id);

-- RLS Policies for mentorship_sessions
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view their own sessions." ON public.mentorship_sessions
  FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() = (SELECT profile_id FROM public.mentors WHERE profile_id = mentor_id));

CREATE POLICY "Mentees can create sessions." ON public.mentorship_sessions
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors and mentees can update their own sessions." ON public.mentorship_sessions
  FOR UPDATE USING (auth.uid() = mentee_id OR auth.uid() = (SELECT profile_id FROM public.mentors WHERE profile_id = mentor_id));

-- RLS Policies for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone." ON public.events
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create events." ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizers can update their own events." ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events." ON public.events
  FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies for newsletter_subscribers
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view their own subscription." ON public.newsletter_subscribers
  FOR SELECT USING (auth.uid() = id); -- Assuming id here refers to user_id if linked, or just true for public

CREATE POLICY "Anyone can subscribe to the newsletter." ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Subscribers can unsubscribe." ON public.newsletter_subscribers
  FOR UPDATE USING (auth.uid() = id OR email = auth.email()); -- Assuming email is unique and can be used for update

CREATE POLICY "Subscribers can delete their own subscription." ON public.newsletter_subscribers
  FOR DELETE USING (auth.uid() = id OR email = auth.email());

-- Function to handle new user creation in public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url, username, is_profile_complete)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name', -- Assuming 'user_name' might come from OAuth providers
    FALSE -- Mark profile as incomplete on initial creation
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to generate a unique slug for user profiles
CREATE OR REPLACE FUNCTION public.create_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
    new_slug TEXT;
    base_slug TEXT;
    counter INT := 0;
BEGIN
    -- Use username or full_name as base for slug
    IF NEW.username IS NOT NULL AND NEW.username != '' THEN
        base_slug := lower(regexp_replace(NEW.username, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSIF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
        base_slug := lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSE
        base_slug := lower(regexp_replace(gen_random_uuid()::text, '[^a-zA-Z0-9]+', '', 'g'));
    END IF;

    -- Ensure slug is unique
    new_slug := base_slug;
    LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE slug = new_slug);
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create slug on insert
CREATE TRIGGER on_profile_insert_create_slug
BEFORE INSERT ON public.user_profiles
FOR EACH ROW
WHEN (NEW.slug IS NULL)
EXECUTE FUNCTION public.create_profile_slug();

-- Function to update slug if username/full_name changes and slug is not manually set
CREATE OR REPLACE FUNCTION public.update_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
    new_slug TEXT;
    base_slug TEXT;
    counter INT := 0;
BEGIN
    -- Only update if username or full_name changed AND slug was not manually set by user
    IF (OLD.username IS DISTINCT FROM NEW.username OR OLD.full_name IS DISTINCT FROM NEW.full_name) AND OLD.slug = NEW.slug THEN
        IF NEW.username IS NOT NULL AND NEW.username != '' THEN
            base_slug := lower(regexp_replace(NEW.username, '[^a-zA-Z0-9]+', '-', 'g'));
        ELSIF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
            base_slug := lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9]+', '-', 'g'));
        ELSE
            base_slug := lower(regexp_replace(gen_random_uuid()::text, '[^a-zA-Z0-9]+', '', 'g'));
        END IF;

        new_slug := base_slug;
        LOOP
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE slug = new_slug AND id != NEW.id);
            counter := counter + 1;
            new_slug := base_slug || '-' || counter;
        END LOOP;

        NEW.slug := new_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update slug on update
CREATE TRIGGER on_profile_update_update_slug
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_slug();

-- Set up authentication for the `anon` role to allow inserts into `user_profiles`
-- This is handled by the `handle_new_user` function which runs with `SECURITY DEFINER`
-- and is triggered by `auth.users` inserts.
-- No direct RLS policy needed for `anon` on `user_profiles` for initial insert.

-- Enable `auth.uid()` and `auth.email()` for RLS policies
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON TABLE auth.users TO authenticated;
