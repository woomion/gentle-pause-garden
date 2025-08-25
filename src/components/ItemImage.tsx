
import { ShoppingCart, Pause } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrlHelper';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';

interface ItemImageProps {
  item: PausedItem | LocalPausedItem;
}

const ItemImage = ({ item }: ItemImageProps) => {
  let imageUrl;
  
  try {
    imageUrl = getImageUrl(item);
  } catch (error) {
    console.error('Error getting image URL:', error);
    imageUrl = null;
  }

  // Default placeholder component using uploaded image
  const PlaceholderImage = () => (
    <img 
      src="/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png" 
      alt="Placeholder" 
      className="w-full h-full object-cover rounded-2xl rounded-b-none"
    />
  );

  return (
    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-b-none flex items-center justify-center overflow-hidden">
      {imageUrl === 'cart-placeholder' ? (
        <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
          <ShoppingCart size={48} className="text-blue-600 dark:text-blue-400" />
        </div>
      ) : imageUrl ? (
        <img 
          key={`${item.id}-${imageUrl}`}
          src={imageUrl} 
          alt={item.itemName}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Image failed to load:', imageUrl);
            const target = e.target as HTMLImageElement;
            // Hide the broken image and show placeholder
            target.style.display = 'none';
            const placeholder = target.parentElement?.querySelector('.fallback-placeholder');
            if (placeholder) {
              (placeholder as HTMLElement).style.display = 'flex';
            }
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUrl);
          }}
        />
      ) : (
        <PlaceholderImage />
      )}
      
      {/* Fallback placeholder - always present but hidden by default */}
      <div 
        className={`fallback-placeholder w-full h-full rounded-2xl rounded-b-none ${imageUrl && imageUrl !== 'cart-placeholder' ? 'hidden' : 'flex'}`}
      >
        <PlaceholderImage />
      </div>
    </div>
  );
};

export default ItemImage;
