-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule check-ready-items edge function to run every 15 minutes
SELECT cron.schedule(
  'check-ready-items-every-15-min',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/check-ready-items',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
    body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Schedule batch notifications for users who prefer daily batches (runs at top of every hour)
SELECT cron.schedule(
  'send-batch-notifications-hourly',
  '0 * * * *', -- Every hour on the hour
  $$
  SELECT net.http_get(
    url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-item-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb
  ) as request_id;
  $$
);