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
    
    if (!result?.success) {
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

  if (!hasPausePartnerAccess) {
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Partner Management</h3>
        
        {/* Invite new partner */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="partner@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendInvite()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendInvite}
            disabled={isInviting || !inviteEmail.trim()}
            size="sm"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* All invitations and partners in one list */}
        <div className="space-y-2">
          {/* Connected partners */}
          {partners.map((partner) => {
            const invitation = invitations.find(inv => 
              (inv.inviter_id === partner.partner_id || inv.invitee_id === partner.partner_id) &&
              inv.status === 'accepted'
            );
            
            return (
              <div key={partner.partner_id} className="flex items-center justify-between p-2 border rounded text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{partner.partner_email}</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
                {invitation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePartner(invitation.id, partner.partner_email)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}

          {/* Received invitations */}
          {receivedInvites.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-2 border rounded text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{invitation.invitee_email}</span>
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                  Received
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvite(invitation.id, invitation.invitee_email)}
                  className="text-xs px-2 py-1 h-auto"
                >
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePartner(invitation.id, invitation.invitee_email)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Sent invitations */}
          {sentInvites.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-2 border rounded text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{invitation.invitee_email}</span>
                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                  Pending
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResendInvite(invitation.id, invitation.invitee_email)}
                  title="Resend"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePartner(invitation.id, invitation.invitee_email)}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {partners.length === 0 && pendingInvites.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>No partners yet. Send an invite to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PausePartnersSection;