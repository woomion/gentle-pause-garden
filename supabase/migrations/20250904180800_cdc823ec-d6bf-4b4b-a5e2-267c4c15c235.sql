-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to check for ready items every minute
SELECT cron.schedule(
  'check-ready-items-notifications',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/check-ready-items',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA2MjY0MiwiZXhwIjoyMDY0NjM4NjQyfQ.gQMhxpHWzp4KWC3-TdWBCFVu1K9rPGSBE6a9K63hbD8"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);