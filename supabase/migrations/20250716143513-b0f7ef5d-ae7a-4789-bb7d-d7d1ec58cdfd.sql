-- Clear existing notes from completed items (purchased/let-go) since these came from the original form, not reflections
UPDATE paused_items 
SET notes = NULL 
WHERE status IN ('purchased', 'let-go');