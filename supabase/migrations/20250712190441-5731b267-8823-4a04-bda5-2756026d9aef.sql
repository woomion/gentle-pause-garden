-- Add missing fields to paused_items table to match PausedItem interface
-- Add store_name field for store information
ALTER TABLE public.paused_items 
ADD COLUMN IF NOT EXISTS store_name TEXT;

-- Add image_url field for item images
ALTER TABLE public.paused_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add item_type field to distinguish between regular items and carts
ALTER TABLE public.paused_items 
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'item';

-- Add is_cart boolean field for cart items
ALTER TABLE public.paused_items 
ADD COLUMN IF NOT EXISTS is_cart BOOLEAN DEFAULT false;

-- Add emotion field to store the emotion/reason
ALTER TABLE public.paused_items 
ADD COLUMN IF NOT EXISTS emotion TEXT;

-- Add other_duration field for custom pause durations
ALTER TABLE public.paused_items 
ADD COLUMN IF NOT EXISTS other_duration TEXT;