-- Fix function search path mutable warnings by setting proper search_path

-- Fix get_user_subscription_tier function
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tier TEXT;
BEGIN
  -- For now, return 'free' for all users
  -- This will be updated when subscription system is implemented
  RETURN 'free';
END;
$$;

-- Fix get_subscription_tier function
CREATE OR REPLACE FUNCTION public.get_subscription_tier(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT s.tier INTO tier
  FROM public.subscribers s
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND (s.expires_at IS NULL OR s.expires_at > now());
  
  RETURN COALESCE(tier, 'free');
END;
$$;

-- Fix has_pause_partner_access function
CREATE OR REPLACE FUNCTION public.has_pause_partner_access(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.get_subscription_tier(user_uuid) IN ('premium', 'pause_partner');
END;
$$;

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(endpoint_name text, max_requests integer DEFAULT 100, window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := date_trunc('hour', now()) + 
                  (EXTRACT(minute FROM now())::INTEGER / window_minutes) * 
                  (window_minutes || ' minutes')::INTERVAL;
  
  SELECT requests_count INTO current_count
  FROM public.rate_limits
  WHERE user_id = auth.uid() 
    AND endpoint = endpoint_name 
    AND window_start = window_start;
  
  IF current_count IS NULL THEN
    -- First request in this window
    INSERT INTO public.rate_limits (user_id, endpoint, window_start)
    VALUES (auth.uid(), endpoint_name, window_start);
    RETURN TRUE;
  ELSIF current_count < max_requests THEN
    -- Under the limit, increment counter
    UPDATE public.rate_limits 
    SET requests_count = requests_count + 1
    WHERE user_id = auth.uid() 
      AND endpoint = endpoint_name 
      AND window_start = window_start;
    RETURN TRUE;
  ELSE
    -- Over the limit
    RETURN FALSE;
  END IF;
END;
$$;

-- Fix get_user_partners function
CREATE OR REPLACE FUNCTION public.get_user_partners(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(partner_id uuid, partner_email text, partner_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN pi.inviter_id = user_uuid THEN pi.invitee_id
      ELSE pi.inviter_id
    END as partner_id,
    CASE 
      WHEN pi.inviter_id = user_uuid THEN pi.invitee_email::text
      ELSE (SELECT email::text FROM auth.users WHERE id = pi.inviter_id)
    END as partner_email,
    COALESCE(p.first_name, 'Partner')::text as partner_name
  FROM public.partner_invitations pi
  LEFT JOIN public.profiles p ON p.id = CASE 
    WHEN pi.inviter_id = user_uuid THEN pi.invitee_id
    ELSE pi.inviter_id
  END
  WHERE (pi.inviter_id = user_uuid OR pi.invitee_id = user_uuid)
    AND pi.status = 'accepted';
END;
$$;