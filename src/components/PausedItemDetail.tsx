
import { X } from 'lucide-react';
import { PausedItem } from '../stores/pausedItemsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface PausedItemDetailProps {
  item: PausedItem;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const PausedItemDetail = ({ item, isOpen, onClose, onDelete }: PausedItemDetailProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product image */}
          <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
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
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-black">{item.itemName}</h3>
              {item.price && (
                <span className="text-lg font-medium text-black">${item.price}</span>
              )}
            </div>
            
            <p className="text-gray-700">{item.storeName}</p>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Paused while feeling</span>
              <span 
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: getEmotionColor(item.emotion) }}
              >
                {item.emotion}
              </span>
            </div>

            {item.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                <p className="text-gray-600 text-sm">{item.notes}</p>
              </div>
            )}

            <div className="bg-lavender text-black text-sm py-2 px-3 rounded-lg">
              {item.checkInTime}
            </div>

            {item.link && (
              <div className="pt-2">
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 text-sm"
                >
                  View item
                </a>
              </div>
            )}
          </div>

          {/* Delete button */}
          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
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
