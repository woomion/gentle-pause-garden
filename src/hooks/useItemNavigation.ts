
import { useToast } from '@/hooks/use-toast';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { useInstalledApp } from '@/hooks/useInstalledApp';

export const useItemNavigation = () => {
  const { toast } = useToast();
  const installed = useInstalledApp();

  const handleViewItem = async (item: PausedItem) => {
    console.log('🔍 DEBUG: handleViewItem called with item:', {
      itemId: item.id,
      itemName: item.itemName,
      link: item.link,
      imageUrl: item.imageUrl,
      photoDataUrl: item.photoDataUrl,
      hasLink: !!item.link,
      hasImageUrl: !!item.imageUrl,
      hasPhotoDataUrl: !!item.photoDataUrl,
      linkType: typeof item.link,
      linkLength: item.link?.length,
      userAgent: navigator.userAgent
    });

    if (!item.link || !item.link.trim()) {
      console.warn('⚠️ No link available for item:', item.itemName);
      toast({
        title: 'No link available',
        description: "This item doesn't have a product link.",
        variant: 'destructive',
      });
      return;
    }

    // Clean and validate the URL
    let url = item.link.trim();
    console.log('🌐 DEBUG: Original URL from item.link:', url);

    // Ensure the URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    console.log('🌐 DEBUG: Final URL to open:', url);
    console.log('📱 DEBUG: User agent:', navigator.userAgent);

    try {

      if (installed) {
        console.log('📦 Installed PWA detected, forcing external browser');
        toast({ title: 'Opening in your browser...' });
        
        // For PWAs, force external browser opening using window.open with specific parameters
        // This is more reliable than creating a link element
        try {
          // Try multiple methods to ensure external opening
          const opened = window.open(url, '_blank', 'noopener,noreferrer,external');
          
          // If window.open failed or was blocked, try location.assign
          if (!opened) {
            console.log('📦 window.open failed, trying location.assign');
            window.location.assign(url);
          }
        } catch (error) {
          console.log('📦 Error with window.open, using location.assign fallback');
          window.location.assign(url);
        }
        
        console.log('📦 PWA external link triggered');
        return;
      }

      // Fallback: mobile/desktop web behavior
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('📱 DEBUG: Is mobile device?', isMobile);

      if (isMobile) {
        console.log('📱 Mobile web - using direct navigation');
        window.location.href = url;
      } else {
        console.log('💻 Desktop web - using window.open');
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
        installed,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error opening URL:', error);
      toast({
        title: 'Error opening link',
        description: 'Unable to open the product link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return { handleViewItem };
};
