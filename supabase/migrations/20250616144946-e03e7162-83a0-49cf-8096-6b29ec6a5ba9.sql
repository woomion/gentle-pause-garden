
-- First, let's see what the current check constraint allows
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'paused_items_status_check';

-- Update the check constraint to allow both 'purchased' and 'let-go' statuses
ALTER TABLE paused_items 
DROP CONSTRAINT IF EXISTS paused_items_status_check;

ALTER TABLE paused_items 
ADD CONSTRAINT paused_items_status_check 
CHECK (status IN ('paused', 'purchased', 'let-go'));
