-- Optimize RLS policies for better performance
-- Replace auth.uid() with (SELECT auth.uid()) and remove duplicate policies

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can create their own paused items" ON public.paused_items;
DROP POLICY IF EXISTS "Users can delete their own paused items" ON public.paused_items;
DROP POLICY IF EXISTS "Users can update their own paused items" ON public.paused_items;
DROP POLICY IF EXISTS "Users can view their own and shared paused items" ON public.paused_items;

DROP POLICY IF EXISTS "Users can create their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own audit log" ON public.security_audit_log;
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;

DROP POLICY IF EXISTS "Users can create invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Users can delete their own invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.partner_invitations;
DROP POLICY IF EXISTS "Users can update invitations for their email" ON public.partner_invitations;

DROP POLICY IF EXISTS "Users can view comments on items they can see" ON public.item_comments;
DROP POLICY IF EXISTS "Users can create comments on shared items" ON public.item_comments;

DROP POLICY IF EXISTS "Users can view their own read status" ON public.comment_read_status;
DROP POLICY IF EXISTS "Users can create their own read status" ON public.comment_read_status;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.comment_read_status;

DROP POLICY IF EXISTS "Users can view their own notification queue" ON public.notification_queue;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notification_queue;

DROP POLICY IF EXISTS "Users can view their own notification history" ON public.notification_history;

-- Recreate optimized policies for paused_items
CREATE POLICY "Users can create their own paused items" 
ON public.paused_items 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own paused items" 
ON public.paused_items 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own paused items" 
ON public.paused_items 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own and shared paused items" 
ON public.paused_items 
FOR SELECT 
USING ((user_id = (SELECT auth.uid())) OR ((SELECT auth.uid()) = ANY (shared_with_partners)));

-- Recreate optimized policies for user_settings (removing duplicate policy)
CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

-- Recreate optimized policies for profiles
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING ((SELECT auth.uid()) = id);

-- Recreate optimized policies for security_audit_log
CREATE POLICY "Users can view their own audit log" 
ON public.security_audit_log 
FOR SELECT 
USING (user_id = (SELECT auth.uid()));

-- Recreate optimized policies for rate_limits
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (user_id = (SELECT auth.uid()));

-- Recreate optimized policies for subscribers
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (user_id = (SELECT auth.uid()));

-- Recreate optimized policies for partner_invitations
CREATE POLICY "Users can create invitations" 
ON public.partner_invitations 
FOR INSERT 
WITH CHECK (inviter_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own invitations" 
ON public.partner_invitations 
FOR DELETE 
USING ((inviter_id = (SELECT auth.uid())) OR (invitee_id = (SELECT auth.uid())));

CREATE POLICY "Users can view invitations for their email" 
ON public.partner_invitations 
FOR SELECT 
USING ((inviter_id = (SELECT auth.uid())) OR (invitee_id = (SELECT auth.uid())) OR (invitee_email = get_current_user_email()));

CREATE POLICY "Users can update invitations for their email" 
ON public.partner_invitations 
FOR UPDATE 
USING ((invitee_id = (SELECT auth.uid())) OR (invitee_email = get_current_user_email()));

-- Recreate optimized policies for item_comments
CREATE POLICY "Users can view comments on items they can see" 
ON public.item_comments 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM paused_items
  WHERE ((paused_items.id = item_comments.item_id) AND ((paused_items.user_id = (SELECT auth.uid())) OR ((SELECT auth.uid()) = ANY (paused_items.shared_with_partners))))));

CREATE POLICY "Users can create comments on shared items" 
ON public.item_comments 
FOR INSERT 
WITH CHECK ((user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM paused_items
  WHERE ((paused_items.id = item_comments.item_id) AND ((paused_items.user_id = (SELECT auth.uid())) OR ((SELECT auth.uid()) = ANY (paused_items.shared_with_partners)))))));

-- Recreate optimized policies for comment_read_status
CREATE POLICY "Users can view their own read status" 
ON public.comment_read_status 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own read status" 
ON public.comment_read_status 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own read status" 
ON public.comment_read_status 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

-- Recreate optimized policies for notification_queue
CREATE POLICY "Users can view their own notification queue" 
ON public.notification_queue 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own notifications" 
ON public.notification_queue 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notification_queue 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

-- Recreate optimized policies for notification_history
CREATE POLICY "Users can view their own notification history" 
ON public.notification_history 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);