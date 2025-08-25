
import { ShoppingCart, Search } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { formatPrice } from '../utils/priceFormatter';

interface ItemReviewDetailsProps {
  item: PausedItem | LocalPausedItem;
  onViewItem: (item: PausedItem | LocalPausedItem) => void;
}

const ItemReviewDetails = ({ item, onViewItem }: ItemReviewDetailsProps) => {
  

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

  const handleSearchClick = () => {
    const searchQuery = encodeURIComponent(
      `${item.itemName}${item.storeName && item.storeName !== 'Unknown Store' ? ` ${item.storeName}` : ''}`
    );
    const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
    window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-start gap-4 mb-2">
      <div className="flex flex-col items-center gap-2">
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
             <img 
               src="/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png" 
               alt="Placeholder" 
               className="w-full h-full object-cover"
             />
           )}
        </div>
        
        {item.link && item.link.trim() ? (
          <button
            onClick={() => onViewItem(item)}
            className="text-black dark:text-[#F9F5EB] text-xs underline hover:no-underline transition-all duration-200"
          >
            view link
          </button>
        ) : (
          <button
            onClick={handleSearchClick}
            className="text-black dark:text-[#F9F5EB] text-xs underline hover:no-underline transition-all duration-200 flex items-center gap-1"
          >
            <Search size={12} />
            search
          </button>
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
        

        {item.notes && item.notes.trim() && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <strong>Note:</strong> {item.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemReviewDetails;
