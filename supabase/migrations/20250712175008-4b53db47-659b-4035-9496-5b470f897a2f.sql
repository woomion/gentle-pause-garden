-- Fix the SELECT policy for partner_invitations to allow users to see invitations for their email
-- The current policy prevents users from seeing pending invitations because invitee_id is NULL

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own invitations" ON partner_invitations;

-- Create a new SELECT policy that allows viewing when:
-- 1. User is the inviter_id (can see invitations they sent)
-- 2. User is the invitee_id (can see accepted invitations they're part of)  
-- 3. User's email matches invitee_email (can see pending invitations for their email)
CREATE POLICY "Users can view invitations for their email" 
ON partner_invitations 
FOR SELECT 
USING (
  (inviter_id = auth.uid()) OR 
  (invitee_id = auth.uid()) OR
  (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);