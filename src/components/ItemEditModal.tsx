import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Upload, Camera } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PausedItem | LocalPausedItem;
  onSave: (updatedItem: Partial<PausedItem | LocalPausedItem>) => void;
}

const ItemEditModal = ({ isOpen, onClose, item, onSave }: ItemEditModalProps) => {
  const [formData, setFormData] = useState({
    itemName: item.itemName || '',
    storeName: item.storeName || '',
    price: item.price?.toString() || '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageDeleted, setImageDeleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset form when item changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        itemName: item.itemName || '',
        storeName: item.storeName || '',
        price: item.price?.toString() || '',
      });
      setImageFile(null);
      setPreviewUrl(null);
      setImageDeleted(false);
      
      // Check for existing image
      const existingImage = item.imageUrl || item.photo;
      if (existingImage && typeof existingImage === 'string') {
        setExistingImageUrl(existingImage);
      } else {
        setExistingImageUrl(null);
      }
    }
  }, [item, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = () => {
    console.log('🖼️ ItemEditModal: Saving with imageFile:', imageFile);
    const updatedItem: Partial<PausedItem | LocalPausedItem> = {
      itemName: formData.itemName.trim(),
      storeName: formData.storeName.trim(), // Remove fallback to empty string
      price: formData.price.trim(),
    };

    if (imageFile) {
      // Store the file object in the photo field
      updatedItem.photo = imageFile;
      console.log('🖼️ ItemEditModal: Added photo to updatedItem');
    } else if (imageDeleted) {
      // If image was deleted, clear the photo field
      updatedItem.photo = null;
      updatedItem.imageUrl = '';
    }

    console.log('🖼️ ItemEditModal: Final updatedItem:', updatedItem);
    onSave(updatedItem);
    onClose();
  };

  const clearPreview = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const deleteExistingImage = () => {
    setExistingImageUrl(null);
    setImageDeleted(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              onChange={(e) => handleInputChange('itemName', e.target.value)}
              placeholder="Enter item name"
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={formData.storeName}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              placeholder="Enter store name"
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="Enter price"
              autoComplete="off"
            />
          </div>

          <div>
            <Label>Product Image</Label>
            <div className="mt-2">
              {previewUrl ? (
                // Show new image preview
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    onClick={clearPreview}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : existingImageUrl && !imageDeleted ? (
                // Show existing image
                <div className="relative inline-block">
                  <img
                    src={existingImageUrl}
                    alt="Current item image"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    onClick={deleteExistingImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                // Show upload options
                <div className="flex gap-2">
                  {/* Upload from files */}
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload size={20} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1 text-center px-1">Upload Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Camera capture */}
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
                    <Camera size={20} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1 text-center px-1">Take Photo</span>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemEditModal;