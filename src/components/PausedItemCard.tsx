
interface PausedItemCardProps {
  item: {
    name: string;
    price: number;
    brand: string;
    reason: string;
    checkInTime: string;
  };
}

const PausedItemCard = ({ item }: PausedItemCardProps) => {
  return (
    <div className="bg-white/60 rounded-2xl p-4 mb-4 border border-lavender/30">
      <div className="flex items-start gap-4">
        {/* Placeholder image */}
        <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full opacity-50"></div>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-dark-gray">{item.name}</h3>
            <span className="text-dark-gray font-medium">${item.price}</span>
          </div>
          
          <p className="text-taupe text-sm mb-1">{item.brand}</p>
          <p className="text-taupe text-sm mb-3">
            Paused while feeling <span className="bg-yellow-200 px-1 rounded">{item.reason}</span>
          </p>
          
          <div className="bg-lavender text-dark-gray text-sm py-2 px-3 rounded-lg text-center">
            {item.checkInTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PausedItemCard;
