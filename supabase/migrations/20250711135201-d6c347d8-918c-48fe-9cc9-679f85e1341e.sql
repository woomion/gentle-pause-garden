-- Clear any stuck invitations and reset them
DELETE FROM partner_invitations WHERE invitee_email = 'jackson.w.reid@gmail.com' AND status = 'pending';