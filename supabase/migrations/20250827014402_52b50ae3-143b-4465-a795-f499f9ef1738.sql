-- Add woodsmiche@gmail.com as a premium user for testing
-- First, we need to find the user_id for this email
-- Since we can't directly query auth.users, we'll use a different approach

-- Insert a premium subscription for the user with email woodsmiche@gmail.com
-- This will work when the user exists in the auth.users table
INSERT INTO public.subscribers (user_id, tier, status, started_at, expires_at)
SELECT 
  au.id,
  'premium'::text,
  'active'::text,
  now(),
  now() + interval '1 year'
FROM auth.users au
WHERE au.email = 'woodsmiche@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  tier = 'premium',
  status = 'active',
  expires_at = now() + interval '1 year',
  updated_at = now();