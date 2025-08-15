-- Move pg_cron and pg_net extensions from public to extensions schema
-- This resolves the "Extension in Public" security warning

-- Drop the existing extensions from public schema
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install extensions in the extensions schema
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Recreate the cron job with proper schema reference
SELECT extensions.cron.schedule(
  'send-review-reminders-hourly',
  '0 * * * *', -- every hour at minute 0
  $$
  SELECT
    extensions.http_post(
        url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-review-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);