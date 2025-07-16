
import { ExternalLink } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PauseLogItem } from '../stores/pauseLogStore';
import { getEmotionColor } from '../utils/emotionColors';
import { useTheme } from '../contexts/ThemeContext';

interface PauseLogItemCardProps {
  item: PauseLogItem;
  onDelete: (id: string) => void;
  onViewLink: (item: PauseLogItem) => void;
  onClick: (item: PauseLogItem) => void;
}

const PauseLogItemCard = ({ item, onDelete, onViewLink, onClick }: PauseLogItemCardProps) => {
  const { isDarkMode } = useTheme();

  // Check only the originalPausedItem for links
  const hasLink = Boolean(
    item.originalPausedItem?.link || 
    item.originalPausedItem?.url
  );

  return (
    <div className="p-4 relative">
      <div 
        className="mb-3 cursor-pointer"
        onClick={(e) => {
          console.log('🗑️ PauseLogItemCard: Header clicked for item:', item.id);
          onClick(item);
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-black dark:text-[#F9F5EB] text-lg">
            <span className="font-medium">{item.itemName}</span>
            <span className="font-normal"> from {item.storeName}</span>
          </h3>
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            {item.status === 'purchased' ? 'Purchased' : 'Let go of'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {item.letGoDate}
        </p>
        
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
