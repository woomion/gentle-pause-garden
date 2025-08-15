
import { ExternalLink } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PauseLogItem } from '../stores/pauseLogStore';

interface PauseLogItemCardProps {
  item: PauseLogItem;
  onDelete: (id: string) => void;
  onViewLink: (item: PauseLogItem) => void;
  onClick: (item: PauseLogItem) => void;
}

const PauseLogItemCard = ({ item, onDelete, onViewLink, onClick }: PauseLogItemCardProps) => {

  // Check only the originalPausedItem for links
  const hasLink = Boolean(
    item.originalPausedItem?.link || 
    item.originalPausedItem?.url
  );

  return (
    <div className="p-4 relative">
      <div 
        className="cursor-pointer"
        onClick={(e) => {
          console.log('🗑️ PauseLogItemCard: Header clicked for item:', item.id);
          onClick(item);
        }}
      >
        <div className="flex items-start justify-between mb-1 gap-2">
          <h3 className="text-black dark:text-[#F9F5EB] text-lg sm:text-lg text-base flex-1 min-w-0 break-words">
            <span className="font-medium break-words">{item.itemName}</span>
            <span className="font-normal break-words"> from {item.storeName}</span>
          </h3>
          <span className="text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap flex-shrink-0 ml-2">
            {item.status === 'purchased' ? 'Purchased' : 'Let go of'}
          </span>
        </div>
        
        {item.notes && (
          <div className="mb-1">
            <p className="text-gray-600 dark:text-gray-400 text-sm italic">
              "{item.notes}"
            </p>
          </div>
        )}
        
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {item.letGoDate}
        </p>
      </div>
      
      <div className="flex items-center justify-end mt-3">
        <div className="flex items-center gap-2">
          {hasLink && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">
                    View item link?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                    {item.status === 'purchased' 
                      ? `Are you sure you want to go to this link? You already purchased this item.`
                      : `Are you sure you want to go to this link? You already let this item go.`
                    }
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PauseLogItemCard;
