-- Reset existing pending invitations to allow proper processing
UPDATE partner_invitations 
SET status = 'pending', invitee_id = NULL, updated_at = now()
WHERE status = 'pending' AND invitee_id IS NULL;