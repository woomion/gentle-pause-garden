-- Reset back to pending for testing
UPDATE partner_invitations 
SET status = 'pending', invitee_id = NULL
WHERE id = '16b4b725-fc9b-4522-a84e-d0b92f62f8ef';