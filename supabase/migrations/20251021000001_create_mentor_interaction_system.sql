-- =================================================================
-- MENTOR INTERACTION SYSTEM - Database Schema
-- Creates tables for partners, invitations, conversations, messages,
-- and mentorship requests with proper RLS policies
-- =================================================================

-- =================================================================
-- 1. CREATE NEW TABLES
-- =================================================================

-- Partners table (SEBRAE, Porto Digital, Hackathons, etc.)
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Partner invitations for access control
CREATE TABLE IF NOT EXISTS public.partner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'declined')),
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User-Partner associations (which users have access to which partners)
CREATE TABLE IF NOT EXISTS public.user_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'expired')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, partner_id)
);

-- Mentor-Partner associations (which mentors participate in which partner programs)
CREATE TABLE IF NOT EXISTS public.mentor_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(mentor_id, partner_id)
);

-- Conversations for real-time chat
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(mentor_id, mentee_id)
);

-- Messages for real-time chat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Mentorship requests (async email-based messages)
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  cv_url TEXT,
  cv_type VARCHAR(50) CHECK (cv_type IN ('pdf', 'video_link')),
  status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =================================================================
-- 2. ADD NEW COLUMNS TO EXISTING TABLES
-- =================================================================

-- Add mentor interaction fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'partners_only', 'private'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mentorship_guidelines TEXT;

-- Add appointment interaction fields to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cv_type VARCHAR(50) CHECK (cv_type IN ('pdf', 'video_link'));
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS action_token VARCHAR(255) UNIQUE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS meeting_url TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS video_service VARCHAR(50) CHECK (video_service IN ('daily', 'zoom', 'google_meet'));
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS message TEXT;

-- =================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =================================================================

-- Partners indexes
CREATE INDEX IF NOT EXISTS idx_partners_slug ON public.partners(slug);
CREATE INDEX IF NOT EXISTS idx_partners_active ON public.partners(is_active) WHERE is_active = true;

-- Partner invitations indexes
CREATE INDEX IF NOT EXISTS idx_partner_invitations_token ON public.partner_invitations(token);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_email ON public.partner_invitations(email);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_status ON public.partner_invitations(status);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_partner ON public.partner_invitations(partner_id);

-- User partners indexes
CREATE INDEX IF NOT EXISTS idx_user_partners_user ON public.user_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_user_partners_partner ON public.user_partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_user_partners_status ON public.user_partners(status) WHERE status = 'active';

-- Mentor partners indexes
CREATE INDEX IF NOT EXISTS idx_mentor_partners_mentor ON public.mentor_partners(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_partners_partner ON public.mentor_partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_mentor_partners_active ON public.mentor_partners(mentor_id, is_active) WHERE is_active = true;

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_mentor ON public.conversations(mentor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_mentee ON public.conversations(mentee_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC NULLS LAST);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;

-- Mentorship requests indexes
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON public.mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentee ON public.mentorship_requests(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON public.mentorship_requests(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_created ON public.mentorship_requests(created_at DESC);

-- Appointments indexes for new fields
CREATE INDEX IF NOT EXISTS idx_appointments_action_token ON public.appointments(action_token) WHERE action_token IS NOT NULL;

-- Profiles indexes for new fields
CREATE INDEX IF NOT EXISTS idx_profiles_chat_enabled ON public.profiles(chat_enabled) WHERE chat_enabled = true;
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON public.profiles(profile_visibility);

-- =================================================================
-- 4. CREATE DATABASE FUNCTIONS
-- =================================================================

-- Function to generate secure tokens for invitations and actions
CREATE OR REPLACE FUNCTION public.generate_secure_token(length INTEGER DEFAULT 64)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to check if user has access to a partner
CREATE OR REPLACE FUNCTION public.user_has_partner_access(
  p_user_id UUID,
  p_partner_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_partners 
    WHERE user_id = p_user_id 
      AND partner_id = p_partner_id 
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if mentor is visible to user based on visibility settings
CREATE OR REPLACE FUNCTION public.is_mentor_visible_to_user(
  p_mentor_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_visibility TEXT;
  v_has_partner_access BOOLEAN := false;
BEGIN
  -- Get mentor visibility setting
  SELECT profile_visibility INTO v_visibility
  FROM public.profiles
  WHERE id = p_mentor_id;
  
  -- If profile is public, always visible
  IF v_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- If profile is private, never visible in search
  IF v_visibility = 'private' THEN
    RETURN false;
  END IF;
  
  -- If profile is partners_only, check if user has access to any of mentor's partners
  IF v_visibility = 'partners_only' AND p_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.mentor_partners mp
      INNER JOIN public.user_partners up ON mp.partner_id = up.partner_id
      WHERE mp.mentor_id = p_mentor_id
        AND mp.is_active = true
        AND up.user_id = p_user_id
        AND up.status = 'active'
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO v_has_partner_access;
    
    RETURN v_has_partner_access;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to automatically expire partner invitations
CREATE OR REPLACE FUNCTION public.expire_partner_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.partner_invitations
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically expire user partner access
CREATE OR REPLACE FUNCTION public.expire_user_partner_access()
RETURNS void AS $$
BEGIN
  UPDATE public.user_partners
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation last_message_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 5. CREATE TRIGGERS
-- =================================================================

-- Trigger to update conversation timestamp when message is created
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Triggers to update updated_at timestamps
DROP TRIGGER IF EXISTS trigger_partners_updated_at ON public.partners;
CREATE TRIGGER trigger_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_partner_invitations_updated_at ON public.partner_invitations;
CREATE TRIGGER trigger_partner_invitations_updated_at
  BEFORE UPDATE ON public.partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_partners_updated_at ON public.user_partners;
CREATE TRIGGER trigger_user_partners_updated_at
  BEFORE UPDATE ON public.user_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_mentor_partners_updated_at ON public.mentor_partners;
CREATE TRIGGER trigger_mentor_partners_updated_at
  BEFORE UPDATE ON public.mentor_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON public.conversations;
CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_messages_updated_at ON public.messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_mentorship_requests_updated_at ON public.mentorship_requests;
CREATE TRIGGER trigger_mentorship_requests_updated_at
  BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =================================================================

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =================================================================

COMMENT ON TABLE public.partners IS 'Partner organizations (SEBRAE, Porto Digital, etc.) with access control';
COMMENT ON TABLE public.partner_invitations IS 'Invitations for users to join partner programs';
COMMENT ON TABLE public.user_partners IS 'Association between users and partners they have access to';
COMMENT ON TABLE public.mentor_partners IS 'Association between mentors and partner programs they participate in';
COMMENT ON TABLE public.conversations IS 'Chat conversations between mentors and mentees';
COMMENT ON TABLE public.messages IS 'Individual messages within conversations';
COMMENT ON TABLE public.mentorship_requests IS 'Async mentorship requests sent via email';

COMMENT ON COLUMN public.profiles.chat_enabled IS 'Whether the mentor has enabled real-time chat';
COMMENT ON COLUMN public.profiles.profile_visibility IS 'Visibility setting: public, partners_only, or private';
COMMENT ON COLUMN public.profiles.mentorship_guidelines IS 'Mentor guidelines and expectations for mentees';

COMMENT ON COLUMN public.appointments.cv_url IS 'URL to mentee CV (PDF or video link)';
COMMENT ON COLUMN public.appointments.action_token IS 'Secure token for email action buttons (confirm/cancel)';
COMMENT ON COLUMN public.appointments.meeting_url IS 'Video conference meeting URL';
COMMENT ON COLUMN public.appointments.video_service IS 'Video service used: daily, zoom, or google_meet';
