import { ExternalLink, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PauseLogItem } from '../stores/pauseLogStore';
import EmotionBadge from './EmotionBadge';
import { formatPrice } from '../utils/priceFormatter';
import { useMemo } from 'react';

interface PauseLogItemDetailProps {
  item: PauseLogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewLink: (item: PauseLogItem) => void;
  onDelete: (id: string) => void;
}

const PauseLogItemDetail = ({ item, isOpen, onClose, onViewLink, onDelete }: PauseLogItemDetailProps) => {
  const formattedPrice = useMemo(() => {
    if (!item?.originalPausedItem?.price) return null;
    return formatPrice(item.originalPausedItem.price);
  }, [item?.originalPausedItem?.price]);

  if (!item) return null;

  console.log('🔍 DEBUG: PauseLogItemDetail - item data:', {
    itemId: item.id,
    itemName: item.itemName,
    originalPausedItem: item.originalPausedItem,
    hasOriginalPausedItem: !!item.originalPausedItem,
    link: item.originalPausedItem?.link,
    url: item.originalPausedItem?.url
  });

  const hasLink = Boolean(
    item.originalPausedItem?.link || 
    item.originalPausedItem?.url
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-6 rounded-3xl bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600">
        <DialogHeader>
          <DialogTitle className="sr-only">Pause Log Item Details</DialogTitle>
          {/* Close button in top right corner */}
          <button 
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Item details */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-black dark:text-[#F9F5EB] leading-tight">{item.itemName}</h3>
              {formattedPrice && (
                <span className="text-xl font-bold text-black dark:text-[#F9F5EB] ml-2">{formattedPrice}</span>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-base">{item.storeName}</p>
            
            <div className="pt-1">
              <EmotionBadge emotion={item.emotion} />
            </div>

            {/* Tags section */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {item.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-1 bg-lavender/20 text-dark-gray dark:text-[#F9F5EB] rounded text-xs border border-lavender/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Notes section */}
            {item.notes && item.notes.trim() && (
              <div className="pt-2">
                <h4 className="text-sm font-medium text-black dark:text-[#F9F5EB] mb-1">Notes:</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {item.notes}
                </p>
              </div>
            )}

            {/* Decision date */}
            <div className="pt-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {item.status === 'purchased' 
                  ? `Purchased on ${item.letGoDate}`
                  : `Let go of on ${item.letGoDate}`
                }
              </p>
            </div>
          </div>

          {/* View link button */}
          {hasLink && (
            <div className="pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button 
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-[#F9F5EB] transition-colors duration-200"
                  >
                    <ExternalLink size={14} />
                    View original item link
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">
                      View item link?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                      Are you sure you want to visit this link? You already made a decision on this item.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20">
                      Nevermind
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onViewLink(item)}
                      className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black"
                    >
                      Yes, take me to the link
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete from history CTA */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 underline transition-colors">
                  Delete from history
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Delete from Paused Decision Log</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                    Are you sure you want to delete "{item?.itemName}" from your Paused Decision Log? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      console.log('🗑️ PauseLogItemDetail: Delete button clicked for item:', item?.id);
                      if (item) {
                        onDelete(item.id);
                        onClose(); // Close the detail modal after deletion
                      }
                    }}
                    className="rounded-2xl text-white transition-colors"
                    style={{
                      backgroundColor: '#777777',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#D66C6C';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#777777';
                    }}
                  >
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

export default PauseLogItemDetail;