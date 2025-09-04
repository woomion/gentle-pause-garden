-- Create user settings record for the current authenticated user if they don't have one
INSERT INTO public.user_settings (user_id, notifications_enabled, notification_delivery_style, notification_timing_hour, theme)
VALUES (auth.uid(), true, 'item_by_item', 18, 'light')
ON CONFLICT (user_id) DO UPDATE SET 
  notifications_enabled = EXCLUDED.notifications_enabled,
  notification_delivery_style = EXCLUDED.notification_delivery_style
WHERE user_settings.user_id = auth.uid();

-- Also ensure the profile exists
INSERT INTO public.profiles (id, first_name)
VALUES (auth.uid(), 'User')
ON CONFLICT (id) DO NOTHING;