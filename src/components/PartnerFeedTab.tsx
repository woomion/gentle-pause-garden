import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Users, Clock, Tag } from 'lucide-react';

const PartnerFeedTab = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [sentInvites, setSentInvites] = useState<Array<{ email: string; status: 'pending' | 'accepted' }>>([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  
  const { hasPausePartnerAccess } = useSubscription();
  const { toast } = useToast();

  // Load invitations from database on component mount
  useEffect(() => {
    const loadInvitations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invitations } = await supabase
        .from('partner_invitations')
        .select('invitee_email, status')
        .eq('inviter_id', user.id);

      if (invitations) {
        setSentInvites(invitations.map(inv => ({
          email: inv.invitee_email,
          status: inv.status === 'accepted' ? 'accepted' : 'pending'
        })));
      }
    };

    loadInvitations();
  }, []);

  // Handle invitation acceptance from URL parameter
  useEffect(() => {
    const handleInvitationAcceptance = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteId = urlParams.get('invite');
      
      if (!inviteId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // Update invitation status and set invitee_id
        const { error } = await supabase
          .from('partner_invitations')
          .update({ 
            status: 'accepted',
            invitee_id: user.id 
          })
          .eq('id', inviteId)
          .eq('status', 'pending');

        if (!error) {
          toast({
            title: "Invitation accepted!",
            description: "You are now connected as pause partners.",
          });
          
          // Clear the invite parameter from URL
          const url = new URL(window.location.href);
          url.searchParams.delete('invite');
          window.history.replaceState({}, '', url.toString());
          
          // Reload invitations to show updated status
          const { data: invitations } = await supabase
            .from('partner_invitations')
            .select('invitee_email, status')
            .eq('inviter_id', user.id);

          if (invitations) {
            setSentInvites(invitations.map(inv => ({
              email: inv.invitee_email,
              status: inv.status === 'accepted' ? 'accepted' : 'pending'
            })));
          }
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
      }
    };

    handleInvitationAcceptance();
  }, [toast]);

  // Mock data for now to avoid subscription issues
  const partners: any[] = []; // Empty for now to show the invite section
  const loading = false;

  // Mock shared items data for now - we'll replace this with real data later
  const sharedItems = [
    {
      id: '1',
      name: 'Wireless Noise-Canceling Headphones',
      price: 299.99,
      imageUrl: '/placeholder.svg',
      addedBy: 'You',
      timeLeft: '12 hours left',
      reflection: 'Do I really need another pair of headphones?',
      partnerName: 'Jack',
      partnerInitials: 'JD'
    },
    {
      id: '2', 
      name: 'Smart Fitness Watch',
      price: 199.50,
      imageUrl: '/placeholder.svg',
      addedBy: 'Jack',
      timeLeft: '2 days left',
      reflection: 'Will this actually motivate me to exercise more?',
      partnerName: 'Jack',
      partnerInitials: 'JD'
    }
  ];

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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from('partner_invitations')
        .insert({
          inviter_id: user.id,
          invitee_email: inviteEmail.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          inviterName: profile?.first_name || 'Someone',
          inviterEmail: user.email,
          inviteeEmail: inviteEmail.trim(),
          invitationId: invitation.id
        }
      });

      if (emailError) throw emailError;

      // Add the sent invite to the list
      setSentInvites(prev => [...prev, { email: inviteEmail.trim(), status: 'pending' }]);
      
      toast({
        title: "Invite sent!",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Failed to send invite",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
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

            {(partners.length === 0 && sentInvites.length === 0) ? (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  Mindful decisions are easier with support. Send an invite to start pausing together.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show sent invites */}
                {sentInvites.map((invite, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className={`h-8 w-8 ${invite.status === 'pending' ? 'bg-yellow-100 border-2 border-yellow-400 dark:bg-yellow-900 dark:border-yellow-500' : ''}`}>
                        <AvatarFallback className={`text-sm ${invite.status === 'pending' ? 'text-yellow-800 dark:text-yellow-200' : ''}`}>
                          {invite.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black dark:text-[#F9F5EB]">{invite.email}</p>
                        <p className="text-xs text-muted-foreground mb-1">
                          Invite sent
                        </p>
                        <Badge 
                          variant={invite.status === 'accepted' ? 'default' : 'outline'}
                          className={`text-xs ${invite.status === 'accepted' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                            : 'border-yellow-400 text-yellow-700 bg-yellow-50 dark:border-yellow-500 dark:text-yellow-300 dark:bg-yellow-950'
                          }`}
                        >
                          {invite.status === 'pending' ? 'Pending' : 'Linked!'}
                        </Badge>
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
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Linked!
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show Shared Pauses section if has partners */}
      {partners.length > 0 && (
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

                {/* Shared Items List */}
                <div className="space-y-4">
                  {sharedItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex gap-4">
                        {/* Item Image */}
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-black dark:text-[#F9F5EB]">{item.name}</h4>
                            <span className="font-semibold text-black dark:text-[#F9F5EB]">
                              ${item.price}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-xs">
                                  {item.addedBy === 'You' ? 'Y' : item.partnerInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span>Added by {item.addedBy}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{item.timeLeft}</span>
                            </div>
                          </div>

                          {item.reflection && (
                            <p className="text-sm text-muted-foreground italic">
                              "{item.reflection}"
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              With {item.partnerName}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PartnerFeedTab;