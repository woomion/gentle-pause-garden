
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
      title: "Item let go",
      description: `"${item.itemName}" has been moved to your mindful wins.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-4">
        <DialogHeader>
          <DialogTitle className="sr-only">Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Product image - smaller */}
          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={item.itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="w-12 h-12 bg-gray-300 rounded-full opacity-50"></div>';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded-full opacity-50"></div>
            )}
          </div>

          {/* Item details - more compact */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-black leading-tight">{item.itemName}</h3>
              {item.price && (
                <span className="text-base font-medium text-black ml-2">${item.price}</span>
              )}
            </div>
            
            <p className="text-gray-600 text-sm">{item.storeName}</p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-600 text-sm">Feeling</span>
              <span 
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: getEmotionColor(item.emotion) }}
              >
                {item.emotion}
              </span>
            </div>

            {item.notes && (
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-600 text-xs">{item.notes}</p>
              </div>
            )}

            <div className="bg-lavender text-black text-xs py-1.5 px-2 rounded text-center">
              {item.checkInTime}
            </div>
          </div>

          {/* Let it go button */}
          <div className="pt-2 border-t border-gray-100">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full bg-black text-white hover:bg-gray-800">
                  Let it go
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Let go of this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move "{item.itemName}" to your mindful wins. You can always see what you've let go of in your mindful wins section.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep paused</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLetGo}>
                    Let it go
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Bottom actions - side by side */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            {item.link ? (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 text-sm"
              >
                View item
              </a>
            ) : (
              <div></div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                  Delete Item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{item.itemName}" from your paused items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
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
