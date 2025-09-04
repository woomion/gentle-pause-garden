-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the check-ready-items function to run every minute
SELECT cron.schedule(
  'check-ready-items-every-minute',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/check-ready-items',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Also create a unique constraint to prevent duplicate notifications
ALTER TABLE paused_items 
ADD CONSTRAINT unique_individual_reminder_per_item 
UNIQUE (id, individual_reminder_sent_at);