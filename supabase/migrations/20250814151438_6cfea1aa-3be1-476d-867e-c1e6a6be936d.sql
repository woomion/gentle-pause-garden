-- Add values column to user_settings table for storing user's selected values
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS values_selected text[] DEFAULT '{}';

-- Add values_setup_completed flag to track if user has completed values selection
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS values_setup_completed boolean DEFAULT false;