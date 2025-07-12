-- Fix the SELECT policy for partner_invitations to avoid auth.users table access
-- The previous policy was trying to access auth.users which causes permission errors

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view invitations for their email" ON partner_invitations;

-- Create a new SELECT policy that doesn't access auth.users table
-- We'll use a security definer function to safely get the user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create the new policy using the security definer function
CREATE POLICY "Users can view invitations for their email" 
ON partner_invitations 
FOR SELECT 
USING (
  (inviter_id = auth.uid()) OR 
  (invitee_id = auth.uid()) OR
  (invitee_email = public.get_current_user_email())
);