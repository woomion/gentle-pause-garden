
import { ShoppingCart } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { formatPrice } from '../utils/priceFormatter';
import { getEmotionColor } from '../utils/emotionColors';
import { useTheme } from '../contexts/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useMemo } from 'react';

interface ItemReviewDetailsProps {
  item: PausedItem | LocalPausedItem;
  onViewItem: (item: PausedItem | LocalPausedItem) => void;
}

const ItemReviewDetails = ({ item, onViewItem }: ItemReviewDetailsProps) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { partners } = usePausePartners();
  const emotionColor = getEmotionColor(item.emotion, isDarkMode);

  // Get sharing attribution text for shared items
  const getAttributionText = useMemo(() => {
    if (!user?.id || !('sharedWithPartners' in item) || !item.sharedWithPartners?.length) {
      return null;
    }

    const itemOwnerId = item.originalUserId;
    if (!itemOwnerId) {
      return null;
    }

    const isSharedByCurrentUser = itemOwnerId === user.id;
    
    if (isSharedByCurrentUser) {
      // Current user shared this item - show who they shared it with
      const sharedWithPartners = partners.filter(partner => 
        item.sharedWithPartners?.includes(partner.partner_id)
      );
      
      if (sharedWithPartners.length > 0) {
        if (sharedWithPartners.length === 1) {
          return { from: 'You', to: sharedWithPartners[0].partner_name, direction: 'shared-with' };
        } else {
          return { from: 'You', to: `${sharedWithPartners.length} partners`, direction: 'shared-with' };
        }
      } else if (item.sharedWithPartners.length > 0) {
        // Fallback: if partners data isn't loaded but we know it's shared
        return { from: 'You', to: `${item.sharedWithPartners.length} partner${item.sharedWithPartners.length > 1 ? 's' : ''}`, direction: 'shared-with' };
      }
    } else {
      // Partner shared this with current user
      const sharer = partners.find(p => p.partner_id === itemOwnerId);
      if (sharer) {
        return { from: sharer.partner_name, to: 'You', direction: 'shared-by' };
      } else {
        // Fallback: if partner data isn't loaded but we know it's from a partner
        return { from: 'Partner', to: 'You', direction: 'shared-by' };
      }
    }
    
    return null;
  }, [user?.id, item, partners]);

  const imageUrl = (() => {
    // Handle cart placeholder case
    if ('isCart' in item && item.isCart && item.imageUrl === 'cart-placeholder') {
      return 'cart-placeholder';
    }
    
    if (item.imageUrl) {
      if (item.imageUrl.includes('supabase')) {
        return item.imageUrl;
      } else {
        try {
          new URL(item.imageUrl);
          return item.imageUrl;
        } catch {
          return null;
        }
      }
    }
    if ('photoDataUrl' in item && item.photoDataUrl) {
      return item.photoDataUrl;
    }
    if ('photo' in item && item.photo instanceof File) {
      return URL.createObjectURL(item.photo);
    }
    return null;
  })();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.parentElement) {
      target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div>';
    }
  };

  return (
    <div className="flex items-start gap-4 mb-6">
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
          {item.price && (
            <span className="text-black dark:text-[#F9F5EB] font-medium flex-shrink-0">
              {formatPrice(item.price)}
            </span>
          )}
        </div>
        
        <p className="text-black dark:text-[#F9F5EB] text-sm mb-2">
          {item.storeName}
        </p>
        
        <div className="text-black dark:text-[#F9F5EB] text-sm mb-3">
          <span>Paused while feeling </span>
          <span 
            className="inline-block px-2 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: emotionColor,
              color: '#000'
            }}
          >
            {item.emotion}
          </span>
        </div>

        {item.notes && item.notes.trim() && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <strong>Note:</strong> {item.notes}
            </p>
          </div>
        )}

        {/* Directional Attribution Badge - placed under notes, above view link */}
        {getAttributionText && (
          <div className="mb-3">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs flex items-center justify-center gap-2 w-fit">
              <span className="text-xs leading-none flex items-center">{getAttributionText.from}</span>
              <span className="text-lg leading-none flex items-center justify-center h-4">→</span>
              <span className="text-xs leading-none flex items-center">{getAttributionText.to}</span>
            </Badge>
          </div>
        )}

        {item.link && item.link.trim() && (
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => onViewItem(item)}
              className="text-black dark:text-[#F9F5EB] text-sm underline hover:no-underline transition-all duration-200"
            >
              view link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemReviewDetails;
