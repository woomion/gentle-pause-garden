-- Create a cron job for daily batch notifications
-- This will run every hour and check if any users need batch notifications at this hour
SELECT cron.schedule(
  'send-daily-batch-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
  select
    net.http_post(
        url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-item-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
        body:='{"type": "batch"}'::jsonb
    ) as request_id;
  $$
);