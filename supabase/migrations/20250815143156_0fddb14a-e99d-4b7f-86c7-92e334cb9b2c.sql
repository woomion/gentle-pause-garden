-- Fix the cron job setup with correct schema references
-- First, unschedule any existing jobs to avoid conflicts
SELECT cron.unschedule('send-review-reminders-hourly');

-- Drop and recreate extensions properly
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Create extensions in extensions schema
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Recreate the cron job with correct function references
SELECT cron.schedule(
  'send-review-reminders-hourly',
  '0 * * * *', -- every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-review-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);