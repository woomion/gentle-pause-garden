-- Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_invitations table
CREATE TABLE public.partner_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inviter_id, invitee_email)
);

-- Create item_comments table
CREATE TABLE public.item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.paused_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add shared_with_partners column to paused_items
ALTER TABLE public.paused_items 
ADD COLUMN shared_with_partners UUID[] DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription" ON public.subscribers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS policies for partner_invitations
CREATE POLICY "Users can view their own invitations" ON public.partner_invitations
  FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

CREATE POLICY "Users can create invitations" ON public.partner_invitations
  FOR INSERT WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update their received invitations" ON public.partner_invitations
  FOR UPDATE USING (invitee_id = auth.uid());

-- RLS policies for item_comments
CREATE POLICY "Users can view comments on items they can see" ON public.item_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paused_items 
      WHERE id = item_id 
      AND (user_id = auth.uid() OR auth.uid() = ANY(shared_with_partners))
    )
  );

CREATE POLICY "Users can create comments on shared items" ON public.item_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.paused_items 
      WHERE id = item_id 
      AND (user_id = auth.uid() OR auth.uid() = ANY(shared_with_partners))
    )
  );

-- Update paused_items RLS to include shared items
DROP POLICY IF EXISTS "Users can view their own paused items" ON public.paused_items;
CREATE POLICY "Users can view their own and shared paused items" ON public.paused_items
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() = ANY(shared_with_partners));

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_subscription_tier(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT s.tier INTO tier
  FROM public.subscribers s
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND (s.expires_at IS NULL OR s.expires_at > now());
  
  RETURN COALESCE(tier, 'free');
END;
$$;

-- Function to check if user has pause partner access
CREATE OR REPLACE FUNCTION public.has_pause_partner_access(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN public.get_subscription_tier(user_uuid) IN ('premium', 'pause_partner');
END;
$$;

-- Create function to get user's partners
CREATE OR REPLACE FUNCTION public.get_user_partners(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(partner_id UUID, partner_email TEXT, partner_name TEXT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN pi.inviter_id = user_uuid THEN pi.invitee_id
      ELSE pi.inviter_id
    END as partner_id,
    CASE 
      WHEN pi.inviter_id = user_uuid THEN pi.invitee_email
      ELSE (SELECT email FROM auth.users WHERE id = pi.inviter_id)
    END as partner_email,
    COALESCE(p.first_name, 'Partner') as partner_name
  FROM public.partner_invitations pi
  LEFT JOIN public.profiles p ON p.id = CASE 
    WHEN pi.inviter_id = user_uuid THEN pi.invitee_id
    ELSE pi.inviter_id
  END
  WHERE (pi.inviter_id = user_uuid OR pi.invitee_id = user_uuid)
    AND pi.status = 'accepted';
END;
$$;