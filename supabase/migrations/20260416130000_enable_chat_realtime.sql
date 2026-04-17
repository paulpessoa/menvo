-- =================================================================
-- ENABLE REALTIME FOR CHAT TABLES - REPLICA IDENTITY
-- Adds messages and conversations to the realtime publication
-- and ensures updates are captured correctly
-- =================================================================

BEGIN;

-- 1. Enable Realtime for the tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
END
$$;

-- 2. Set Replica Identity to FULL
-- This is CRITICAL for UPDATE events to correctly broadcast changes in fields like 'read_at'
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

COMMIT;
