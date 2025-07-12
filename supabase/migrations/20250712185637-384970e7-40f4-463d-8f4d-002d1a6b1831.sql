-- Fix the UPDATE policy for partner_invitations to avoid auth.users table access
-- The current UPDATE policy is still trying to access auth.users which causes 403 errors

-- Drop the problematic UPDATE policy
DROP POLICY IF EXISTS "Users can update invitations for their email" ON partner_invitations;

-- Create a new UPDATE policy using the security definer function
CREATE POLICY "Users can update invitations for their email" 
ON partner_invitations 
FOR UPDATE 
USING (
  (invitee_id = auth.uid()) OR
  (invitee_email = public.get_current_user_email())
);