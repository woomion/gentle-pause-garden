
import { X } from 'lucide-react';
import { PausedItem } from '../stores/pausedItemsStore';
import { mindfulWinsStore } from '../stores/mindfulWinsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PausedItemDetailProps {
  item: PausedItem;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const PausedItemDetail = ({ item, isOpen, onClose, onDelete }: PausedItemDetailProps) => {
  const { toast } = useToast();

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
    if (item.photoDataUrl) {
      return item.photoDataUrl;
    }
    if (item.photo && item.photo instanceof File) {
      return URL.createObjectURL(item.photo);
    }
    return item.imageUrl;
  };

  const imageUrl = getImageUrl();

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  const handleLetGo = () => {
    // Move item to mindful wins
    mindfulWinsStore.addItem({
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName
    });
    
    // Remove from paused items
    onDelete(item.id);
    onClose();
    
    // Show success toast
    toast({
      title: "Item released",
      description: `"${item.itemName}" has been moved to your mindful wins.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm mx-auto p-6 rounded-3xl"
        style={{ backgroundColor: '#FAF6F1' }}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product image */}
          <div className="w-full h-48 bg-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={item.itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-gray-300 rounded-full opacity-50"></div>';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full opacity-50"></div>
            )}
          </div>

          {/* Item details */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-black leading-tight">{item.itemName}</h3>
              {item.price && (
                <span className="text-xl font-bold text-black ml-2">${item.price}</span>
              )}
            </div>
            
            <p className="text-gray-600 text-base">{item.storeName}</p>
            
            <div className="space-y-2">
              <span className="text-gray-600 text-sm">Feeling</span>
              <div>
                <span 
                  className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                  style={{ backgroundColor: getEmotionColor(item.emotion) }}
                >
                  {item.emotion}
                </span>
              </div>
            </div>

            {/* Pause Duration Indicator */}
            <div 
              className="w-full py-3 px-4 rounded-2xl text-center text-sm font-medium text-black"
              style={{ backgroundColor: '#E7D9FA' }}
            >
              {item.checkInTime}
            </div>
          </div>

          {/* Let it go button */}
          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-2xl py-3 text-base font-medium transition-all duration-200 hover:scale-[1.02]">
                  Let it go
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ backgroundColor: '#FAF6F1' }} className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Let go of this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move "{item.itemName}" to your mindful wins. You can always see what you've let go of in your mindful wins section.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl">Keep paused</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLetGo} className="rounded-2xl">
                    Let it go
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Footer actions */}
          <div className="pt-4 flex items-center justify-between">
            {item.link ? (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 text-sm hover:text-black transition-colors duration-200"
              >
                View item
              </a>
            ) : (
              <div></div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600 text-sm">
                  Delete item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ backgroundColor: '#FAF6F1' }} className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{item.itemName}" from your paused items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-2xl">
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
