
CREATE OR REPLACE FUNCTION save_google_calendar_tokens(p_user_id UUID, p_access_token TEXT, p_refresh_token TEXT, p_expiry_date BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.google_calendar_tokens (user_id, access_token, refresh_token, expiry_date, updated_at)
  VALUES (p_user_id, p_access_token, p_refresh_token, p_expiry_date, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expiry_date = EXCLUDED.expiry_date,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_google_calendar_tokens(p_user_id UUID)
RETURNS SETOF public.google_calendar_tokens AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.google_calendar_tokens WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
