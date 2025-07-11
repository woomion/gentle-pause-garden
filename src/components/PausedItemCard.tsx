
import { Timer, ShoppingCart } from 'lucide-react';
import { memo, useMemo } from 'react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { formatPrice } from '../utils/priceFormatter';
import ItemImage from './ItemImage';
import PauseDurationBanner from './PauseDurationBanner';
import EmotionBadge from './EmotionBadge';
import { getEmotionColor } from '../utils/emotionColors';
import { useTheme } from '../contexts/ThemeContext';

interface PausedItemCardProps {
  item: PausedItem;
  onClick: () => void;
}

const PausedItemCard = memo(({ item, onClick }: PausedItemCardProps) => {
  const { isDarkMode } = useTheme();
  const emotionColor = useMemo(() => getEmotionColor(item.emotion, isDarkMode), [item.emotion, isDarkMode]);

  const imageUrl = useMemo(() => {
    console.log('🖼️ PausedItemCard - Processing image for item:', {
      itemId: item.id,
      itemName: item.itemName,
      imageUrl: item.imageUrl,
      photoDataUrl: item.photoDataUrl,
      hasPhoto: !!item.photo,
      isCart: item.isCart
    });

    // Handle cart placeholder
    if (item.isCart && item.imageUrl === 'cart-placeholder') {
      console.log('🛒 Using cart placeholder');
      return 'cart-placeholder';
    }

    // Priority order for image sources:
    // 1. Supabase Storage URL (uploaded images)
    // 2. photoDataUrl (base64 data)
    // 3. File object (create object URL)
    
    if (item.imageUrl && item.imageUrl !== 'cart-placeholder') {
      // Check if this is a Supabase Storage URL
      if (item.imageUrl.includes('supabase.co/storage') || item.imageUrl.includes('supabase')) {
        console.log('🖼️ Using Supabase storage URL:', item.imageUrl);
        return item.imageUrl;
      }
      // Check if it's a valid external URL
      try {
        new URL(item.imageUrl);
        console.log('🖼️ Using external image URL:', item.imageUrl);
        return item.imageUrl;
      } catch {
        console.log('🖼️ Invalid URL format:', item.imageUrl);
      }
    }
    
    if (item.photoDataUrl) {
      console.log('🖼️ Using photo data URL');
      return item.photoDataUrl;
    }
    
    if (item.photo instanceof File) {
      console.log('🖼️ Creating object URL from file');
      return URL.createObjectURL(item.photo);
    }
    
    console.log('🖼️ No valid image found');
    return null;
  }, [item.imageUrl, item.photoDataUrl, item.photo, item.id, item.isCart]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('🖼️ Image failed to load:', {
      src: e.currentTarget.src,
      itemId: item.id,
      itemName: item.itemName
    });
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.parentElement) {
      target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" aria-hidden="true"></div>';
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('🖼️ Image loaded successfully:', {
      src: e.currentTarget.src,
      itemId: item.id,
      itemName: item.itemName
    });
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
      className="bg-white/60 dark:bg-white/10 rounded-2xl border border-lavender/30 dark:border-gray-600 cursor-pointer hover:bg-white/80 dark:hover:bg-white/20 transition-colors relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#CAB6F7] focus:ring-offset-2"
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
      <div className="p-4 pb-12">
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

            {/* Tags section - Enhanced with debug */}
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-1 bg-lavender/20 text-dark-gray dark:text-[#F9F5EB] rounded text-xs border border-lavender/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              console.log('🏷️ No tags to display for item:', item.id, 'Tags:', item.tags),
              null
            )}

          </div>
        </div>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 py-2 px-4 text-center text-xs font-medium flex items-center justify-center gap-2 rounded-b-2xl bg-[#E7D9FA]"
        style={{ color: '#000' }}
      >
        <Timer size={14} aria-hidden="true" />
        {item.checkInTime}
      </div>
    </div>
  );
});

PausedItemCard.displayName = 'PausedItemCard';

export default PausedItemCard;
