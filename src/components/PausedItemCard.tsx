
import { Timer } from 'lucide-react';
import { memo, useMemo } from 'react';
import { PausedItem } from '../stores/pausedItemsStore';

interface PausedItemCardProps {
  item: PausedItem;
  onClick: () => void;
}

const PausedItemCard = memo(({ item, onClick }: PausedItemCardProps) => {
  const emotionColor = useMemo(() => {
    const emotionColors: Record<string, string> = {
      'bored': '#F6E3D5',
      'overwhelmed': '#E9E2F7',
      'burnt out': '#FBF3C2',
      'sad': '#DCE7F5',
      'inspired': '#FBE7E6',
      'deserving': '#E7D8F3',
      'curious': '#DDEEDF',
      'anxious': '#EDEAE5',
      'lonely': '#CED8E3',
      'celebratory': '#FAEED6',
      'resentful': '#EAC9C3',
      'something else': '#F0F0EC'
    };
    return emotionColors[item.emotion] || '#F0F0EC';
  }, [item.emotion]);

  const imageUrl = useMemo(() => {
    console.log('PausedItemCard - Getting image for item:', {
      id: item.id,
      imageUrl: item.imageUrl,
      photoDataUrl: item.photoDataUrl,
      hasPhoto: !!item.photo,
      itemName: item.itemName
    });

    // Priority: Supabase Storage URL > photoDataUrl > file object
    if (item.imageUrl) {
      // Check if this is a Supabase Storage URL (contains supabase)
      if (item.imageUrl.includes('supabase')) {
        console.log('Using Supabase Storage URL:', item.imageUrl);
        return item.imageUrl;
      } else {
        // This might be a product URL - only use if it's a valid image URL
        try {
          new URL(item.imageUrl);
          console.log('Using external image URL:', item.imageUrl);
          return item.imageUrl;
        } catch {
          console.log('Invalid image URL, skipping:', item.imageUrl);
          return null;
        }
      }
    }
    if (item.photoDataUrl) {
      console.log('Using photoDataUrl (local storage)');
      return item.photoDataUrl;
    }
    if (item.photo instanceof File) {
      console.log('Creating object URL from file');
      return URL.createObjectURL(item.photo);
    }
    
    console.log('No valid image URL found for item:', item.id);
    return null;
  }, [item.photoDataUrl, item.photo, item.imageUrl, item.id]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', imageUrl, 'for item:', item.id);
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.parentElement) {
      target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" aria-hidden="true"></div>';
    }
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', imageUrl, 'for item:', item.id);
  };

  const formattedPrice = item.price ? `$${item.price}` : '';

  // Check if notes exist and are meaningful (not just placeholder text or empty)
  const hasValidNotes = item.notes && 
    item.notes.trim() && 
    !item.notes.match(/^[a-z]{8,}$/) && 
    item.notes !== 'undefined' && 
    item.notes !== 'null';

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
            {imageUrl ? (
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
                className="inline-block px-2 py-1 rounded text-xs font-medium emotion-badge"
                style={{ 
                  backgroundColor: emotionColor,
                  color: '#000'
                }}
              >
                {item.emotion}
              </span>
            </div>
            
            {hasValidNotes && (
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                {item.notes}
              </p>
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
