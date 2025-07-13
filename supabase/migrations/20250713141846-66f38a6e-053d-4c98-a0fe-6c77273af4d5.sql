-- Fix remaining function search path mutable warnings

-- Fix validate_review_date function
CREATE OR REPLACE FUNCTION public.validate_review_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only validate on INSERT, allow updates for completed items
  IF TG_OP = 'INSERT' AND NEW.review_at <= NEW.created_at THEN
    RAISE EXCEPTION 'Review date must be after creation date';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix get_current_user_email function
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT 
LANGUAGE plpgsql 
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  RETURN user_email;
END;
$$;

-- Fix audit_paused_items function
CREATE OR REPLACE FUNCTION public.audit_paused_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;