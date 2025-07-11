import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Users, Mail, RotateCcw, CheckCircle } from 'lucide-react';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PausePartnersSection = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const { partners, invitations, loading, sendInvite, acceptInvite, removePartner, resendInvite } = usePausePartners();
  const { hasPausePartnerAccess } = useSubscription();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    const result = await sendInvite(inviteEmail.trim());
    
    if (result?.success) {
      toast({
        title: 'Invite sent!',
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } else {
      toast({
        title: 'Error sending invite',
        description: result?.error || 'Failed to send invitation',
        variant: 'destructive',
      });
    }
    setIsInviting(false);
  };

  const handleAcceptInvite = async (invitationId: string, inviterEmail: string) => {
    const result = await acceptInvite(invitationId);
    
    if (result?.success) {
      toast({
        title: 'Invitation accepted!',
        description: `You are now connected with ${inviterEmail}`,
      });
    } else {
      toast({
        title: 'Error accepting invite',
        description: result?.error || 'Failed to accept invitation',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePartner = async (invitationId: string, partnerEmail: string) => {
    const result = await removePartner(invitationId);
    
    if (result?.success) {
      toast({
        title: 'Partner removed',
        description: `Connection with ${partnerEmail} has been removed`,
      });
    } else {
      toast({
        title: 'Error removing partner',
        description: result?.error || 'Failed to remove partner',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvite = async (invitationId: string, email: string) => {
    const result = await resendInvite(invitationId, email);
    
    if (result?.success) {
      toast({
        title: 'Invite resent!',
        description: `Invitation resent to ${email}`,
      });
    } else {
      toast({
        title: 'Error resending invite',
        description: result?.error || 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  if (!hasPausePartnerAccess()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pause Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upgrade to connect with partners</h3>
            <p className="text-muted-foreground mb-4">
              Share pause items and support each other's mindful shopping journey
            </p>
            <Button>Upgrade to Pause Partner</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pause Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingInvites = invitations.filter(inv => inv.status === 'pending');
  const receivedInvites = pendingInvites.filter(inv => inv.invitee_id === user?.id);
  const sentInvites = pendingInvites.filter(inv => inv.inviter_id === user?.id);

  return (
    <div className="bg-white/60 dark:bg-white/10 rounded-lg p-4 space-y-6">
        {/* Invite new partner */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Invite partner by email</label>
          <div className="flex gap-2">
            <Input
              placeholder="partner@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendInvite()}
            />
            <Button 
              onClick={handleSendInvite}
              disabled={isInviting || !inviteEmail.trim()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </div>

        {/* Connected partners */}
        {partners.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Connected Partners</h4>
            {partners.map((partner) => {
              const invitation = invitations.find(inv => 
                (inv.inviter_id === partner.partner_id || inv.invitee_id === partner.partner_id) &&
                inv.status === 'accepted'
              );
              
              return (
                <div key={partner.partner_id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">{partner.partner_name}</p>
                      <p className="text-sm text-muted-foreground">{partner.partner_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                      ✓ Connected
                    </Badge>
                    {invitation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePartner(invitation.id, partner.partner_email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Received invitations */}
        {receivedInvites.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Received Invitations</h4>
            {receivedInvites.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Invitation from {invitation.invitee_email}</p>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(invitation.id, invitation.invitee_email)}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePartner(invitation.id, invitation.invitee_email)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sent invitations */}
        {sentInvites.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Sent Invitations</h4>
            {sentInvites.map((invitation) => (
              <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{invitation.invitee_email}</p>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
                    ⏳ Pending
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendInvite(invitation.id, invitation.invitee_email)}
                    title="Resend invitation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePartner(invitation.id, invitation.invitee_email)}
                    title="Delete invitation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {partners.length === 0 && pendingInvites.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No partners yet. Send an invite to get started!</p>
          </div>
        )}
    </div>
  );
};

export default PausePartnersSection;