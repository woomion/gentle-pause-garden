import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePauseLogStore } from '../stores/supabasePauseLogStore';
import { pauseLogStore } from '../stores/pauseLogStore';
import { PausedItem } from '../stores/supabasePausedItemsStore';

export const useItemActions = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleViewItem = (item: PausedItem) => {
    console.log('🔗 View item clicked:', {
      itemId: item.id,
      itemName: item.itemName,
      link: item.link,
      hasLink: !!item.link,
      linkLength: item.link?.length,
      userAgent: navigator.userAgent,
      isAuthenticated: !!user
    });
    
    if (!item.link || !item.link.trim()) {
      console.warn('⚠️ No link available for item:', item.itemName);
      toast({
        title: "No link available",
        description: "This item doesn't have a product link.",
        variant: "destructive"
      });
      return;
    }

    // Clean and validate the URL
    let url = item.link.trim();
    console.log('🌐 Original URL:', url);
    
    // Ensure the URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log('🌐 Final URL to open:', url);
    
    try {
      // For mobile devices, try different approaches
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('📱 Mobile device detected, using mobile-optimized approach');
        
        // First try: Use window.open with specific parameters for mobile
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer,popup=no');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          console.log('📱 Popup blocked or failed, trying location.href approach');
          // Fallback: Direct navigation
          window.location.href = url;
        } else {
          console.log('✅ Mobile window.open successful');
        }
      } else {
        console.log('💻 Desktop device, using standard window.open');
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
          console.log('💻 Popup blocked, trying location.href approach');
          window.location.href = url;
        } else {
          console.log('✅ Desktop window.open successful');
        }
      }
      
      // Log successful navigation attempt
      console.log('🎯 Navigation attempt completed for:', {
        itemName: item.itemName,
        finalUrl: url,
        isMobile,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error opening URL:', error);
      
      // Ultimate fallback: try direct assignment
      try {
        window.location.href = url;
        console.log('🔄 Fallback to location.href completed');
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
        toast({
          title: "Error opening link",
          description: "Unable to open the product link. Please copy the URL manually.",
          variant: "destructive"
        });
      }
    }
  };

  const handleLetGo = async (item: PausedItem, onDelete: (id: string) => void, onClose: () => void) => {
    console.log('📝 Adding item to pause log (let go):', {
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName,
      status: 'let-go',
      notes: item.notes,
      user: user ? 'authenticated' : 'guest'
    });

    try {
      // Use appropriate pause log store based on authentication
      if (user) {
        await supabasePauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'let-go',
          notes: item.notes
        });
        console.log('✅ Item added to Supabase pause log');
      } else {
        pauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'let-go',
          notes: item.notes
        });
        console.log('✅ Item added to local pause log');
      }
      
      // Remove from paused items
      onDelete(item.id);
      onClose();
      
      // Show success toast
      toast({
        title: "Item released",
        description: `"${item.itemName}" has been moved to your pause log.`,
      });
    } catch (error) {
      console.error('❌ Error adding item to pause log:', error);
      toast({
        title: "Error",
        description: "Failed to save decision. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBought = async (item: PausedItem, onDelete: (id: string) => void, onClose: () => void) => {
    console.log('📝 Adding item to pause log (purchased):', {
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName,
      status: 'purchased',
      notes: item.notes,
      user: user ? 'authenticated' : 'guest'
    });

    try {
      // Use appropriate pause log store based on authentication
      if (user) {
        await supabasePauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'purchased',
          notes: item.notes
        });
        console.log('✅ Item added to Supabase pause log');
      } else {
        pauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'purchased',
          notes: item.notes
        });
        console.log('✅ Item added to local pause log');
      }
      
      // Remove from paused items
      onDelete(item.id);
      onClose();
      
      // Show success toast that auto-dismisses
      const toastInstance = toast({
        title: "Great, you made a conscious choice!",
        description: "We've moved this thoughtful decision to your Pause Log for future reference.",
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        toastInstance.dismiss();
      }, 3000);
    } catch (error) {
      console.error('❌ Error adding item to pause log:', error);
      toast({
        title: "Error",
        description: "Failed to save decision. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    handleViewItem,
    handleLetGo,
    handleBought
  };
};
