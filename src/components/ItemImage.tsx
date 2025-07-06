
import { ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrlHelper';
import { PausedItem } from '../stores/supabasePausedItemsStore';

interface ItemImageProps {
  item: PausedItem;
}

const ItemImage = ({ item }: ItemImageProps) => {
  const imageUrl = getImageUrl(item);

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
            target.style.display = 'none';
            target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>';
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUrl);
          }}
        />
      ) : (
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
      )}
    </div>
  );
};

export default ItemImage;
