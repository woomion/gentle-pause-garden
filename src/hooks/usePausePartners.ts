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
      // Check if there's already a pending invitation to this email
      const { data: existingInvite } = await supabase
        .from('partner_invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .eq('invitee_email', email.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();

      let invitation;
      if (existingInvite) {
        // Use existing invitation
        invitation = existingInvite;
      } else {
        // Create new invitation
        const { data: newInvitation, error } = await supabase
          .from('partner_invitations')
          .insert({
            inviter_id: user.id,
            invitee_email: email.toLowerCase()
          })
          .select()
          .single();

        if (error) throw error;
        invitation = newInvitation;
      }

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
    console.log('🚀 acceptInvite called with ID:', invitationId);
    
    if (!user) {
      console.log('❌ No user found, cannot accept invitation');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log('=== ACCEPTING INVITATION ===');
      console.log('✅ Invitation ID:', invitationId);
      console.log('✅ User ID:', user.id);
      console.log('✅ User email:', user.email);

      // Check if the invitation exists and is for this user
      const { data: invitation, error: fetchError } = await supabase
        .from('partner_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      console.log('📋 Database query result:');
      console.log('  - Invitation data:', invitation);
      console.log('  - Fetch error:', fetchError);
      
      if (fetchError) {
        console.error('❌ Error fetching invitation:', fetchError);
        return { success: false, error: 'Invitation not found' };
      }

      if (!invitation) {
        console.log('❌ No invitation found');
        return { success: false, error: 'Invitation not found' };
      }

      // Check if this invitation is for the current user's email
      const inviteeEmailLower = invitation.invitee_email.toLowerCase();
      const userEmailLower = user.email?.toLowerCase();
      
      console.log('📧 Email comparison:');
      console.log('  - Invitation email:', inviteeEmailLower);
      console.log('  - User email:', userEmailLower);
      console.log('  - Match:', inviteeEmailLower === userEmailLower);

      if (inviteeEmailLower !== userEmailLower) {
        console.log('❌ Email mismatch!');
        return { success: false, error: 'This invitation is not for your email address' };
      }

      // Check if already accepted
      if (invitation.status === 'accepted') {
        console.log('✅ Invitation already accepted, refreshing partners...');
        await loadPartners(); // Refresh to show the partnership
        return { success: true, message: 'You are already connected as pause partners!' };
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        console.log('❌ Invitation status is not pending:', invitation.status);
        return { success: false, error: 'This invitation is no longer valid' };
      }

      console.log('🔄 Updating invitation to accepted...');

      // Update the invitation to accepted
      const { error: updateError } = await supabase
        .from('partner_invitations')
        .update({ 
          status: 'accepted',
          invitee_id: user.id 
        })
        .eq('id', invitationId)
        .eq('status', 'pending'); // Safety check

      console.log('💾 Update result:');
      console.log('  - Update error:', updateError);

      if (updateError) {
        console.error('❌ Database error accepting invitation:', updateError);
        return { success: false, error: 'Failed to accept invitation. Please try again.' };
      }
      
      console.log('✅ Successfully accepted invitation, reloading partners...');
      await loadPartners();
      console.log('🎉 Partners reloaded successfully!');
      return { success: true, message: 'Successfully connected as pause partners!' };
    } catch (error: any) {
      console.error('💥 Error accepting invite:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
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