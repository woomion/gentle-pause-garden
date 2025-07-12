import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Users, Clock, Tag, Trash2 } from 'lucide-react';
import PausedItemsCarousel from '@/components/PausedItemsCarousel';
import PausedItemDetail from '@/components/PausedItemDetail';
import { PausedItem } from '@/stores/pausedItemsStore';
import { calculateCheckInTimeDisplay } from '@/utils/pausedItemsUtils';
import { extractProductLinkFromNotes, extractActualNotes } from '@/utils/notesMetadataUtils';

const PartnerFeedTab = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PausedItem | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  
  const { hasPausePartnerAccess } = useSubscription();
  const { toast } = useToast();
  const [showInviteSection, setShowInviteSection] = useState(false);
  // Get partners using the Supabase function
  const { partners, invitations, loading, sendInvite, removePartner, resendInvite, acceptInvite } = usePausePartners();

  // Get shared items from the store
  const [sharedItems, setSharedItems] = useState<PausedItem[]>([]);
  
  useEffect(() => {
    const fetchSharedItems = async () => {
      if (!partners.length) {
        setSharedItems([]);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get items shared with partners (items current user created and shared)
        const { data: mySharedItems, error: myError } = await supabase
          .from('paused_items')
          .select('*')
          .eq('user_id', user.id)
          .not('shared_with_partners', 'eq', '{}')
          .eq('status', 'paused');

        // Get items shared with current user (items partners created and shared with me)
        const partnerIds = partners.map(p => p.partner_id);
        const { data: partnersSharedItems, error: partnersError } = await supabase
          .from('paused_items')
          .select('*')
          .in('user_id', partnerIds)
          .contains('shared_with_partners', [user.id])
          .eq('status', 'paused');

        if (myError || partnersError) {
          console.error('Error fetching shared items:', myError || partnersError);
          return;
        }

        // Helper function to extract the actual product link
        const getProductLink = (item: any) => {
          // First try to extract from notes metadata
          const notesProductLink = extractProductLinkFromNotes(item.notes);
          if (notesProductLink) {
            console.log('📝 Found product link in notes:', notesProductLink);
            return notesProductLink;
          }
          
          // Check if the URL looks like a product page (not an image)
          const url = item.url;
          if (url && !url.includes('cart-placeholder')) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
            const isImageUrl = imageExtensions.some(ext => url.toLowerCase().includes(ext));
            if (!isImageUrl) {
              console.log('🔗 Using URL as product link:', url);
              return url;
            }
          }
          
          console.log('⚠️ No valid product link found for item:', item.title);
          return '';
        };

        // Combine and format the items to match PausedItem interface
        const allSharedItems = [
          ...(mySharedItems || []).map((item: any) => {
            const productLink = getProductLink(item);
            const cleanNotes = extractActualNotes(item.notes);
            
            return {
              id: item.id,
              itemName: item.title,
              storeName: item.store_name || 'Unknown Store',
              price: item.price?.toString() || '0',
              imageUrl: item.image_url || '',
              emotion: item.emotion || item.reason || 'unknown',
              notes: cleanNotes || '',
              duration: `${item.pause_duration_days} days`,
              otherDuration: item.other_duration || '',
              link: productLink,
              photo: null,
              photoDataUrl: '',
              tags: item.tags || [],
              pausedAt: new Date(item.created_at),
              checkInTime: calculateCheckInTimeDisplay(new Date(item.review_at)),
              checkInDate: item.review_at,
              isCart: item.is_cart || false,
              itemType: item.item_type || 'item',
              sharedWithPartners: item.shared_with_partners || []
            };
          }),
          ...(partnersSharedItems || []).map((item: any) => {
            const productLink = getProductLink(item);
            const cleanNotes = extractActualNotes(item.notes);
            
            return {
              id: item.id,
              itemName: item.title,
              storeName: item.store_name || 'Unknown Store',
              price: item.price?.toString() || '0',
              imageUrl: item.image_url || '',
              emotion: item.emotion || item.reason || 'unknown',
              notes: cleanNotes || '',
              duration: `${item.pause_duration_days} days`,
              otherDuration: item.other_duration || '',
              link: productLink,
              photo: null,
              photoDataUrl: '',
              tags: item.tags || [],
              pausedAt: new Date(item.created_at),
              checkInTime: calculateCheckInTimeDisplay(new Date(item.review_at)),
              checkInDate: item.review_at,
              isCart: item.is_cart || false,
              itemType: item.item_type || 'item',
              sharedWithPartners: item.shared_with_partners || []
            };
          })
        ];

        setSharedItems(allSharedItems);
      } catch (error) {
        console.error('Error fetching shared items:', error);
      }
    };

    fetchSharedItems();
    
    // Set up real-time subscription for shared items
    const channel = supabase
      .channel('shared-paused-items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paused_items',
        },
        () => {
          fetchSharedItems(); // Reload when any paused item changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partners]);

  

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
    // Find the invitation by email
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
    // Find the invitation by email
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

  const handleRemovePartner = async (partnerId: string, partnerEmail: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First check if there are shared pauses that need to be moved
    const { data: sharedPauses, error: pausesError } = await supabase
      .from('paused_items')
      .select('*')
      .eq('user_id', user.id)
      .contains('shared_with_partners', [partnerId]);

    if (pausesError) {
      console.error('Error checking shared pauses:', pausesError);
      return;
    }

    const hasSharedPauses = sharedPauses && sharedPauses.length > 0;

    if (hasSharedPauses) {
      // Show confirmation dialog
      const shouldMoveToPersonal = window.confirm(
        `You have ${sharedPauses.length} pause(s) shared with this partner. Would you like to move them back to your personal "My Pauses" section? (Note: This will only move pauses you created, not ones your partner added.)`
      );

      if (shouldMoveToPersonal) {
        // Remove partner from shared_with_partners array for user's pauses
        for (const pause of sharedPauses) {
          const updatedSharedWith = pause.shared_with_partners?.filter((id: string) => id !== partnerId) || [];
          
          const { error: updateError } = await supabase
            .from('paused_items')
            .update({ shared_with_partners: updatedSharedWith })
            .eq('id', pause.id);

          if (updateError) {
            console.error('Error updating pause:', updateError);
          }
        }
      }
    }

    try {
      // Remove the partnership
      const { error } = await supabase
        .from('partner_invitations')
        .delete()
        .or(`and(inviter_id.eq.${user.id},invitee_id.eq.${partnerId}),and(inviter_id.eq.${partnerId},invitee_id.eq.${user.id})`)
        .eq('status', 'accepted');

      if (error) throw error;

      // The usePausePartners hook will automatically refresh the data via real-time subscription
      
      toast({
        title: "Success",
        description: "Partner removed successfully.",
      });
    } catch (error) {
      console.error('Error removing partner:', error);
      toast({
        title: "Error",
        description: "Failed to remove partner.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!hasPausePartnerAccess) {
    return (
      <div className="mb-8">
        <div className="text-center py-12">
          <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2 text-black dark:text-[#F9F5EB]">
            Upgrade to Pause Partner
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect with partners, share pause items, and support each other's mindful shopping journey.
          </p>
          <Button>Upgrade Now</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-8">
      {/* Show Partner Connection section if no partners OR if user wants to add more */}
      {(partners.length === 0 || showInviteSection) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-black dark:text-[#F9F5EB]">Your Pause Partners</CardTitle>
                <p className="text-muted-foreground">
                  Connect with someone you trust to help you reflect before you spend.
                </p>
              </div>
              {partners.length > 0 && showInviteSection && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowInviteSection(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Back to Shared Pauses
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="partner@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendInvite} 
                disabled={isInviting || loading}
                className="bg-invite-button text-invite-button-foreground hover:bg-invite-button/90"
              >
                {isInviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>

            {(partners.length === 0 && invitations.length === 0) ? (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  Mindful decisions are easier with support. Send an invite to start pausing together.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show sent invites */}
                {invitations.map((invite, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className={`h-8 w-8 ${invite.status === 'pending' ? 'bg-yellow-100 border-2 border-yellow-400 dark:bg-yellow-900 dark:border-yellow-500' : ''}`}>
                        <AvatarFallback className={`text-sm ${invite.status === 'pending' ? 'text-yellow-800 dark:text-yellow-200' : ''}`}>
                          {invite.invitee_email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black dark:text-[#F9F5EB]">{invite.invitee_email}</p>
                        <p className="text-xs text-muted-foreground mb-1">
                          Invite sent
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={invite.status === 'accepted' ? 'default' : 'outline'}
                            className={`text-xs ${invite.status === 'accepted' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                              : 'border-yellow-400 text-yellow-700 bg-yellow-50 dark:border-yellow-500 dark:text-yellow-300 dark:bg-yellow-950'
                            }`}
                          >
                            {invite.status === 'pending' ? 'Pending' : 'Linked!'}
                          </Badge>
                          {invite.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvite(invite.invitee_email)}
                                className="h-auto p-1 text-xs text-muted-foreground hover:text-muted-foreground/80"
                              >
                                resend invite
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInvite(invite.invitee_email)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-muted-foreground/80"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show connected partners */}
                {partners.map((partner) => (
                  <div key={partner.partner_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {getInitials(partner.partner_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-[#F9F5EB]">{partner.partner_name}</p>
                        <p className="text-xs text-muted-foreground">{partner.partner_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Linked!
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePartner(partner.partner_id, partner.partner_email)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-muted-foreground/80"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show Partner Pauses section if partners exist and not showing invite section */}
      {partners.length > 0 && !showInviteSection && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-black dark:text-[#F9F5EB]">Shared Pauses</CardTitle>
                <p className="text-muted-foreground">
                  See items you've chosen to pause on together.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowInviteSection(true)}
                className="flex items-center gap-1 text-xs"
              >
                <Users className="h-3 w-3" />
                <span>+</span>
                <span className="hidden sm:inline">Add another partner</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sharedItems.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  No shared pauses yet. Once connected, you'll see items you've chosen to reflect on together.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sort/Filter Dropdown */}
                <div className="flex justify-end">
                  <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Partners</SelectItem>
                      {partners.map((partner) => (
                        <SelectItem key={partner.partner_id} value={partner.partner_name}>
                          {partner.partner_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shared Items Carousel */}
                <div className="space-y-4">
                  <PausedItemsCarousel 
                    items={sharedItems}
                    onItemClick={(item) => setSelectedItem(item)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Modal for selected shared item */}
      {selectedItem && (
        <PausedItemDetail
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={(id) => {
            // Handle delete if needed - for now just close
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

export default PartnerFeedTab;