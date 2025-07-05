-- Add tags column to paused_items table
ALTER TABLE public.paused_items 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add an index for better performance when filtering by tags
CREATE INDEX idx_paused_items_tags ON public.paused_items USING GIN(tags);