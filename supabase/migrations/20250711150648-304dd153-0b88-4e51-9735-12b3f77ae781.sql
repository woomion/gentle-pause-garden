-- Reset the invitation back to pending for proper testing
UPDATE partner_invitations 
SET status = 'pending', invitee_id = NULL
WHERE id = '73338580-c48c-4c36-907e-912b71d9d0b0';