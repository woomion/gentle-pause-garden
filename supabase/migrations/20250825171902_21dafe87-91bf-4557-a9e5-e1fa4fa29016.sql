-- Add monthly usage tracking and email batching preference to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS email_batching_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monthly_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS usage_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Add index for monthly usage queries
CREATE INDEX IF NOT EXISTS idx_user_settings_usage_period ON public.user_settings(user_id, usage_year, usage_month);

-- Function to reset monthly usage when month changes
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  UPDATE public.user_settings 
  SET 
    monthly_usage_count = 0,
    usage_month = current_month,
    usage_year = current_year
  WHERE usage_month != current_month OR usage_year != current_year;
END;
$$;