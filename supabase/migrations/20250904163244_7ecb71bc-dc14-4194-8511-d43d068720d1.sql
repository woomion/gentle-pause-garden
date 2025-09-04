-- Remove duplicate/redundant cron jobs
-- Keep only the main every-minute check-ready-items job (job 9)
-- Remove the 5-minute and 10-minute jobs that are causing duplicates

SELECT cron.unschedule(5); -- Remove 5-minute job
SELECT cron.unschedule(7); -- Remove 10-minute job

-- Also remove the hourly send-item-notifications job since the minute job already handles this
SELECT cron.unschedule(8);