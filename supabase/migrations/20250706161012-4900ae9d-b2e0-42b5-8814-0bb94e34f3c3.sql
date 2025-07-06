-- Security Audit and Improvements for Pocket Pause

-- 1. Add data validation constraints and triggers
-- Ensure pause duration is reasonable (1 day to 1 year)
ALTER TABLE public.paused_items 
ADD CONSTRAINT pause_duration_reasonable 
CHECK (pause_duration_days >= 1 AND pause_duration_days <= 365);

-- Ensure price is non-negative if provided
ALTER TABLE public.paused_items 
ADD CONSTRAINT price_non_negative 
CHECK (price IS NULL OR price >= 0);

-- Ensure title is not empty
ALTER TABLE public.paused_items 
ADD CONSTRAINT title_not_empty 
CHECK (title IS NOT NULL AND trim(title) != '');

-- Ensure review_at is in the future when item is created
CREATE OR REPLACE FUNCTION validate_review_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate on INSERT, allow updates for completed items
  IF TG_OP = 'INSERT' AND NEW.review_at <= NEW.created_at THEN
    RAISE EXCEPTION 'Review date must be after creation date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_review_date_trigger
  BEFORE INSERT ON public.paused_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_review_date();

-- 2. Add audit logging for security events
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log (only admins should see all logs)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit entries
CREATE POLICY "Users can view their own audit log" 
ON public.security_audit_log 
FOR SELECT 
USING (user_id = auth.uid());

-- 3. Create audit trigger for paused_items
CREATE OR REPLACE FUNCTION audit_paused_items()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    'paused_items',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_paused_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.paused_items
  FOR EACH ROW
  EXECUTE FUNCTION audit_paused_items();

-- 4. Improve storage security policies
-- More restrictive policies for paused-items bucket
CREATE POLICY "Users can only upload to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'paused-items' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can only view their own files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'paused-items' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can only update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'paused-items' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can only delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'paused-items' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Add security function for future subscription validation
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  tier TEXT;
BEGIN
  -- For now, return 'free' for all users
  -- This will be updated when subscription system is implemented
  RETURN 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Create rate limiting table for API calls
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit data
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (user_id = auth.uid());

-- 7. Add function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  endpoint_name TEXT,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;