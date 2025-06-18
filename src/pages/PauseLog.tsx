
import { useState, useMemo, useEffect } from 'react';
import { usePauseLog } from '../hooks/usePauseLog';
import { useSupabasePauseLog } from '../hooks/useSupabasePauseLog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PauseLogItem } from '../stores/pauseLogStore';
import PauseLogHeader from '../components/PauseLogHeader';
import PauseLogFilterControls from '../components/PauseLogFilterControls';
import PauseLogItemCard from '../components/PauseLogItemCard';
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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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

  // Get unique emotions from items
  const uniqueEmotions = useMemo(() => {
    const emotions = items.map(item => item.emotion).filter(Boolean);
    return [...new Set(emotions)];
  }, [items]);

  // Filter and sort items based on selected filters and sort order
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      const emotionMatch = emotionFilter === 'all' || item.emotion === emotionFilter;
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      return emotionMatch && statusMatch;
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
  }, [items, emotionFilter, statusFilter, sortOrder]);

  const handleDeleteItem = (id: string) => {
    deleteItem(id);
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
            sortOrder={sortOrder}
            uniqueEmotions={uniqueEmotions}
            onEmotionFilterChange={setEmotionFilter}
            onStatusFilterChange={setStatusFilter}
            onSortOrderToggle={toggleSortOrder}
          />
        </div>

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
              />
            ))
          )}
        </div>

        <FooterLinks />
      </div>
    </div>
  );
};

export default PauseLog;
