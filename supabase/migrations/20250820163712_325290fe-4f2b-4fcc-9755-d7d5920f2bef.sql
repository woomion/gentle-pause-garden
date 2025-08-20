-- Fix the function search path issue by setting search_path to empty string
CREATE OR REPLACE FUNCTION public.send_timezone_aware_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_utc_time TIMESTAMPTZ := NOW();
  user_record RECORD;
  user_local_time TIME;
  user_local_hour INTEGER;
BEGIN
  -- Loop through users with notifications enabled who haven't received a reminder today
  FOR user_record IN 
    SELECT 
      us.user_id,
      us.timezone,
      us.notification_time_preference,
      us.last_reminder_sent,
      au.email
    FROM public.user_settings us
    JOIN auth.users au ON au.id = us.user_id
    WHERE us.notifications_enabled = true
      AND (us.last_reminder_sent IS NULL OR us.last_reminder_sent < CURRENT_DATE)
  LOOP
    -- Calculate user's local time
    user_local_time := (current_utc_time AT TIME ZONE user_record.timezone)::TIME;
    user_local_hour := EXTRACT(HOUR FROM user_local_time);
    
    -- Check if it's within 30 minutes of their preferred notification time (default 7 PM)
    IF user_local_hour = EXTRACT(HOUR FROM COALESCE(user_record.notification_time_preference, '19:00:00'::TIME)) THEN
      -- Call the existing send-review-reminders function for this specific user
      PERFORM extensions.http_post(
        'https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-review-reminders'::text,
        '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
        json_build_object('user_id', user_record.user_id)::jsonb
      );
      
      -- Update last reminder sent date
      UPDATE public.user_settings 
      SET last_reminder_sent = CURRENT_DATE 
      WHERE user_id = user_record.user_id;
    END IF;
  END LOOP;
END;
$$;