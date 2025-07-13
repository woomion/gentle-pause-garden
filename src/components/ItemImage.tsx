
import { ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrlHelper';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import itemPlaceholder from '@/assets/item-placeholder.png';

interface ItemImageProps {
  item: PausedItem;
}

const ItemImage = ({ item }: ItemImageProps) => {
  let imageUrl;
  
  try {
    imageUrl = getImageUrl(item);
  } catch (error) {
    console.error('Error getting image URL:', error);
    imageUrl = null;
  }

  return (
    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
      {imageUrl === 'cart-placeholder' ? (
        <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
          <ShoppingCart size={48} className="text-blue-600 dark:text-blue-400" />
        </div>
      ) : imageUrl ? (
        <img 
          src={imageUrl} 
          alt={item.itemName}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Image failed to load:', imageUrl);
            const target = e.target as HTMLImageElement;
            try {
              target.src = itemPlaceholder;
              target.alt = "Item placeholder";
            } catch (error) {
              console.error('Error setting placeholder:', error);
              target.style.display = 'none';
            }
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUrl);
          }}
        />
      ) : (
        <img 
          src={itemPlaceholder} 
          alt="Item placeholder"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Placeholder image failed to load');
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-full opacity-50 flex items-center justify-center"><div class="w-4 h-4 bg-purple-600 dark:bg-purple-400 rounded-sm"></div></div>';
          }}
        />
      )}
    </div>
  );
};

export default ItemImage;
