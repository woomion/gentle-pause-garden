-- Create user settings record for existing users who don't have one
INSERT INTO public.user_settings (user_id, notifications_enabled, notification_delivery_style)
SELECT id, true, 'item_by_item'
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings 
  WHERE user_settings.user_id = auth.users.id
);