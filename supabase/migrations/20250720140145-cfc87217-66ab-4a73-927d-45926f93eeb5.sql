
-- Add notification scheduling columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS notification_schedule_type TEXT DEFAULT 'immediate' CHECK (notification_schedule_type IN ('immediate', 'batched', 'custom_time')),
ADD COLUMN IF NOT EXISTS notification_time_preference TIME DEFAULT '20:00'::TIME,
ADD COLUMN IF NOT EXISTS notification_batch_window INTEGER DEFAULT 30, -- minutes to batch notifications
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00'::TIME,
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '08:00'::TIME,
ADD COLUMN IF NOT EXISTS notification_profile TEXT DEFAULT 'default' CHECK (notification_profile IN ('default', 'parent_mode', 'morning_person', 'work_focus', 'custom'));

-- Create notification queue table for batching
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES paused_items(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'review_ready',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled'))
);

-- Add RLS policies for notification_queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification queue" 
  ON public.notification_queue 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" 
  ON public.notification_queue 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notification_queue 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_status 
ON public.notification_queue(user_id, status, scheduled_for);

-- Create notification history table for analytics
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  items_count INTEGER NOT NULL DEFAULT 1,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS for notification history
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification history" 
  ON public.notification_history 
  FOR SELECT 
  USING (auth.uid() = user_id);
