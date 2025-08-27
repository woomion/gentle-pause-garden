-- Add unique constraint on user_id first
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_user_id_unique UNIQUE (user_id);

-- Now insert the premium subscription for woodsmiche@gmail.com
INSERT INTO public.subscribers (user_id, tier, status, started_at, expires_at)
SELECT 
  au.id,
  'premium'::text,
  'active'::text,
  now(),
  now() + interval '1 year'
FROM auth.users au
WHERE au.email = 'woodsmiche@gmail.com';