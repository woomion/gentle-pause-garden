
import { useToast } from '@/hooks/use-toast';
import { PausedItem } from '../stores/supabasePausedItemsStore';

export const useItemNavigation = () => {
  const { toast } = useToast();

  const handleViewItem = (item: PausedItem) => {
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
        title: "No link available",
        description: "This item doesn't have a product link.",
        variant: "destructive"
      });
      return;
    }

    // Clean and validate the URL
    let url = item.link.trim();
    console.log('🌐 DEBUG: Original URL from item.link:', url);
    
    // Check if this looks like an image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const isImageUrl = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    console.log('🖼️ DEBUG: URL appears to be image?', isImageUrl);
    
    // Ensure the URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log('🌐 DEBUG: Final URL to open:', url);
    console.log('📱 DEBUG: User agent:', navigator.userAgent);
    
    try {
      // For mobile devices, use a more direct approach
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('📱 DEBUG: Is mobile device?', isMobile);
      
      if (isMobile) {
        console.log('📱 Mobile device detected, using direct navigation');
        // Direct navigation works better on mobile browsers
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

  return { handleViewItem };
};
