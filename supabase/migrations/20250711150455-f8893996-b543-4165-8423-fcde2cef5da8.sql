-- Test accepting the invitation manually to see what happens
UPDATE partner_invitations 
SET status = 'accepted', invitee_id = '0e212ad7-c022-43de-a5f8-3a5894a12696'
WHERE id = '73338580-c48c-4c36-907e-912b71d9d0b0' 
AND invitee_email = 'jackson.w.reid@gmail.com' 
AND status = 'pending';