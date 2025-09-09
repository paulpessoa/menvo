-- =================================================================
-- CREATE SIMPLIFIED SCHEMA - Auth Refactor MVP
-- Simplified structure for MVP with essential functionality
-- =================================================================

-- =================================================================
-- 1. CREATE SIMPLIFIED TABLES
-- =================================================================

-- Simplified profiles table with essential fields only
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL 
      THEN first_name
      WHEN last_name IS NOT NULL 
      THEN last_name
      ELSE NULL
    END
  ) STORED,
  avatar_url TEXT,
  slug TEXT UNIQUE,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  bio TEXT,
  expertise_areas TEXT[],
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Simple roles table with only essential roles
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('mentor', 'mentee', 'admin'))
);

-- User roles relationship table (can be null initially for new users)
CREATE TABLE public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role_id)
);

-- Mentor availability table for simple scheduling
CREATE TABLE public.mentor_availability (
  id SERIAL PRIMARY KEY,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Basic appointments table for mentorship sessions
CREATE TABLE public.appointments (
  id SERIAL PRIMARY KEY,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60 NOT NULL,
  google_event_id TEXT,
  google_meet_link TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =================================================================
-- 2. INSERT DEFAULT ROLES
-- =================================================================

INSERT INTO public.roles (name) VALUES 
  ('mentor'),
  ('mentee'), 
  ('admin');

-- =================================================================
-- 3. CREATE STORAGE BUCKET FOR AVATARS
-- =================================================================

-- Create avatars bucket with public access
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_slug ON public.profiles(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_profiles_verified ON public.profiles(verified) WHERE verified = true;
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

-- Mentor availability indexes
CREATE INDEX idx_mentor_availability_mentor_day ON public.mentor_availability(mentor_id, day_of_week);
CREATE INDEX idx_mentor_availability_mentor_id ON public.mentor_availability(mentor_id);

-- Appointments indexes
CREATE INDEX idx_appointments_mentor_id ON public.appointments(mentor_id);
CREATE INDEX idx_appointments_mentee_id ON public.appointments(mentee_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- =================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
