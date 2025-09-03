-- Fix the notification trigger to use the correct URL and method
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_check_newly_ready_items ON public.paused_items;
DROP FUNCTION IF EXISTS check_newly_ready_items();

-- Unschedule the existing cron job
SELECT cron.unschedule('check-ready-items-periodic');

-- Create a simpler approach: trigger the check-ready-items function directly
-- when items become ready (review_at changes to past time)
CREATE OR REPLACE FUNCTION trigger_ready_items_check()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_ready_items_check
  AFTER UPDATE OF review_at ON public.paused_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ready_items_check();

-- Create a cron job to periodically check for items (backup)
SELECT cron.schedule(
  'periodic-ready-items-check',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/check-ready-items',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);