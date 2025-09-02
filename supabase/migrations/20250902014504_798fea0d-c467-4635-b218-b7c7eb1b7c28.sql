-- Remove the old scheduled notification system
DROP FUNCTION IF EXISTS public.send_timezone_aware_reminders();

-- Remove the scheduled job (pg_cron)
SELECT cron.unschedule('send-review-reminders-hourly');