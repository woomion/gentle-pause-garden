
import { useState } from 'react';
import { Timer, ExternalLink } from 'lucide-react';
import { PausedItem } from '../stores/pausedItemsStore';
import { pauseLogStore } from '../stores/pauseLogStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ItemReviewModalProps {
  items: PausedItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onItemDecided: (id: string) => void;
  onNext: () => void;
}

const ItemReviewModal = ({ items, currentIndex, isOpen, onClose, onItemDecided, onNext }: ItemReviewModalProps) => {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState<'let-go' | 'purchased' | null>(null);

  const currentItem = items[currentIndex];
  const isLastItem = currentIndex === items.length - 1;

  if (!currentItem) return null;

  const getEmotionColor = (emotion: string) => {
    const emotionColors: { [key: string]: string } = {
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

  const getImageUrl = () => {
    if (currentItem.photoDataUrl) return currentItem.photoDataUrl;
    if (currentItem.photo instanceof File) return URL.createObjectURL(currentItem.photo);
    return currentItem.imageUrl;
  };

  const handleDecision = (action: 'let-go' | 'purchased') => {
    const status = action === 'let-go' ? 'let-go' : 'purchased';
    
    pauseLogStore.addItem({
      itemName: currentItem.itemName,
      emotion: currentItem.emotion,
      storeName: currentItem.storeName,
      status,
      notes: currentItem.notes
    });
    
    onItemDecided(currentItem.id);
    
    const toastMessage = action === 'let-go' 
      ? `"${currentItem.itemName}" has been moved to your pause log.`
      : "We've moved this thoughtful decision to your Pause Log for future reference.";
    
    const toastTitle = action === 'let-go' 
      ? "Item released" 
      : "Great, you made a conscious choice!";

    toast({
      title: toastTitle,
      description: toastMessage,
    });

    setShowConfirmDialog(null);

    if (isLastItem) {
      onClose();
    } else {
      onNext();
    }
  };

  const imageUrl = getImageUrl();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto p-6 rounded-3xl bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold text-black dark:text-[#F9F5EB] mb-2">
              Time to Review
            </DialogTitle>
            {items.length > 1 && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                Item {currentIndex + 1} of {items.length}
              </p>
            )}
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Product image */}
            <div className="relative">
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={currentItem.itemName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
                )}
              </div>

              {/* Ready to review banner */}
              <div className="absolute bottom-0 left-0 right-0 py-2 px-4 rounded-b-2xl text-center text-xs font-medium flex items-center justify-center gap-2 bg-[#E7D9FA]" style={{ color: '#000' }}>
                <Timer size={14} />
                Ready to review
              </div>
            </div>

            {/* Item details */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-black dark:text-[#F9F5EB] leading-tight">{currentItem.itemName}</h3>
                {currentItem.price && (
                  <span className="text-xl font-bold text-black dark:text-[#F9F5EB] ml-2">${currentItem.price}</span>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-base">{currentItem.storeName}</p>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300 text-sm">Paused while feeling</span>
                <span 
                  className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: getEmotionColor(currentItem.emotion),
                    color: '#000'
                  }}
                >
                  {currentItem.emotion}
                </span>
              </div>
            </div>

            {/* Decision buttons */}
            <div className="space-y-3">
              <button 
                onClick={() => setShowConfirmDialog('let-go')}
                className="w-full bg-transparent border-4 border-lavender hover:bg-lavender/10 dark:hover:bg-lavender/20 text-black dark:text-[#F9F5EB] font-medium py-2 px-4 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Let This Item Go
              </button>

              <div className="text-center">
                <button 
                  onClick={() => setShowConfirmDialog('purchased')}
                  className="text-black dark:text-[#F9F5EB] hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-4 transition-colors duration-200 text-base font-medium"
                >
                  I'm Purchasing this Item
                </button>
              </div>
            </div>

            {/* Footer */}
            {currentItem.link && (
              <div className="pt-2 text-center">
                <a 
                  href={currentItem.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-[#F9F5EB] transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <ExternalLink size={14} />
                  View item
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialogs */}
      <AlertDialog open={showConfirmDialog === 'let-go'} onOpenChange={() => setShowConfirmDialog(null)}>
        <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Let go of this item?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              This will move "{currentItem.itemName}" to your pause log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDecision('let-go')} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
              Let it go
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog === 'purchased'} onOpenChange={() => setShowConfirmDialog(null)}>
        <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Mark as purchased?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              This will move "{currentItem.itemName}" to your Pause Log as a thoughtful purchase decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDecision('purchased')} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
              Yes, I bought it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ItemReviewModal;
