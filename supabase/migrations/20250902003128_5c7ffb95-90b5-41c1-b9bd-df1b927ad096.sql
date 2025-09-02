-- Add notification delivery and timing preferences to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN notification_delivery_style text DEFAULT 'item_by_item' CHECK (notification_delivery_style IN ('item_by_item', 'daily_batch', 'muted')),
ADD COLUMN notification_timing text DEFAULT 'evening' CHECK (notification_timing IN ('morning', 'afternoon', 'evening')),
ADD COLUMN notification_timing_hour integer DEFAULT 18 CHECK (notification_timing_hour BETWEEN 0 AND 23);