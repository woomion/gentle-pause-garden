-- Create database trigger to automatically check for ready items
-- This will trigger the notification function when items become ready

-- Create a function to check for newly ready items
CREATE OR REPLACE FUNCTION check_newly_ready_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the item just became ready (review_at <= now)
  IF NEW.review_at <= NOW() AND (OLD.review_at IS NULL OR OLD.review_at > NOW()) THEN
    -- Schedule the check-ready-items function to run
    PERFORM
      net.http_post(
        url := 'https://llcpqaatepzlbhsfvduy.supabase.co/functions/v1/check-ready-items',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
        body := '{}'::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on paused_items table
DROP TRIGGER IF EXISTS trigger_check_newly_ready_items ON public.paused_items;
CREATE TRIGGER trigger_check_newly_ready_items
  AFTER UPDATE OF review_at ON public.paused_items
  FOR EACH ROW
  EXECUTE FUNCTION check_newly_ready_items();

-- Also create a periodic job to check for ready items every 5 minutes
-- This catches any items that might have been missed by the trigger
SELECT cron.schedule(
  'check-ready-items-periodic',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://llcpqaatepzlbhsfvduy.supabase.co/functions/v1/check-ready-items',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
      body := '{}'::jsonb
    );
  $$
);