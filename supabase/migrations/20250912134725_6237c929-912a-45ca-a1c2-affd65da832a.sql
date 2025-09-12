-- Add a test notification function
CREATE OR REPLACE FUNCTION send_test_push_notification(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Call the send-push-notifications function
  SELECT content INTO result
  FROM net.http_post(
    url := 'https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'userIds', jsonb_build_array(target_user_id),
      'title', 'Pocket Pause • Test Push',
      'body', 'If you see this, closed-app push works.',
      'data', jsonb_build_object('test', true)
    )
  );
  
  RETURN result;
END;
$$;