
import { X, ExternalLink } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PauseLogItem } from '../stores/pauseLogStore';

interface PauseLogItemCardProps {
  item: PauseLogItem;
  onDelete: (id: string) => void;
  onViewLink: (item: PauseLogItem) => void;
}

const PauseLogItemCard = ({ item, onDelete, onViewLink }: PauseLogItemCardProps) => {
  const getEmotionColor = (emotion: string): string => {
    const emotionColors: Record<string, string> = {
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

  // Check only the originalPausedItem for links
  const hasLink = Boolean(
    item.originalPausedItem?.link || 
    item.originalPausedItem?.url
  );

  return (
    <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-4 border border-lavender/30 dark:border-gray-600 relative">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from Paused Decision Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.itemName}" from your Paused Decision Log? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(item.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-3">
        <h3 className="text-black dark:text-[#F9F5EB] text-lg">
          <span className="font-medium">{item.itemName}</span>
          <span className="font-normal"> from {item.storeName}</span>
        </h3>
      </div>
      
      <div className="mb-2">
        <span className="text-black dark:text-[#F9F5EB] text-sm">
          Paused while feeling{' '}
        </span>
        <span 
          className="inline-block px-2 py-1 rounded text-xs font-medium"
          style={{ 
            backgroundColor: getEmotionColor(item.emotion),
            color: '#000'
          }}
        >
          {item.emotion}
        </span>
      </div>
      
      {item.notes && item.notes.trim() && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
          {item.notes}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {item.status === 'purchased' 
            ? `Purchased on ${item.letGoDate}`
            : `Let go of on ${item.letGoDate}`
          }
        </p>
        
        {hasLink && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors p-1">
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
  );
};

export default PauseLogItemCard;
