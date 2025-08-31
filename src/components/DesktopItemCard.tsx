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
      {/* Progress bar at top */}
      <div className="h-1 w-full bg-muted/30">
        <div
          className={`h-full transition-all duration-300 ${
            isReadyForReview 
              ? 'bg-gradient-to-r from-primary to-primary/80' 
              : 'bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card content */}
      <div className="p-4 cursor-pointer" onClick={onClick}>
        <div className="flex gap-3 mb-3">
          {/* Item image */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted/30">
            <ItemImage
              item={item}
            />
          </div>

          {/* Item details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm text-foreground truncate">{itemName}</h3>
              
              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {item.link && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewItem(item);
                      }}
                      className="text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditModal(true);
                    }}
                    className="text-xs"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="text-xs text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {storeName && (
              <p className="text-xs text-muted-foreground mb-1 truncate">{storeName}</p>
            )}
            
            <div className="flex items-center justify-between">
              {formattedPrice && (
                <span className="text-sm font-medium text-foreground">{formattedPrice}</span>
              )}
              <span className="text-xs text-muted-foreground">{item.checkInTime}</span>
            </div>
          </div>
        </div>

        {/* Notes preview if available */}
        {item.notes && (
          <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.notes}
          </div>
        )}
      </div>

      {/* Ready indicator */}
      {isReadyForReview && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default DesktopItemCard;