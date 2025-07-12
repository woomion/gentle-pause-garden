import { useState } from 'react';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
  
  const { partners, loading, sendInvite } = usePausePartners();
  const { hasPausePartnerAccess } = useSubscription();
  const { toast } = useToast();

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
      const result = await sendInvite(inviteEmail.trim());
      if (result?.success) {
        toast({
          title: "Invite sent!",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteEmail('');
      } else {
        throw new Error(result?.error || 'Failed to send invite');
      }
    } catch (error) {
      toast({
        title: "Failed to send invite",
        description: error instanceof Error ? error.message : "Something went wrong",
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
      {/* Section 1: Partner Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black dark:text-[#F9F5EB]">Your Pause Partners</CardTitle>
          <p className="text-muted-foreground">
            Connect with someone you trust to help you reflect before you spend.
          </p>
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
            >
              {isInviting ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>

          {partners.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">
                Mindful decisions are easier with support. Send an invite to start pausing together.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-black dark:text-[#F9F5EB]">Connected Partners</h4>
              <div className="flex flex-wrap gap-2">
                {partners.map((partner) => (
                  <Badge key={partner.partner_id} variant="secondary" className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {getInitials(partner.partner_name)}
                      </AvatarFallback>
                    </Avatar>
                    {partner.partner_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Shared Pauses Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black dark:text-[#F9F5EB]">Shared Pauses</CardTitle>
          <p className="text-muted-foreground">
            See items you've chosen to pause on together.
          </p>
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
    </div>
  );
};

export default PartnerFeedTab;