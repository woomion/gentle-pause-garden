-- Add push notification support to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT;

-- Create index for faster push token lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_push_token 
ON public.user_settings(push_token) 
WHERE push_token IS NOT NULL;