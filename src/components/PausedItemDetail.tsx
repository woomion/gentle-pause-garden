import { Timer, ExternalLink } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { supabasePauseLogStore } from '../stores/supabasePauseLogStore';
import { pauseLogStore } from '../stores/pauseLogStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

interface PausedItemDetailProps {
  item: PausedItem;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const PausedItemDetail = ({ item, isOpen, onClose, onDelete }: PausedItemDetailProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

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
    // Debug logging
    console.log('Getting image URL for item:', {
      itemId: item.id,
      imageUrl: item.imageUrl,
      photoDataUrl: item.photoDataUrl,
      hasPhoto: !!item.photo
    });
    
    if (item.imageUrl && item.imageUrl.includes('supabase')) {
      console.log('Using Supabase image URL:', item.imageUrl);
      return item.imageUrl;
    }
    if (item.photoDataUrl) {
      console.log('Using photo data URL');
      return item.photoDataUrl;
    }
    if (item.photo && item.photo instanceof File) {
      console.log('Creating object URL from file');
      return URL.createObjectURL(item.photo);
    }
    if (item.imageUrl) {
      console.log('Using regular image URL:', item.imageUrl);
      return item.imageUrl;
    }
    console.log('No image URL found');
    return null;
  };

  const imageUrl = getImageUrl();

  const formattedPrice = useMemo(() => {
    if (!item.price) return '';
    
    const price = parseFloat(item.price);
    if (isNaN(price)) return '';
    
    // Always show two decimal places
    return `$${price.toFixed(2)}`;
  }, [item.price]);

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  const handleLetGo = async () => {
    console.log('📝 Adding item to pause log (let go):', {
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName,
      status: 'let-go',
      notes: item.notes,
      user: user ? 'authenticated' : 'guest'
    });

    try {
      // Use appropriate pause log store based on authentication
      if (user) {
        await supabasePauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'let-go',
          notes: item.notes
        });
        console.log('✅ Item added to Supabase pause log');
      } else {
        pauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'let-go',
          notes: item.notes
        });
        console.log('✅ Item added to local pause log');
      }
      
      // Remove from paused items
      onDelete(item.id);
      onClose();
      
      // Show success toast
      toast({
        title: "Item released",
        description: `"${item.itemName}" has been moved to your pause log.`,
      });
    } catch (error) {
      console.error('❌ Error adding item to pause log:', error);
      toast({
        title: "Error",
        description: "Failed to save decision. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBought = async () => {
    console.log('📝 Adding item to pause log (purchased):', {
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName,
      status: 'purchased',
      notes: item.notes,
      user: user ? 'authenticated' : 'guest'
    });

    try {
      // Use appropriate pause log store based on authentication
      if (user) {
        await supabasePauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'purchased',
          notes: item.notes
        });
        console.log('✅ Item added to Supabase pause log');
      } else {
        pauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'purchased',
          notes: item.notes
        });
        console.log('✅ Item added to local pause log');
      }
      
      // Remove from paused items
      onDelete(item.id);
      onClose();
      
      // Show success toast that auto-dismisses
      const toastInstance = toast({
        title: "Great, you made a conscious choice!",
        description: "We've moved this thoughtful decision to your Pause Log for future reference.",
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        toastInstance.dismiss();
      }, 3000);
    } catch (error) {
      console.error('❌ Error adding item to pause log:', error);
      toast({
        title: "Error",
        description: "Failed to save decision. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeepPaused = () => {
    onClose();
  };

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
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', imageUrl);
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
              )}
            </div>

            {/* Pause Duration Banner - touching bottom of image */}
            <div 
              className="absolute bottom-0 left-0 right-0 py-2 px-4 rounded-b-2xl text-center text-xs font-medium flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: '#E7D9FA',
                color: '#000'
              }}
            >
              <Timer size={14} />
              {item.checkInTime}
            </div>
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
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300 text-sm">Paused while feeling</span>
              <span 
                className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: getEmotionColor(item.emotion),
                  color: '#000'
                }}
              >
                {item.emotion}
              </span>
            </div>

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
                  <AlertDialogAction onClick={handleLetGo} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
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
                  <AlertDialogAction onClick={handleBought} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
                    Yes, I bought it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-between">
            {item.link ? (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-[#F9F5EB] transition-colors duration-200 flex items-center gap-1"
              >
                <ExternalLink size={14} />
                View item
              </a>
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
