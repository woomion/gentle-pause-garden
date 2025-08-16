-- Check and remove all existing review reminder cron jobs
DO $$
DECLARE
    job_record RECORD;
BEGIN
    FOR job_record IN SELECT jobname FROM cron.job WHERE jobname LIKE '%review-reminder%'
    LOOP
        PERFORM cron.unschedule(job_record.jobname);
    END LOOP;
END
$$;

-- Create a new daily cron job that runs at 7pm (19:00) UTC
SELECT cron.schedule(
  'send-review-reminders-daily',
  '0 19 * * *', -- Daily at 7pm UTC
  $$
  SELECT
    net.http_post(
        url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-review-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);