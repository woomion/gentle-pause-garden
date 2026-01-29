import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { PausedItem as CloudPausedItem } from '@/stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '@/stores/pausedItemsStore';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/priceFormatter';
import ItemImage from './ItemImage';

interface ReviewItemCardProps {
  item: CloudPausedItem | LocalPausedItem;
  onViewItem?: (item: CloudPausedItem | LocalPausedItem) => void;
  onEdit?: (item: CloudPausedItem | LocalPausedItem, updates: Partial<CloudPausedItem | LocalPausedItem>) => void;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const ReviewItemCard = ({ item, onViewItem, onEdit }: ReviewItemCardProps) => {
  const [localItem, setLocalItem] = useState(item);
  
  // Calculate progress for the progress bar (same as DesktopItemCard)
  const progress = useMemo(() => {
    const total = item.checkInDate.getTime() - item.pausedAt.getTime();
    const elapsed = Date.now() - item.pausedAt.getTime();
    if (total <= 0) return 100;
    return clamp(Math.round((elapsed / total) * 100), 0, 100);
  }, [item.checkInDate, item.pausedAt]);

  // Check if item is ready for review
  const isReadyForReview = useMemo(() => {
    const now = new Date();
    return new Date(item.checkInDate) <= now;
  }, [item.checkInDate]);

  const formattedPrice = useMemo(() => formatPrice(item.price), [item.price]);

  const itemName = item.itemName || 'Untitled Item';
  const storeName = 'storeName' in item ? (item as any).storeName : '';

  const handleImageSelected = (file: File) => {
    console.log('📸 Image selected in ReviewItemCard:', file.name);
    if (onEdit) {
      // Create a local preview URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setLocalItem(prev => ({ ...prev, imageUrl: previewUrl, photo: file }));
      
      // Pass the file to the edit handler
      onEdit(item, { photo: file });
    }
  };

  return (
    <div className="group relative bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl shadow-sm transition-all duration-300 overflow-hidden">
      {/* Main image */}
      <div className="relative w-full h-48 bg-muted/30 overflow-hidden">
        <ItemImage 
          item={localItem} 
          showAddButton={!!onEdit}
          onImageSelected={handleImageSelected}
        />
        
        {/* View link button overlay */}
        {(item.link || (item as any).url) && onViewItem && (
          <div className="absolute top-3 right-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewItem(item)}
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background/90"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

      </div>

      {/* Item details */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1">{itemName}</h3>
          {storeName && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{storeName}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-3">
          {formattedPrice && (
            <span className="text-lg font-semibold text-foreground">{formattedPrice}</span>
          )}
        </div>

        {/* Notes preview if available */}
        {item.notes && (
          <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewItemCard;