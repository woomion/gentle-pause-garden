-- Add DELETE policy for partner invitations
CREATE POLICY "Users can delete their own invitations" 
ON public.partner_invitations 
FOR DELETE 
USING ((inviter_id = auth.uid()) OR (invitee_id = auth.uid()));