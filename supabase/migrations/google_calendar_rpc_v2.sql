
DROP FUNCTION IF EXISTS save_google_calendar_tokens;
CREATE OR REPLACE FUNCTION save_google_calendar_tokens(
    p_user_id UUID, 
    p_access_token TEXT, 
    p_refresh_token TEXT, 
    p_expires_in INTEGER,
    p_scope TEXT DEFAULT 'https://www.googleapis.com/auth/calendar'
)
RETURNS VOID AS $$
DECLARE
    v_expiry_date BIGINT;
BEGIN
    -- Calcular expiry_date como timestamp em milissegundos
    v_expiry_date := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT + (p_expires_in * 1000)::BIGINT;

    INSERT INTO public.google_calendar_tokens (user_id, access_token, refresh_token, expiry_date, updated_at)
    VALUES (p_user_id, p_access_token, p_refresh_token, v_expiry_date, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expiry_date = EXCLUDED.expiry_date,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
