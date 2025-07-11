import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Partner {
  partner_id: string;
  partner_email: string;
  partner_name: string;
}

export interface PartnerInvitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export const usePausePartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to changes in partner_invitations table
    const channel = supabase
      .channel('partner-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'partner_invitations',
          filter: `inviter_id=eq.${user.id},invitee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time partner invitation change:', payload);
          // Reload partners and invitations when any change occurs
          loadPartners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadPartners = async () => {
    if (!user) {
      setPartners([]);
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      // Load accepted partnerships
      const { data: partnersData, error: partnersError } = await supabase
        .rpc('get_user_partners');

      if (partnersError) {
        console.error('Error loading partners:', partnersError);
      } else {
        setPartners(partnersData || []);
      }

      // Load all invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('partner_invitations')
        .select('*')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error loading invitations:', invitationsError);
      } else {
        setInvitations((invitationsData || []) as PartnerInvitation[]);
      }
    } catch (error) {
      console.error('Error in loadPartners:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (email: string) => {
    if (!user) return;

    try {
      const { data: invitation, error } = await supabase
        .from('partner_invitations')
        .insert({
          inviter_id: user.id,
          invitee_email: email.toLowerCase()
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        await supabase.functions.invoke('send-invitation-email', {
          body: {
            inviterName: profile?.first_name || 'A PocketPause user',
            inviterEmail: user.email || '',
            inviteeEmail: email.toLowerCase(),
            invitationId: invitation.id
          }
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the whole operation if email fails
      }

      await loadPartners();
      return { success: true };
    } catch (error: any) {
      console.error('Error sending invite:', error);
      return { success: false, error: error.message };
    }
  };

  const acceptInvite = async (invitationId: string) => {
    if (!user) return;

    try {
      // First, check if the invitation exists and matches the user's email
      const { data: invitation, error: fetchError } = await supabase
        .from('partner_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError) {
        console.error('Error fetching invitation:', fetchError);
        throw fetchError;
      }

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Check if the invitation is for this user's email
      if (invitation.invitee_email.toLowerCase() !== user.email?.toLowerCase()) {
        throw new Error('This invitation is not for your email address');
      }

      // Check if already accepted
      if (invitation.status === 'accepted') {
        return { success: true, message: 'Invitation already accepted' };
      }

      const { error } = await supabase
        .from('partner_invitations')
        .update({ 
          status: 'accepted',
          invitee_id: user.id 
        })
        .eq('id', invitationId);

      if (error) throw error;
      await loadPartners();
      return { success: true };
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      return { success: false, error: error.message };
    }
  };

  const removePartner = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('partner_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      await loadPartners();
      return { success: true };
    } catch (error: any) {
      console.error('Error removing partner:', error);
      return { success: false, error: error.message };
    }
  };

  const resendInvite = async (invitationId: string, email: string) => {
    if (!user) return;

    try {
      // Get user profile for invitation email
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      // Send invitation email
      await supabase.functions.invoke('send-invitation-email', {
        body: {
          inviterName: profile?.first_name || 'A PocketPause user',
          inviterEmail: user.email || '',
          inviteeEmail: email.toLowerCase(),
          invitationId: invitationId
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error resending invite:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    loadPartners();
  }, [user]);

  return {
    partners,
    invitations,
    loading,
    sendInvite,
    acceptInvite,
    removePartner,
    resendInvite,
    reload: loadPartners
  };
};