-- Fix the get_user_partners function type mismatch
CREATE OR REPLACE FUNCTION public.get_user_partners(user_uuid uuid DEFAULT auth.uid())
 RETURNS TABLE(partner_id uuid, partner_email text, partner_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN pi.inviter_id = user_uuid THEN pi.invitee_id
      ELSE pi.inviter_id
    END as partner_id,
    CASE 
      WHEN pi.inviter_id = user_uuid THEN pi.invitee_email::text
      ELSE (SELECT email::text FROM auth.users WHERE id = pi.inviter_id)
    END as partner_email,
    COALESCE(p.first_name, 'Partner')::text as partner_name
  FROM public.partner_invitations pi
  LEFT JOIN public.profiles p ON p.id = CASE 
    WHEN pi.inviter_id = user_uuid THEN pi.invitee_id
    ELSE pi.inviter_id
  END
  WHERE (pi.inviter_id = user_uuid OR pi.invitee_id = user_uuid)
    AND pi.status = 'accepted';
END;
$function$;