-- Fix function search_path for trigger_ready_items_check
CREATE OR REPLACE FUNCTION public.trigger_ready_items_check()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only proceed if the item just became ready
  IF NEW.review_at <= NOW() AND (OLD.review_at IS NULL OR OLD.review_at > NOW()) THEN
    -- Call the check-ready-items function asynchronously
    PERFORM
      net.http_post(
        url := 'https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/check-ready-items',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$function$;