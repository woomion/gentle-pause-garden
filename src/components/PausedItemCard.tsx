
import { Timer, ShoppingCart, ArrowRight } from 'lucide-react';
import { memo, useMemo, useEffect, useState } from 'react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { formatPrice } from '../utils/priceFormatter';
import ItemImage from './ItemImage';
import PauseDurationBanner from './PauseDurationBanner';
import EmotionBadge from './EmotionBadge';
import { getEmotionColor } from '../utils/emotionColors';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Partner {
  partner_id: string;
  partner_email: string;
  partner_name: string;
}

interface PausedItemCardProps {
  item: PausedItem;
  onClick: () => void;
  partners?: Partner[];
  currentUserId?: string;
}

const PausedItemCard = memo(({ item, onClick, partners = [], currentUserId }: PausedItemCardProps) => {
  const { isDarkMode } = useTheme();
  const emotionColor = useMemo(() => getEmotionColor(item.emotion, isDarkMode), [item.emotion, isDarkMode]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Get initials for shared partners
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get partner info for the badges
  const sharedWithPartners = useMemo(() => {
    if (!item.sharedWithPartners || item.sharedWithPartners.length === 0) return [];
    
    return partners.filter(partner => 
      item.sharedWithPartners.includes(partner.partner_id)
    );
  }, [item.sharedWithPartners, partners]);

  // Get sharing attribution text
  const getAttributionText = useMemo(() => {
    if (!currentUser || !item.originalUserId || sharedWithPartners.length === 0) {
      return null;
    }

    const isSharedByCurrentUser = item.originalUserId === currentUser;
    
    if (isSharedByCurrentUser) {
      // Current user shared this item
      if (sharedWithPartners.length === 1) {
        return `Shared: You → ${sharedWithPartners[0].partner_name}`;
      } else {
        return `Shared: You → ${sharedWithPartners.length} partners`;
      }
    } else {
      // Partner shared this with current user
      const sharer = partners.find(p => p.partner_id === item.originalUserId);
      if (sharer) {
        return `Shared: ${sharer.partner_name} → You`;
      }
    }
    
    return null;
  }, [currentUser, item.originalUserId, sharedWithPartners, partners]);

  const imageUrl = useMemo(() => {
    // Handle cart placeholder
    if (item.isCart && item.imageUrl === 'cart-placeholder') {
      return 'cart-placeholder';
    }

    // Priority order for image sources:
    // 1. Supabase Storage URL (uploaded images)
    // 2. photoDataUrl (base64 data)
    // 3. File object (create object URL)
    
    if (item.imageUrl && item.imageUrl !== 'cart-placeholder') {
      // Check if this is a Supabase Storage URL
      if (item.imageUrl.includes('supabase.co/storage') || item.imageUrl.includes('supabase')) {
        return item.imageUrl;
      }
      // Check if it's a valid external URL
      try {
        new URL(item.imageUrl);
        return item.imageUrl;
      } catch {
        // Invalid URL format - continue to next option
      }
    }
    
    if (item.photoDataUrl) {
      return item.photoDataUrl;
    }
    
    if (item.photo instanceof File) {
      return URL.createObjectURL(item.photo);
    }
    
    return null;
  }, [item.imageUrl, item.photoDataUrl, item.photo, item.id, item.isCart]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.parentElement) {
      target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" aria-hidden="true"></div>';
    }
  };

  const handleImageLoad = () => {
    // Image loaded successfully
  };

  const formattedPrice = useMemo(() => {
    if (!item.price) return '';
    
    const price = parseFloat(item.price);
    if (isNaN(price)) return '';
    
    // Always show two decimal places
    return `$${price.toFixed(2)}`;
  }, [item.price]);

  return (
    <div 
      className="bg-white/60 dark:bg-white/10 rounded-2xl border border-lavender/30 dark:border-gray-600 cursor-pointer hover:bg-white/80 dark:hover:bg-white/20 transition-colors relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#CAB6F7] focus:ring-offset-2 shadow-sm"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${item.itemName}`}
    >
      <div className="px-4 py-6 pb-12">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageUrl === 'cart-placeholder' ? (
              <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <ShoppingCart size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt={item.itemName}
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" aria-hidden="true" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-black dark:text-[#F9F5EB] truncate pr-2">
                {item.itemName}
              </h3>
              {formattedPrice && (
                <span className="text-black dark:text-[#F9F5EB] font-medium flex-shrink-0">
                  {formattedPrice}
                </span>
              )}
            </div>
            
            <p className="text-black dark:text-[#F9F5EB] text-sm mb-1">
              {item.storeName}
            </p>
            
            {/* Show either shared attribution or partner badges */}
            {getAttributionText ? (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-muted-foreground truncate">{getAttributionText}</span>
              </div>
            ) : sharedWithPartners.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {sharedWithPartners.map((partner) => (
                  <Avatar key={partner.partner_id} className="h-6 w-6 bg-green-100 border-2 border-green-400 dark:bg-green-900 dark:border-green-500">
                    <AvatarFallback className="text-xs text-green-800 dark:text-green-200">
                      {getInitials(partner.partner_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : null}

          </div>
        </div>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 py-2 px-4 text-center text-xs font-medium flex items-center justify-center gap-2 rounded-b-2xl"
        style={{ backgroundColor: '#eeeaf8', color: '#000' }}
      >
        <Timer size={14} aria-hidden="true" />
        {item.checkInTime}
      </div>
    </div>
  );
});

PausedItemCard.displayName = 'PausedItemCard';

export default PausedItemCard;
