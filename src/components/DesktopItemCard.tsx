import { useMemo, useState } from 'react';
import { ExternalLink, Edit, MoreHorizontal } from 'lucide-react';
import { PausedItem as CloudPausedItem } from '@/stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '@/stores/pausedItemsStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatPrice } from '@/utils/priceFormatter';
import { useItemActions } from '@/hooks/useItemActions';
import ItemImage from './ItemImage';

interface DesktopItemCardProps {
  item: CloudPausedItem | LocalPausedItem;
  onClick?: () => void;
  onEdit?: (item: CloudPausedItem | LocalPausedItem, updates: Partial<CloudPausedItem | LocalPausedItem>) => void;
  onDelete?: (id: string) => void;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const DesktopItemCard = ({ item, onClick, onEdit, onDelete }: DesktopItemCardProps) => {
  const { handleViewItem } = useItemActions();
  const [showEditModal, setShowEditModal] = useState(false);

  // Calculate progress for the top bar
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

  return (
    <div className="group relative bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl shadow-sm hover:shadow-lg hover:bg-card/60 transition-all duration-300 overflow-hidden">

      {/* Card content */}
      <div className="cursor-pointer" onClick={onClick}>
        {/* Main image */}
        <div className="relative w-full h-48 bg-muted/30 overflow-hidden">
          <ItemImage item={item} />
          
          {/* Actions dropdown overlay */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background/90"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {item.link && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewItem(item);
                    }}
                    className="text-sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="text-sm text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Ready indicator */}
          {isReadyForReview && (
            <div className="absolute top-3 left-3 w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg" />
          )}
          
          {/* Progress bar at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted/30">
            <div
              className={`h-full transition-all duration-300 ${
                isReadyForReview 
                  ? 'bg-gradient-to-r from-primary to-primary/80' 
                  : 'bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
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
            <span className="text-sm text-muted-foreground">{item.checkInTime}</span>
          </div>

          {/* Notes preview if available */}
          {item.notes && (
            <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {item.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopItemCard;