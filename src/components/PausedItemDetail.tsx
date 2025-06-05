import { useState } from 'react';
import { X, Timer, ExternalLink, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PausedItem } from '../stores/pausedItemsStore';

interface PausedItemDetailProps {
  item: PausedItem | any;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const PausedItemDetail = ({ item, isOpen, onClose, onDelete }: PausedItemDetailProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const emotionColor = (() => {
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
    return emotionColors[item.emotion] || '#F0F0EC';
  })();

  const imageUrl = (() => {
    if (item.imageUrl) {
      if (item.imageUrl.includes('supabase')) {
        return item.imageUrl;
      } else {
        try {
          new URL(item.imageUrl);
          return item.imageUrl;
        } catch {
          return null;
        }
      }
    }
    if (item.photoDataUrl) {
      return item.photoDataUrl;
    }
    if (item.photo instanceof File) {
      return URL.createObjectURL(item.photo);
    }
    return null;
  })();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.parentElement) {
      target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-xl flex items-center justify-center"><div class="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded-full opacity-50" aria-hidden="true"></div></div>';
    }
  };

  const handleDelete = () => {
    onDelete(item.id);
    setShowDeleteDialog(false);
    onClose();
  };

  const formattedPrice = item.price ? `$${item.price}` : '';

  // Check if notes exist and are meaningful (not just placeholder text, empty, or null values)
  const hasValidNotes = item.notes && 
    item.notes.trim() && 
    !item.notes.match(/^[a-z]{8,}$/) && 
    item.notes !== 'undefined' && 
    item.notes !== 'null';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="pt-6">
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={item.itemName}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" aria-hidden="true" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] break-words">
                    {item.itemName}
                  </h2>
                  {formattedPrice && (
                    <span className="text-black dark:text-[#F9F5EB] font-medium ml-2 flex-shrink-0">
                      {formattedPrice}
                    </span>
                  )}
                </div>
                
                <p className="text-black dark:text-[#F9F5EB] mb-3">
                  {item.storeName}
                </p>
                
                <div className="text-black dark:text-[#F9F5EB] text-sm mb-3">
                  <span>Paused while feeling </span>
                  <span 
                    className="inline-block px-2 py-1 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: emotionColor,
                      color: '#000'
                    }}
                  >
                    {item.emotion}
                  </span>
                </div>
              </div>
            </div>

            {hasValidNotes && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-black dark:text-[#F9F5EB] mb-2">Notes</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm bg-white/40 dark:bg-white/5 rounded-lg p-3">
                  {item.notes}
                </p>
              </div>
            )}

            <div className="bg-[#E7D9FA] rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-black">
                <Timer size={16} aria-hidden="true" />
                <span className="text-sm font-medium">{item.checkInTime}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {item.url && (
                <Button 
                  onClick={() => window.open(item.url, '_blank')}
                  className="flex-1 bg-[#CAB6F7] hover:bg-[#B8A3F0] text-black border border-gray-200 dark:border-white/20"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View Item
                </Button>
              )}
              
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Delete Paused Item</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                      Are you sure you want to delete "{item.itemName}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-white/80 dark:hover:bg-white/20">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white border border-red-600 dark:border-red-500"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PausedItemDetail;
