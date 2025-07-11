import { useState, useEffect } from 'react';
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

  // Simple function to load partner items
  const loadPartnerItems = () => {
    if (!user || !hasPausePartnerAccess) {
      setPartnerItems([]);
      setIsLoading(false);
      return;
    }

    const allItems = supabasePausedItemsStore.getItems();
    const sharedItems = allItems.filter(item => 
      item.sharedWithPartners && item.sharedWithPartners.length > 0
    );
    
    const sortedItems = sharedItems.sort((a, b) => 
      new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime()
    );

    setPartnerItems(sortedItems);
    setIsLoading(false);
  };

  // Load data when component mounts or when access changes
  useEffect(() => {
    loadPartnerItems();
  }, [user?.id, hasPausePartnerAccess]);

  // Set up store subscription separately
  useEffect(() => {
    if (!user || !hasPausePartnerAccess) return;

    const unsubscribe = supabasePausedItemsStore.subscribe(loadPartnerItems);
    return () => unsubscribe();
  }, [user?.id, hasPausePartnerAccess]);

  const handleItemClick = (item: PausedItem) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    await supabasePausedItemsStore.removeItem(id);
    setSelectedItem(null);
    loadPartnerItems(); // Refresh the list
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
      {/* Partner Management Section */}
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