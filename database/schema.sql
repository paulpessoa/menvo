-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_actions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['user'::text, 'mentor'::text, 'session'::text, 'review'::text])),
  target_id uuid NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_actions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.mentor_availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_availability_pkey PRIMARY KEY (id),
  CONSTRAINT mentor_availability_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.mentors(id)
);
CREATE TABLE public.mentor_verification (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid NOT NULL,
  verification_type text NOT NULL CHECK (verification_type = ANY (ARRAY['initial'::text, 'renewal'::text])),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::verification_status,
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  verified_by uuid,
  notes text,
  documents_submitted boolean DEFAULT false,
  identity_verified boolean DEFAULT false,
  expertise_verified boolean DEFAULT false,
  background_check boolean DEFAULT false,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_verification_pkey PRIMARY KEY (id),
  CONSTRAINT mentor_verification_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id),
  CONSTRAINT mentor_verification_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.mentors(id)
);
CREATE TABLE public.mentors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  title text NOT NULL,
  company text,
  experience_years integer NOT NULL CHECK (experience_years >= 0),
  expertise_areas ARRAY NOT NULL DEFAULT '{}'::text[],
  topics ARRAY NOT NULL DEFAULT '{}'::text[],
  inclusion_tags ARRAY DEFAULT '{}'::text[],
  linkedin_url text,
  portfolio_url text,
  academic_background text,
  current_work text,
  areas_of_interest text,
  session_duration integer DEFAULT 45 CHECK (session_duration > 0),
  timezone text NOT NULL DEFAULT 'UTC'::text,
  status USER-DEFINED NOT NULL DEFAULT 'pending_verification'::mentor_status,
  verification_notes text,
  verified_at timestamp with time zone,
  verified_by uuid,
  rating numeric DEFAULT 0.0 CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  total_sessions integer DEFAULT 0 CHECK (total_sessions >= 0),
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentors_pkey PRIMARY KEY (id),
  CONSTRAINT mentors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT mentors_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.mentorship_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  duration integer NOT NULL DEFAULT 45 CHECK (duration > 0),
  status USER-DEFINED NOT NULL DEFAULT 'scheduled'::session_status,
  topics ARRAY NOT NULL DEFAULT '{}'::text[],
  mentee_notes text,
  mentor_notes text,
  meeting_url text,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  cancelled_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentorship_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT mentorship_sessions_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES public.profiles(id),
  CONSTRAINT mentorship_sessions_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id),
  CONSTRAINT mentorship_sessions_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.mentors(id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  location text,
  languages ARRAY DEFAULT '{}'::text[],
  role USER-DEFINED NOT NULL DEFAULT 'mentee'::user_role,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::user_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewed_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewed_id_fkey FOREIGN KEY (reviewed_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.mentorship_sessions(id)
);
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  role_id uuid,
  permission_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  role_id uuid,
  is_primary boolean DEFAULT false,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);