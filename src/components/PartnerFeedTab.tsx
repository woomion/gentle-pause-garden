import { useState, useEffect, useCallback } from 'react';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { useAuth } from '../contexts/AuthContext';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useSubscription } from '@/hooks/useSubscription';
import PausedItemsCarousel from './PausedItemsCarousel';
import PausePartnersSection from './PausePartnersSection';
import PausedItemDetail from './PausedItemDetail';
import { Button } from '@/components/ui/button';
import { Users, Crown } from 'lucide-react';

const PartnerFeedTab = () => {
  const [partnerItems, setPartnerItems] = useState<PausedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PausedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { partners } = usePausePartners();
  const { hasPausePartnerAccess } = useSubscription();

  const sortItemsByDate = useCallback((items: PausedItem[]) => {
    return items.sort((a, b) => new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime());
  }, []);

  const updatePartnerItems = useCallback(() => {
    if (!user || !hasPausePartnerAccess) {
      setPartnerItems([]);
      setIsLoading(false);
      return;
    }

    const allItems = supabasePausedItemsStore.getItems();
    
    // Get items that are shared with partners
    const sharedItems = allItems.filter(item => {
      return item.sharedWithPartners && item.sharedWithPartners.length > 0;
    });

    setPartnerItems(sortItemsByDate(sharedItems));
    
    if (supabasePausedItemsStore.isDataLoaded()) {
      setIsLoading(false);
    }
  }, [user?.id, hasPausePartnerAccess, sortItemsByDate]);

  useEffect(() => {
    updatePartnerItems();

    let unsubscribe: (() => void) | undefined;
    let interval: NodeJS.Timeout | undefined;

    if (user && hasPausePartnerAccess) {
      unsubscribe = supabasePausedItemsStore.subscribe(updatePartnerItems);
      interval = setInterval(updatePartnerItems, 60000);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [updatePartnerItems, user, hasPausePartnerAccess]);

  const handleItemClick = useCallback((item: PausedItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleDeleteItem = useCallback(async (id: string) => {
    await supabasePausedItemsStore.removeItem(id);
    setSelectedItem(null);
  }, []);

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

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Partner Feed
        </h2>
        <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
          Items shared with your pause partners
        </p>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading partner items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Partner Management Section - Always show when user has access */}
      <PausePartnersSection />
      
      {/* Partner Feed Section */}
      <div>
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Partner Feed
        </h2>
        <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
          Items shared with your pause partners
        </p>

        {partnerItems.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2 text-black dark:text-[#F9F5EB]">
              No shared items yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {partners.length === 0 
                ? "Connect with partners first, then start sharing pause items for mutual support."
                : "Share pause items with your partners when adding new items to see them here."
              }
            </p>
          </div>
        ) : (
          <PausedItemsCarousel 
            items={partnerItems}
            onItemClick={handleItemClick}
          />
        )}

        {selectedItem && (
          <PausedItemDetail
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={handleCloseDetail}
            onDelete={handleDeleteItem}
          />
        )}
      </div>
    </div>
  );
};

export default PartnerFeedTab;