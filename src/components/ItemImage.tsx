import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrlHelper';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import ImageAddButton from './ImageAddButton';

interface ItemImageProps {
  item: PausedItem | LocalPausedItem;
  onImageSelected?: (file: File) => void;
  showAddButton?: boolean;
}

const PLACEHOLDER_URL = '/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png';

const ItemImage = ({ item, onImageSelected, showAddButton = false }: ItemImageProps) => {
  const [hasError, setHasError] = useState(false);
  
  let imageUrl;
  try {
    imageUrl = getImageUrl(item);
  } catch (error) {
    console.error('Error getting image URL:', error);
    imageUrl = PLACEHOLDER_URL;
  }

  const isCartPlaceholder = imageUrl === 'cart-placeholder';
  const showPlaceholder = hasError || !imageUrl || imageUrl === PLACEHOLDER_URL;

  return (
    <div className="w-full aspect-[4/3] bg-muted rounded-2xl rounded-b-none flex items-center justify-center overflow-hidden relative">
      {/* Add/Change Image Button */}
      {showAddButton && onImageSelected && (
        <ImageAddButton onImageSelected={onImageSelected} />
      )}
      
      {isCartPlaceholder ? (
        <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
          <ShoppingCart size={48} className="text-blue-600 dark:text-blue-400" />
        </div>
      ) : showPlaceholder ? (
        <img 
          src={PLACEHOLDER_URL}
          alt="Placeholder"
          className="w-full h-full object-cover"
        />
      ) : (
        <img 
          key={`${item.id}-${imageUrl}`}
          src={imageUrl!}
          alt={item.itemName}
          className="w-full h-full object-cover"
          onError={() => {
            console.error('Image failed to load:', imageUrl);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
};

export default ItemImage;
