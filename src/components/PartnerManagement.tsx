import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Trash2, Crown, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PartnerManagementProps {
  onClose: () => void;
}

const PartnerManagement = ({ onClose }: PartnerManagementProps) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [partnerToRemove, setPartnerToRemove] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [sharedItemsToMove, setSharedItemsToMove] = useState<any[]>([]);
  const [showMoveItemsDialog, setShowMoveItemsDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPartnerSectionOpen, setIsPartnerSectionOpen] = useState(false);

  const { partners, invitations, loading, sendInvite, removePartner, resendInvite } = usePausePartners();
  const { hasPausePartnerAccess } = useSubscription();
  const { toast } = useToast();

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send an invite.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    
    try {
      const result = await sendInvite(inviteEmail.trim());
      
      if (result.success) {
        toast({
          title: "Invite sent!",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteEmail('');
      } else {
        toast({
          title: "Failed to send invite",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Failed to send invite",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteInvite = async (email: string) => {
    const invitation = invitations.find(inv => inv.invitee_email === email);
    if (!invitation) {
      toast({
        title: "Error",
        description: "Invitation not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await removePartner(invitation.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Invitation deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
      toast({
        title: "Error",
        description: "Failed to delete invitation.",
        variant: "destructive",
      });
    }
  };

  const handleResendInvite = async (email: string) => {
    const invitation = invitations.find(inv => inv.invitee_email === email);
    if (!invitation) {
      toast({
        title: "Error",
        description: "Invitation not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await resendInvite(invitation.id, email);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Invitation resent successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resend invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resending invite:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation.",
        variant: "destructive",
      });
    }
  };

  const initiatePartnerRemoval = async (partnerId: string, partnerEmail: string, partnerName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if there are shared pauses that need to be moved
    const { data: sharedPauses, error: pausesError } = await supabase
      .from('paused_items')
      .select('*')
      .eq('user_id', user.id)
      .contains('shared_with_partners', [partnerId]);

    if (pausesError) {
      console.error('Error checking shared pauses:', pausesError);
      toast({
        title: "Error",
        description: "Failed to check shared items. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setPartnerToRemove({ id: partnerId, email: partnerEmail, name: partnerName });
    setSharedItemsToMove(sharedPauses || []);
    
    // Always show confirmation dialog first
    setShowConfirmDialog(true);
  };

  const handleInitialConfirmation = () => {
    setShowConfirmDialog(false);
    
    if (sharedItemsToMove.length > 0) {
      setShowMoveItemsDialog(true);
    } else {
      handleConfirmRemoval(false);
    }
  };

  const handleConfirmRemoval = async (moveItems: boolean) => {
    if (!partnerToRemove) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (moveItems && sharedItemsToMove.length > 0) {
        // Remove partner from shared_with_partners array for user's pauses
        for (const pause of sharedItemsToMove) {
          const updatedSharedWith = pause.shared_with_partners?.filter(
            (id: string) => id !== partnerToRemove.id
          ) || [];
          
          const { error: updateError } = await supabase
            .from('paused_items')
            .update({ shared_with_partners: updatedSharedWith })
            .eq('id', pause.id);

          if (updateError) {
            console.error('Error updating pause:', updateError);
          }
        }
      }

      // Remove the partnership
      const { error } = await supabase
        .from('partner_invitations')
        .delete()
        .or(`and(inviter_id.eq.${user.id},invitee_id.eq.${partnerToRemove.id}),and(inviter_id.eq.${partnerToRemove.id},invitee_id.eq.${user.id})`)
        .eq('status', 'accepted');

      if (error) throw error;

      toast({
        title: "Success",
        description: `${partnerToRemove.name} removed successfully.${
          moveItems && sharedItemsToMove.length > 0 
            ? ` ${sharedItemsToMove.length} item(s) moved to your personal pauses.`
            : ''
        }`,
      });
    } catch (error) {
      console.error('Error removing partner:', error);
      toast({
        title: "Error",
        description: "Failed to remove partner.",
        variant: "destructive",
      });
    } finally {
      setPartnerToRemove(null);
      setSharedItemsToMove([]);
      setShowMoveItemsDialog(false);
      setShowConfirmDialog(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!hasPausePartnerAccess) {
    return (
      <div className="border-t border-gray-200 dark:border-white/20 pt-4">
        <div className="text-center py-6">
          <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2 text-black dark:text-[#F9F5EB]">
            Upgrade to Pause Partner
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Connect with partners, share pause items, and support each other's mindful shopping journey.
          </p>
          <Button size="sm">Upgrade Now</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-t border-gray-200 dark:border-white/20 pt-4">
        <Collapsible open={isPartnerSectionOpen} onOpenChange={setIsPartnerSectionOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors rounded p-2 -m-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-black dark:text-[#F9F5EB]">
                  Pause Partners
                </span>
              </div>
              {isPartnerSectionOpen ? (
                <ChevronDown size={16} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="partner@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
              className="flex-1 text-sm h-8"
            />
            <Button 
              onClick={handleSendInvite} 
              disabled={isInviting || loading}
              size="sm"
              className="bg-invite-button text-invite-button-foreground hover:bg-invite-button/90"
            >
              {isInviting ? 'Sending...' : 'Invite'}
            </Button>
          </div>

          {/* Partners and invitations list */}
          {(partners.length === 0 && invitations.length === 0) ? (
            <div className="text-center py-4">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">
                Mindful decisions are easier with support.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {/* Pending invitations */}
              {invitations.filter(invite => invite.status === 'pending').map((invite, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6 bg-yellow-100 border border-yellow-400 dark:bg-yellow-900 dark:border-yellow-500">
                      <AvatarFallback className="text-xs text-yellow-800 dark:text-yellow-200">
                        {invite.invitee_email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-black dark:text-[#F9F5EB] truncate">
                        {invite.invitee_email}
                      </p>
                      <Badge 
                        variant="outline"
                        className="text-xs border-yellow-400 text-yellow-700 bg-yellow-50 dark:border-yellow-500 dark:text-yellow-300 dark:bg-yellow-950"
                      >
                        Pending
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvite(invite.invitee_email)}
                      className="h-auto p-1 text-xs text-muted-foreground hover:text-muted-foreground/80"
                    >
                      resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.invitee_email)}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-muted-foreground/80"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Connected partners */}
              {partners.map((partner) => (
                <div key={partner.partner_id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6 border border-green-800 dark:border-green-100">
                      <AvatarFallback className="text-xs">
                        {getInitials(partner.partner_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-black dark:text-[#F9F5EB] truncate">
                        {partner.partner_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{partner.partner_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                      Linked
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => initiatePartnerRemoval(partner.partner_id, partner.partner_email, partner.partner_name)}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-muted-foreground/80"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Move items confirmation dialog */}
      <AlertDialog open={showMoveItemsDialog} onOpenChange={setShowMoveItemsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Partner & Move Shared Items?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You have {sharedItemsToMove.length} pause{sharedItemsToMove.length > 1 ? 's' : ''} shared with {partnerToRemove?.name}.
              </p>
              <p className="font-medium">
                Would you like to move the items you paused back to your personal "My Pauses" section?
              </p>
              <p className="text-xs text-muted-foreground">
                Note: This will only move items you created, not ones your partner added.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
            <AlertDialogCancel onClick={() => {
              setPartnerToRemove(null);
              setSharedItemsToMove([]);
              setShowMoveItemsDialog(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleConfirmRemoval(true)}
              className="bg-muted text-foreground hover:bg-muted/80"
            >
              Remove Partner & Move Pauses
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => handleConfirmRemoval(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Both Partner & Shared Pauses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Initial confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {partnerToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to remove {partnerToRemove?.name} as your pause partner?
              </p>
              <p className="italic text-muted-foreground">
                You will no longer be able to share pauses with them.
              </p>
              {sharedItemsToMove.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Note: Any comments or messages on shared items will be removed.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPartnerToRemove(null);
              setSharedItemsToMove([]);
              setShowConfirmDialog(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleInitialConfirmation}
              className="bg-muted text-foreground hover:bg-muted/80"
            >
              Remove Partner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PartnerManagement;