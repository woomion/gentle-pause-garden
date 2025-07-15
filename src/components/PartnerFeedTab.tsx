import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Users, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PausedItemsCarousel from '@/components/PausedItemsCarousel';
import PausedItemDetail from '@/components/PausedItemDetail';
import PartnerItemsReadyBanner from '@/components/PartnerItemsReadyBanner';
import PartnerReviewModal from '@/components/PartnerReviewModal';
import { PausedItem } from '@/stores/supabasePausedItemsStore';
import { calculateCheckInTimeDisplay } from '@/utils/pausedItemsUtils';
import { extractProductLinkFromNotes, extractActualNotes } from '@/utils/notesMetadataUtils';

const PartnerFeedTab = () => {
  const [selectedItem, setSelectedItem] = useState<PausedItem | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partnerReviewModalOpen, setPartnerReviewModalOpen] = useState(false);
  const [partnerReviewItems, setPartnerReviewItems] = useState<PausedItem[]>([]);
  const [partnerReviewName, setPartnerReviewName] = useState<string>('');
  const [isPartnerSectionOpen, setIsPartnerSectionOpen] = useState(false);
  
  const { hasPausePartnerAccess } = useSubscription();
  const { toast } = useToast();
  
  // Get partners using the Supabase function - hooks must be called at top level
  const { partners } = usePausePartners();

  // Get shared items from the store
  const [sharedItems, setSharedItems] = useState<PausedItem[]>([]);
  const [componentLoaded, setComponentLoaded] = useState(false);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
        setComponentLoaded(true);
      } catch (error) {
        console.error('Error getting current user:', error);
        setCurrentUserId(null);
        setComponentLoaded(true);
      }
    };
    getCurrentUser();
  }, []);
  
  useEffect(() => {
    const fetchSharedItems = async () => {
      // Early return if no partners to avoid unnecessary API calls
      if (!partners.length || !currentUserId) {
        setSharedItems([]);
        return;
      }

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log('No authenticated user, clearing shared items');
          setSharedItems([]);
          return;
        }

        // Get items shared with partners (items current user created and shared)
        // Exclude items that are ready for review
        const { data: mySharedItems, error: myError } = await supabase
          .from('paused_items')
          .select('*')
          .eq('user_id', user.id)
          .not('shared_with_partners', 'eq', '{}')
          .eq('status', 'paused')
          .gt('review_at', new Date().toISOString());

        if (myError) {
          console.error('Error fetching my shared items:', myError);
          setSharedItems([]);
          return;
        }

        // Get items shared with current user (items partners created and shared with me)
        const partnerIds = partners.map(p => p.partner_id).filter(Boolean);
        let partnersSharedItems = [];
        
        if (partnerIds.length > 0) {
          const { data, error: partnersError } = await supabase
            .from('paused_items')
            .select('*')
            .in('user_id', partnerIds)
            .contains('shared_with_partners', [user.id])
            .eq('status', 'paused')
            .gt('review_at', new Date().toISOString());

          if (partnersError) {
            console.error('Error fetching partners shared items:', partnersError);
            // Don't return here, continue with just my shared items
          } else {
            partnersSharedItems = data || [];
          }
        }

        // Helper function to extract the actual product link
        const getProductLink = (item: any) => {
          try {
            // First try to extract from notes metadata
            const notesProductLink = extractProductLinkFromNotes(item.notes);
            if (notesProductLink) {
              return notesProductLink;
            }
            
            // Check if the URL looks like a product page (not an image)
            const url = item.url;
            if (url && !url.includes('cart-placeholder')) {
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
              const isImageUrl = imageExtensions.some(ext => url.toLowerCase().includes(ext));
              if (!isImageUrl) {
                return url;
              }
            }
            
            return '';
          } catch (error) {
            console.error('Error extracting product link:', error);
            return '';
          }
        };

        // Safely convert database items to PausedItem format
        const convertDbItemToPausedItem = (item: any) => {
          try {
            const productLink = getProductLink(item);
            const cleanNotes = extractActualNotes(item.notes);
            
            return {
              id: item.id,
              itemName: item.title || 'Untitled Item',
              storeName: item.store_name || 'Unknown Store',
              price: item.price?.toString() || '0',
              imageUrl: item.image_url || '',
              emotion: item.emotion || item.reason || 'unknown',
              notes: cleanNotes || '',
              duration: `${item.pause_duration_days || 7} days`,
              otherDuration: item.other_duration || '',
              link: productLink,
              photo: null,
              photoDataUrl: '',
              tags: Array.isArray(item.tags) ? item.tags : [],
              pausedAt: new Date(item.created_at),
              checkInTime: calculateCheckInTimeDisplay(new Date(item.review_at)),
              checkInDate: new Date(item.review_at),
              isCart: item.is_cart || false,
              itemType: item.item_type || 'item',
              sharedWithPartners: Array.isArray(item.shared_with_partners) ? item.shared_with_partners : [],
              originalUserId: item.user_id
            };
          } catch (error) {
            console.error('Error converting database item:', error, item);
            return null;
          }
        };

        // Combine and format the items
        const allSharedItems = [
          ...(mySharedItems || []).map(convertDbItemToPausedItem).filter(Boolean),
          ...partnersSharedItems.map(convertDbItemToPausedItem).filter(Boolean)
        ];

        setSharedItems(allSharedItems);
      } catch (error) {
        console.error('Error in fetchSharedItems:', error);
        setSharedItems([]);
      }
    };

    fetchSharedItems();
    
    // Only set up real-time subscription if we have partners and user
    if (partners.length > 0 && currentUserId) {
      // Create globally unique channel name to avoid conflicts
      const channelName = `shared-paused-items-${currentUserId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Set up real-time subscription for shared items
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'paused_items',
          },
          () => {
            console.log('🔔 Paused items change detected, reloading shared items');
            fetchSharedItems(); // Reload when any paused item changes
          }
        )
        .subscribe();

      return () => {
        console.log('🔔 Cleaning up shared items subscription:', channelName);
        supabase.removeChannel(channel);
      };
    }
  }, [partners, currentUserId]);

  const handlePartnerItemsReady = (partnerName: string, items: PausedItem[]) => {
    setPartnerReviewName(partnerName);
    setPartnerReviewItems(items);
    setPartnerReviewModalOpen(true);
  };
  
  // Show loading state while component initializes
  if (!componentLoaded) {
    return (
      <div className="mb-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Early return if user is not authenticated to prevent errors
  if (!currentUserId) {
    return (
      <div className="mb-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">
            Please sign in to access partner features
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You need to be signed in to view and manage pause partners.
          </p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="mb-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2 text-red-600">
            Error Loading Partner Feed
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {error}
          </p>
          <Button onClick={() => setError(null)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
      {/* Show Partner Pauses section */}
      {partners.length > 0 ? (
        <Card>
          <Collapsible open={isPartnerSectionOpen} onOpenChange={setIsPartnerSectionOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] mb-0 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Shared Pauses
                    </h2>
                    <p className="text-base mb-0" style={{ color: '#6b6b6b' }}>
                      Mindful choices, made together.
                    </p>
                  </div>
                  {isPartnerSectionOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                {sharedItems.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Viewing with:</span>
                    <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                      <SelectTrigger className="w-48 bg-background z-50">
                        <SelectValue placeholder="All Partners" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="all">All Partners</SelectItem>
                        {partners.map((partner) => (
                          <SelectItem key={partner.partner_id} value={partner.partner_name}>
                            {partner.partner_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Partner Items Ready Banner */}
                <PartnerItemsReadyBanner
                  partners={partners}
                  currentUserId={currentUserId}
                  onItemsReady={handlePartnerItemsReady}
                />
                
                {sharedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">
                      No shared pauses yet. Once connected, you'll see items you've chosen to reflect on together.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      // Filter shared items based on selected partner
                      const filteredItems = selectedPartner === 'all' 
                        ? sharedItems 
                        : sharedItems.filter(item => {
                            // Find the partner by name
                            const selectedPartnerData = partners.find(p => p.partner_name === selectedPartner);
                            if (!selectedPartnerData) return false;
                            
                            // Show items where:
                            // 1. Current user created the item and shared it with the selected partner
                            // 2. The selected partner created the item and shared it with current user
                            return (
                              (item.originalUserId === currentUserId && item.sharedWithPartners?.includes(selectedPartnerData.partner_id)) ||
                              (item.originalUserId === selectedPartnerData.partner_id && item.sharedWithPartners?.includes(currentUserId || ''))
                            );
                          });

                      return filteredItems.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                          <p className="text-muted-foreground">
                            {selectedPartner === 'all' 
                              ? "No shared pauses yet. Once connected, you'll see items you've chosen to reflect on together."
                              : `No shared pauses with ${selectedPartner} yet.`
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <PausedItemsCarousel 
                            items={filteredItems}
                            onItemClick={(item) => setSelectedItem(item)}
                            partners={partners}
                            currentUserId={currentUserId}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] mb-0 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Partner Pauses
              </h2>
              <p className="text-base mb-3" style={{ color: '#6b6b6b' }}>
                Connect with someone you trust to help you reflect before you spend.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                You haven't connected with any pause partners yet.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Click your account icon (circle) in the top right to invite pause partners and start sharing mindful decisions together.
              </p>
            </div>
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
          partners={partners}
          currentUserId={currentUserId}
        />
      )}

      {/* Partner Review Modal */}
      <PartnerReviewModal
        isOpen={partnerReviewModalOpen}
        onClose={() => setPartnerReviewModalOpen(false)}
        partnerName={partnerReviewName}
        items={partnerReviewItems}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default PartnerFeedTab;