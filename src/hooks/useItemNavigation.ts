
import { useToast } from '@/hooks/use-toast';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { useInstalledApp } from '@/hooks/useInstalledApp';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

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

    // Detect platform
    let platform: 'ios' | 'android' | 'web' = 'web';
    try {
      // Capacitor v7
      // @ts-ignore - guard in case getPlatform is undefined on web
      platform = Capacitor.getPlatform?.() ?? 'web';
    } catch (e) {
      platform = 'web';
    }
    const isNative = platform !== 'web';

    try {
      // Prefer opening OUTSIDE the app when installed/native
      if (isNative) {
        console.log('📲 Native platform detected, opening via Capacitor Browser');
        toast({ title: 'Opening in your browser...' });
        await Browser.open({ url });
        return;
      }

      if (installed) {
        console.log('📦 Installed PWA detected, opening in external browser/window');
        toast({ title: 'Opening in your browser...' });
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          window.location.href = url;
        }
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
        platform,
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
