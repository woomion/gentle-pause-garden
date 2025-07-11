-- Test accepting the current invitation manually
UPDATE partner_invitations 
SET status = 'accepted', invitee_id = '0e212ad7-c022-43de-a5f8-3a5894a12696'
WHERE id = '16b4b725-fc9b-4522-a84e-d0b92f62f8ef' 
AND invitee_email = 'jackson.w.reid@gmail.com' 
AND status = 'pending';