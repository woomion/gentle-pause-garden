
import { Timer } from 'lucide-react';
import { PausedItem } from '../stores/pausedItemsStore';

interface PausedItemCardProps {
  item: PausedItem;
  onClick: () => void;
}

const PausedItemCard = ({ item, onClick }: PausedItemCardProps) => {
  const getEmotionColor = (emotion: string) => {
    const emotionColors: { [key: string]: string } = {
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
    return emotionColors[emotion] || '#F0F0EC';
  };

  // Create image URL from uploaded file, stored base64 data, or use provided URL
  const getImageUrl = () => {
    // First check if there's a stored base64 image
    if (item.photoDataUrl) {
      return item.photoDataUrl;
    }
    // Then check if there's a current File object (for newly added items)
    if (item.photo && item.photo instanceof File) {
      return URL.createObjectURL(item.photo);
    }
    // Finally fall back to imageUrl
    return item.imageUrl;
  };

  const imageUrl = getImageUrl();

  return (
    <div 
      className="bg-white/60 dark:bg-white/10 rounded-2xl border border-lavender/30 dark:border-gray-600 cursor-pointer hover:bg-white/80 dark:hover:bg-white/20 transition-colors relative overflow-hidden"
      onClick={onClick}
    >
      <div className="p-4 pb-12">
        <div className="flex items-start gap-4">
          {/* Product image with consistent sizing */}
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={item.itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>';
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-black dark:text-[#F9F5EB] truncate pr-2">{item.itemName}</h3>
              <span className="text-black dark:text-[#F9F5EB] font-medium flex-shrink-0">
                {item.price ? `$${item.price}` : ''}
              </span>
            </div>
            
            <p className="text-black dark:text-[#F9F5EB] text-sm mb-1">{item.storeName}</p>
            <div className="text-black dark:text-[#F9F5EB] text-sm mb-3">
              <span>Paused while feeling </span>
              <span 
                className="inline-block px-2 py-1 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: getEmotionColor(item.emotion),
                  color: '#000'
                }}
              >
                {item.emotion}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Full-width banner at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 py-2 px-4 text-center text-xs font-medium flex items-center justify-center gap-2 rounded-b-2xl"
        style={{ 
          backgroundColor: '#E7D9FA',
          color: '#000'
        }}
      >
        <Timer size={14} />
        {item.checkInTime}
      </div>
    </div>
  );
};

export default PausedItemCard;
