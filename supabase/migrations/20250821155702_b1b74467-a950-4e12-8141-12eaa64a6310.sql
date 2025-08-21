-- Add color_theme column to user_settings table
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT 'lavender';