-- Add column to track when individual reminder was sent
ALTER TABLE public.paused_items 
ADD COLUMN individual_reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;