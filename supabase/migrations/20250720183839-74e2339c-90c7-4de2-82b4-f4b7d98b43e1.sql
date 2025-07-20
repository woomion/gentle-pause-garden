-- Enable real-time updates for paused_items table
-- This ensures that partner pauses are updated in real-time

-- Set replica identity to capture full row data during updates
ALTER TABLE public.paused_items REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.paused_items;