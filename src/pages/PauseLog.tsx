
import { useState, useMemo, useEffect } from 'react';
import { usePauseLog } from '../hooks/usePauseLog';
import { useSupabasePauseLog } from '../hooks/useSupabasePauseLog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PauseLogItem } from '../stores/pauseLogStore';
import PauseLogHeader from '../components/PauseLogHeader';
import PauseLogFilterControls from '../components/PauseLogFilterControls';
import PauseLogItemCard from '../components/PauseLogItemCard';
import PauseLogItemDetail from '../components/PauseLogItemDetail';
import PauseLogEmptyState from '../components/PauseLogEmptyState';
import FooterLinks from '../components/FooterLinks';

const PauseLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use appropriate hook based on authentication
  const localPauseLog = usePauseLog();
  const supabasePauseLog = useSupabasePauseLog();
  
  const { items, deleteItem, loadItems } = user ? supabasePauseLog : localPauseLog;
  
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [cartFilter, setCartFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedItem, setSelectedItem] = useState<PauseLogItem | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);

  // Force refresh pause log items when component mounts
  useEffect(() => {
    if (user && loadItems) {
      // Force reload to ensure we have the latest data
      const reloadData = async () => {
        await loadItems();
      };
      reloadData();
    }
  }, [user, loadItems]);

  // Get unique emotions and tags from items
  const uniqueEmotions = useMemo(() => {
    const emotions = items.map(item => item.emotion).filter(Boolean);
    return [...new Set(emotions)];
  }, [items]);

  const uniqueTags = useMemo(() => {
    const allTags = items.flatMap(item => item.tags || []);
    return [...new Set(allTags)];
  }, [items]);

  // Filter and sort items based on selected filters and sort order
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      const emotionMatch = emotionFilter === 'all' || item.emotion === emotionFilter;
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      const tagMatch = tagFilter === 'all' || (item.tags && item.tags.includes(tagFilter));
      
      // Cart filter logic - check if item was originally a cart
      const isItemCart = item.originalPausedItem?.isCart || item.originalPausedItem?.itemType === 'cart' || item.itemName === 'Cart';
      const cartMatch = cartFilter === 'all' || 
                       (cartFilter === 'cart' && isItemCart) || 
                       (cartFilter === 'item' && !isItemCart);
      
      return emotionMatch && statusMatch && tagMatch && cartMatch;
    });

    // Sort by date decided (letGoDate)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.letGoDate);
      const dateB = new Date(b.letGoDate);
      
      if (sortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime(); // Newest first
      } else {
        return dateA.getTime() - dateB.getTime(); // Oldest first
      }
    });

    return filtered;
  }, [items, emotionFilter, statusFilter, tagFilter, cartFilter, sortOrder]);

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (emotionFilter !== 'all') filters.push({ type: 'emotion', value: emotionFilter, label: emotionFilter });
    if (statusFilter !== 'all') filters.push({ type: 'status', value: statusFilter, label: statusFilter === 'purchased' ? 'Purchased' : 'Let go' });
    if (tagFilter !== 'all') filters.push({ type: 'tag', value: tagFilter, label: tagFilter });
    if (cartFilter !== 'all') filters.push({ type: 'cart', value: cartFilter, label: cartFilter === 'cart' ? 'Cart' : 'Item' });
    return filters;
  }, [emotionFilter, statusFilter, tagFilter, cartFilter]);

  const clearAllFilters = () => {
    setEmotionFilter('all');
    setStatusFilter('all');
    setTagFilter('all');
    setCartFilter('all');
  };

  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'emotion':
        setEmotionFilter('all');
        break;
      case 'status':
        setStatusFilter('all');
        break;
      case 'tag':
        setTagFilter('all');
        break;
      case 'cart':
        setCartFilter('all');
        break;
    }
  };

  const handleDeleteItem = (id: string) => {
    deleteItem(id);
  };

  const handleItemClick = (item: PauseLogItem) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const handleCloseDetail = () => {
    setShowItemDetail(false);
    setSelectedItem(null);
  };

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'newest' ? 'oldest' : 'newest');
  };

  const handleViewLink = (item: PauseLogItem) => {
    // Check multiple possible locations for the link
    const link = item.originalPausedItem?.link || 
                 item.originalPausedItem?.url || 
                 '';
    
    if (!link || !link.trim()) {
      console.warn('⚠️ No link available for item:', item.itemName);
      toast({
        title: "No link available",
        description: "This item doesn't have a product link.",
        variant: "destructive"
      });
      return;
    }

    // Clean and validate the URL
    let url = link.trim();
    console.log('🌐 DEBUG: Original URL from item.link:', url);
    
    // Ensure the URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log('🌐 DEBUG: Final URL to open:', url);
    
    try {
      // For mobile devices, use a more direct approach
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('📱 Mobile device detected, using direct navigation');
        window.location.href = url;
      } else {
        console.log('💻 Desktop device, using window.open');
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
          console.log('💻 Popup blocked, using direct navigation');
          window.location.href = url;
        }
      }
      
      console.log('🎯 Navigation completed for:', {
        itemName: item.itemName,
        finalUrl: url,
        isMobile,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error opening URL:', error);
      toast({
        title: "Error opening link",
        description: "Unable to open the product link. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-6 py-8">
        <PauseLogHeader itemCount={items.length} />
        
        <div className="mb-6">
          <PauseLogFilterControls
            emotionFilter={emotionFilter}
            statusFilter={statusFilter}
            tagFilter={tagFilter}
            cartFilter={cartFilter}
            sortOrder={sortOrder}
            uniqueEmotions={uniqueEmotions}
            uniqueTags={uniqueTags}
            onEmotionFilterChange={setEmotionFilter}
            onStatusFilterChange={setStatusFilter}
            onTagFilterChange={setTagFilter}
            onCartFilterChange={setCartFilter}
            onSortOrderToggle={toggleSortOrder}
          />
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-4 p-4 bg-white/60 dark:bg-white/10 rounded-2xl border border-lavender/30 dark:border-gray-600">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm font-medium text-black dark:text-[#F9F5EB]">Active filters:</span>
              {activeFilters.map((filter) => (
                <div
                  key={`${filter.type}-${filter.value}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-lavender/20 text-dark-gray dark:text-[#F9F5EB] rounded-full text-sm border border-lavender/30"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.type)}
                    className="ml-1 text-dark-gray dark:text-[#F9F5EB] hover:text-red-600 dark:hover:text-red-400 text-xs font-bold"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-[#F9F5EB] underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <PauseLogEmptyState />
          ) : (
            filteredItems.map((item) => (
              <PauseLogItemCard
                key={item.id}
                item={item}
                onDelete={handleDeleteItem}
                onViewLink={handleViewLink}
                onClick={handleItemClick}
              />
            ))
          )}
        </div>

        <FooterLinks />
      </div>

      <PauseLogItemDetail
        item={selectedItem}
        isOpen={showItemDetail}
        onClose={handleCloseDetail}
        onViewLink={handleViewLink}
      />
    </div>
  );
};

export default PauseLog;
