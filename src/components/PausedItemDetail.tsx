
import { ExternalLink } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { formatPrice } from '../utils/priceFormatter';
import { useItemActions } from '../hooks/useItemActions';
import ItemImage from './ItemImage';
import PauseDurationBanner from './PauseDurationBanner';
import EmotionBadge from './EmotionBadge';

interface PausedItemDetailProps {
  item: PausedItem;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const PausedItemDetail = ({ item, isOpen, onClose, onDelete }: PausedItemDetailProps) => {
  const { handleViewItem, handleLetGo, handleBought } = useItemActions();

  const formattedPrice = useMemo(() => formatPrice(item.price), [item.price]);

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  const handleKeepPaused = () => {
    onClose();
  };

  // Enhanced debug logging for the item data
  console.log('🔍 DEBUG: PausedItemDetail render with full item data:', {
    itemId: item.id,
    itemName: item.itemName,
    link: item.link,
    imageUrl: item.imageUrl,
    photoDataUrl: item.photoDataUrl ? 'has photoDataUrl' : 'no photoDataUrl',
    hasLink: !!item.link,
    hasImageUrl: !!item.imageUrl,
    linkType: typeof item.link,
    imageUrlType: typeof item.imageUrl,
    allItemKeys: Object.keys(item)
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm mx-auto p-6 rounded-3xl bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product image */}
          <div className="relative">
            <ItemImage item={item} />
            {/* Pause Duration Banner - touching bottom of image */}
            <PauseDurationBanner checkInTime={item.checkInTime} />
          </div>

          {/* Item details */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-black dark:text-[#F9F5EB] leading-tight">{item.itemName}</h3>
              {formattedPrice && (
                <span className="text-xl font-bold text-black dark:text-[#F9F5EB] ml-2">{formattedPrice}</span>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-base">{item.storeName}</p>
            
            <EmotionBadge emotion={item.emotion} />

            {/* Only show notes if they exist and aren't empty */}
            {item.notes && item.notes.trim() && (
              <div className="pt-2">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {item.notes}
                </p>
              </div>
            )}
          </div>

          {/* Let it go button */}
          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full bg-transparent border-4 border-lavender hover:bg-lavender/10 dark:hover:bg-lavender/20 text-black dark:text-[#F9F5EB] font-medium py-2 px-4 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                  Let This Item Go
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Let go of this item?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                    This will move "{item.itemName}" to your pause log. You can always see what you've let go of in your pause log section.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20" onClick={handleKeepPaused}>Keep paused</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleLetGo(item, onDelete, onClose)} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
                    Let it go
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* I bought this button */}
          <div className="text-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-[#F9F5EB] transition-colors duration-200 underline">
                  I Purchased This
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Mark as purchased?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                    This will move "{item.itemName}" to your Pause Log as a thoughtful purchase decision.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20" onClick={handleKeepPaused}>Keep paused</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleBought(item, onDelete, onClose)} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
                    Yes, I bought it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-between">
            {item.link && item.link.trim() ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ DEBUG: View item button clicked manually');
                  console.log('🖱️ DEBUG: About to call handleViewItem with:', item);
                  handleViewItem(item);
                }}
                className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-[#F9F5EB] transition-colors duration-200 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                type="button"
              >
                <ExternalLink size={14} />
                View item
              </button>
            ) : (
              <div></div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-sm">
                  Delete item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                    This will permanently delete "{item.itemName}" from your paused items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-2xl bg-red-500 hover:bg-red-600 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PausedItemDetail;
