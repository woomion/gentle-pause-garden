
import { PausedItem } from '../stores/pausedItemsStore';

interface PausedItemCardProps {
  item: PausedItem;
}

const PausedItemCard = ({ item }: PausedItemCardProps) => {
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

  // Create image URL from uploaded file or use provided URL
  const getImageUrl = () => {
    if (item.photo && item.photo instanceof File) {
      return URL.createObjectURL(item.photo);
    }
    return item.imageUrl;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="bg-white/60 rounded-2xl p-4 mb-4 border border-lavender/30">
      <div className="flex items-start gap-4">
        {/* Product image with consistent sizing */}
        <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={item.itemName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-8 h-8 bg-gray-300 rounded-full opacity-50"></div>';
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full opacity-50"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-black truncate pr-2">{item.itemName}</h3>
            <span className="text-black font-medium flex-shrink-0">
              {item.price ? `$${item.price}` : ''}
            </span>
          </div>
          
          <p className="text-black text-sm mb-1">{item.storeName}</p>
          <p className="text-black text-sm mb-3">
            Paused while feeling{' '}
            <span 
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: getEmotionColor(item.emotion) }}
            >
              {item.emotion}
            </span>
          </p>
          
          <div className="bg-lavender text-black text-sm py-2 px-3 rounded-lg text-center">
            {item.checkInTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PausedItemCard;
