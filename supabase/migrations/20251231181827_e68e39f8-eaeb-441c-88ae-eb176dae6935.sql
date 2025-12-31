-- Add reliable notification delivery tracking
ALTER TABLE public.paused_items
  ADD COLUMN IF NOT EXISTS individual_reminder_processing_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS individual_reminder_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS individual_reminder_last_error text NULL;

-- Index to speed up lookup of items needing notifications
CREATE INDEX IF NOT EXISTS idx_paused_items_ready_unnotified
  ON public.paused_items (review_at)
  WHERE status = 'paused' AND individual_reminder_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_paused_items_processing
  ON public.paused_items (individual_reminder_processing_at)
  WHERE individual_reminder_processing_at IS NOT NULL;