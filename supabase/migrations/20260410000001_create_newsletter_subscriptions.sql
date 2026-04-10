-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    whatsapp TEXT,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to subscribe (insert)
CREATE POLICY "Allow public insertion for newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR INSERT 
TO public 
WITH CHECK (consent_given = true);

-- Create policy to allow only service_role to read subscriptions
CREATE POLICY "Allow service_role to read newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
TO service_role 
USING (true);

-- Grant permissions
GRANT INSERT ON public.newsletter_subscriptions TO anon, authenticated;
GRANT ALL ON public.newsletter_subscriptions TO service_role;
