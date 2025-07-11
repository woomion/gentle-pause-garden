-- Accept the current pending invitation
UPDATE partner_invitations 
SET status = 'accepted', invitee_id = '0e212ad7-c022-43de-a5f8-3a5894a12696'
WHERE id = '41519b71-dd0a-4891-8498-a131b8becf05' 
AND invitee_email = 'jackson.w.reid@gmail.com' 
AND status = 'pending';