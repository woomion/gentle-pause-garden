-- Enable real-time for partner_invitations table
ALTER TABLE public.partner_invitations REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_invitations;