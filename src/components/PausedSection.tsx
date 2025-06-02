

import PausedItemCard from './PausedItemCard';

const PausedSection = () => {
  // Placeholder data - this will come from your data store later
  const pausedItem = {
    name: "Ws Rainrunner Pack Jacket 2",
    price: 182,
    brand: "Janji",
    reason: "burnt out",
    checkInTime: "Checking-in in about 24 hours"
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-black mb-1">Paused for now</h2>
      <p className="text-black text-lg mb-3">You haven't decided yet—and that's okay</p>
      
      <PausedItemCard item={pausedItem} />
    </div>
  );
};

export default PausedSection;

