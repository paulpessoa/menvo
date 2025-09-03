-- Recriar a função e trigger para criação automática de perfis

-- 1. Recriar a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_slug TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  full_name_val TEXT;
BEGIN
  -- Extract metadata from the user
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- If full_name is empty but we have first/last, construct it
  IF full_name_val = '' AND (first_name_val != '' OR last_name_val != '') THEN
    full_name_val := trim(first_name_val || ' ' || last_name_val);
  END IF;
  
  -- Generate slug from full name or email
  IF full_name_val != '' THEN
    user_slug := public.generate_unique_slug(full_name_val);
  ELSE
    user_slug := public.generate_unique_slug(split_part(NEW.email, '@', 1));
  END IF;
  
  -- Create profile for new user with metadata
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    slug,
    verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NULLIF(first_name_val, ''),
    NULLIF(last_name_val, ''),
    user_slug,
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriar o trigger
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificar se foi criado corretamente
SELECT 'Trigger criado com sucesso!' as status;