
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePauseLogStore } from '../stores/supabasePauseLogStore';
import { pauseLogStore } from '../stores/pauseLogStore';
import { PausedItem } from '../stores/supabasePausedItemsStore';

export const useItemActions = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleViewItem = (item: PausedItem) => {
    console.log('🔗 View item clicked - DETAILED DEBUG:', {
      itemId: item.id,
      itemName: item.itemName,
      link: item.link,
      hasLink: !!item.link,
      linkLength: item.link?.length,
      linkType: typeof item.link,
      userAgent: navigator.userAgent,
      isAuthenticated: !!user,
      userId: user?.id,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href,
      referrer: document.referrer
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
    
    // Validate URL format
    try {
      new URL(url);
      console.log('✅ URL validation passed');
    } catch (urlError) {
      console.error('❌ Invalid URL format:', urlError);
      toast({
        title: "Invalid link",
        description: "The product link appears to be invalid.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      console.log('📱 Device detection:', { isMobile, isIOS, isAndroid });
      
      if (isMobile) {
        console.log('📱 Mobile device detected, trying multiple approaches');
        
        // Strategy 1: Try creating a hidden link and clicking it
        console.log('📱 Strategy 1: Hidden link click');
        const hiddenLink = document.createElement('a');
        hiddenLink.href = url;
        hiddenLink.target = '_blank';
        hiddenLink.rel = 'noopener noreferrer';
        hiddenLink.style.display = 'none';
        document.body.appendChild(hiddenLink);
        
        // Try clicking the hidden link
        try {
          hiddenLink.click();
          console.log('📱 Hidden link click executed');
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(hiddenLink);
          }, 100);
          
          // Give it a moment to work, then try fallbacks if needed
          setTimeout(() => {
            console.log('📱 Checking if Strategy 1 worked...');
            
            // Strategy 2: Direct window.open with specific mobile parameters
            console.log('📱 Strategy 2: window.open with mobile params');
            const newWindow = window.open(url, '_blank', 'noopener=yes,noreferrer=yes');
            
            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
              console.log('📱 Strategy 2 failed, trying Strategy 3');
              
              // Strategy 3: Location assignment (last resort)
              console.log('📱 Strategy 3: Direct location assignment');
              if (confirm(`Open ${item.itemName} in a new tab?`)) {
                window.location.href = url;
              }
            } else {
              console.log('✅ Strategy 2 successful');
            }
          }, 250);
          
        } catch (linkError) {
          console.error('📱 Hidden link strategy failed:', linkError);
          
          // Immediate fallback to window.open
          console.log('📱 Immediate fallback to window.open');
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          
          if (!newWindow) {
            console.log('📱 window.open blocked, using location.href');
            if (confirm(`Open ${item.itemName} in a new tab?`)) {
              window.location.href = url;
            }
          }
        }
      } else {
        console.log('💻 Desktop device, using standard approach');
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
          console.log('💻 Popup blocked, using location.href');
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
        isIOS,
        isAndroid,
        userAuthenticated: !!user,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error opening URL:', error);
      
      // Ultimate fallback with user confirmation
      try {
        if (confirm(`Unable to open link automatically. Open ${item.itemName} manually?`)) {
          window.location.href = url;
        } else {
          toast({
            title: "Link ready to copy",
            description: `Copy this link: ${url}`,
          });
        }
      } catch (fallbackError) {
        console.error('❌ Even ultimate fallback failed:', fallbackError);
        toast({
          title: "Error opening link",
          description: `Please copy this link manually: ${url}`,
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
