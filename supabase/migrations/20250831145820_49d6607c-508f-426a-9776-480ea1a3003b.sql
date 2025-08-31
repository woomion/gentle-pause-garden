-- Mark all items as having had individual reminders sent to stop notifications
UPDATE paused_items 
SET individual_reminder_sent_at = NOW() 
WHERE individual_reminder_sent_at IS NULL 
  AND review_at <= NOW();