-- Fix the RLS policy for updating partner invitations
-- The current policy prevents accepting invitations because invitee_id is NULL initially

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their received invitations" ON partner_invitations;

-- Create a new policy that allows updates when:
-- 1. User is already set as invitee_id (for existing accepted invitations)
-- 2. User's email matches invitee_email (for accepting pending invitations)
CREATE POLICY "Users can update invitations for their email" 
ON partner_invitations 
FOR UPDATE 
USING (
  (invitee_id = auth.uid()) OR 
  (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);