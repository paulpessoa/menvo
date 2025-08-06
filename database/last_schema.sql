-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  to_email character varying NOT NULL,
  from_email character varying NOT NULL,
  subject character varying NOT NULL,
  template_name character varying,
  status character varying DEFAULT 'pending'::character varying,
  provider character varying DEFAULT 'brevo'::character varying,
  provider_id character varying,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  email text,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mentor_availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  timezone character varying DEFAULT 'America/Sao_Paulo'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_availability_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mentorship_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid,
  mentee_id uuid,
  skill_id uuid,
  topic character varying NOT NULL,
  description text,
  mentee_notes text,
  requested_date date NOT NULL,
  requested_start_time time without time zone NOT NULL,
  requested_end_time time without time zone NOT NULL,
  timezone character varying DEFAULT 'America/Sao_Paulo'::character varying,
  status character varying DEFAULT 'pending'::character varying,
  mentor_response text,
  meeting_link text,
  meeting_platform character varying,
  mentor_notes text,
  mentee_feedback text,
  mentor_feedback text,
  mentee_rating integer CHECK (mentee_rating >= 1 AND mentee_rating <= 5),
  mentor_rating integer CHECK (mentor_rating >= 1 AND mentor_rating <= 5),
  requested_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentorship_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT mentorship_sessions_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid,
  receiver_id uuid,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  read_at timestamp with time zone,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.newsletter_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  name character varying,
  subscribed_at timestamp with time zone DEFAULT now(),
  consent_given boolean NOT NULL DEFAULT false,
  consent_date timestamp with time zone NOT NULL,
  marketing_consent boolean DEFAULT false,
  ip_address inet,
  user_agent text,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'unsubscribed'::character varying]::text[])),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  whatsapp character varying,
  CONSTRAINT newsletter_subscriptions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  data jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  display_name character varying NOT NULL,
  description text,
  resource character varying,
  action character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  role_id uuid,
  permission_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid,
  mentee_id uuid,
  status text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  scheduled_at timestamp with time zone,
  duration_minutes integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(id),
  CONSTRAINT sessions_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES public.users(id)
);
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  category character varying,
  status character varying DEFAULT 'pending'::character varying,
  created_by uuid,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skills_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  title character varying NOT NULL,
  description text,
  start_date date,
  end_date date,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status character varying DEFAULT 'planned'::character varying,
  created_by_ai boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_goals_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  bio text,
  location text,
  timezone text DEFAULT 'America/Sao_Paulo'::text,
  linkedin_url text,
  github_url text,
  website_url text,
  years_experience integer,
  current_position text,
  current_company text,
  industry text,
  availability text DEFAULT 'available'::text CHECK (availability = ANY (ARRAY['available'::text, 'busy'::text, 'unavailable'::text])),
  preferred_communication ARRAY DEFAULT ARRAY['email'::text],
  languages ARRAY DEFAULT ARRAY['Portuguese'::text],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  education_level text,
  inclusion_tags ARRAY,
  state_province text,
  roles ARRAY DEFAULT ARRAY[]::text[],
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  role_id uuid,
  is_primary boolean DEFAULT true,
  status text DEFAULT 'active'::text,
  validation_status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_enhanced(id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.user_skills (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  skill_id uuid,
  skill_type character varying NOT NULL,
  proficiency_level character varying,
  years_experience integer,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_skills_pkey PRIMARY KEY (id),
  CONSTRAINT user_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.user_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  document_type character varying NOT NULL,
  document_url text NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_verifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  user_type text CHECK (user_type = ANY (ARRAY['mentor'::text, 'mentee'::text])),
  first_name text,
  last_name text,
  status text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  profile_validated boolean DEFAULT false,
  bio text,
  profile_picture_url text,
  resume_url text,
  video_pitch_url text,
  location text,
  languages ARRAY,
  linkedin text,
  website text,
  interests ARRAY,
  inclusion_tags ARRAY,
  communication_preferences ARRAY,
  academic_background text,
  experience text,
  mentoring_areas ARRAY,
  profile_visibility text DEFAULT 'public'::text,
  avatar_url text,
  phone text,
  email_verified boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  last_login timestamp with time zone,
  role text,
  roles ARRAY DEFAULT ARRAY[]::text[],
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.users_enhanced (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean DEFAULT false,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  profile_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_enhanced_pkey PRIMARY KEY (id)
);
