-- Reset the invitation back to pending for real testing
UPDATE partner_invitations 
SET status = 'pending', invitee_id = NULL
WHERE id = '41519b71-dd0a-4891-8498-a131b8becf05';