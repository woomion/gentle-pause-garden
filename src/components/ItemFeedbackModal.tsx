import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { rulesStore } from '@/utils/parsingRulesStore';

interface ItemFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  originalData: any;
  onSave: (correctedData: any) => void;
}

export const ItemFeedbackModal = ({ isOpen, onClose, originalUrl, originalData, onSave }: ItemFeedbackModalProps) => {
  const { toast } = useToast();
  const [itemName, setItemName] = useState(originalData?.itemName || '');
  const [price, setPrice] = useState(originalData?.price || '');
  const [imageUrl, setImageUrl] = useState(originalData?.imageUrl || '');
  const [brand, setBrand] = useState(originalData?.brand || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const correctedData = {
        itemName: itemName.trim(),
        price: price.trim(),
        imageUrl: imageUrl.trim(),
        brand: brand.trim(),
        storeName: originalData?.storeName,
        priceCurrency: originalData?.priceCurrency || 'USD'
      };

      // Track feedback for future improvements
      const feedback = {
        url: originalUrl,
        userCorrection: {
          ...(itemName !== originalData?.itemName && { itemName }),
          ...(price !== originalData?.price && { price }),
          ...(imageUrl !== originalData?.imageUrl && { imageUrl }),
          ...(brand !== originalData?.brand && { brand })
        },
        originalParsed: originalData,
        timestamp: new Date().toISOString()
      };

      await rulesStore.addFeedback(feedback);
      
      onSave(correctedData);
      onClose();
      
      toast({
        title: "Success",
        description: "Product details updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update product details",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fix Product Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemName">Product Name *</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>

          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price (numbers only)"
            />
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Enter brand name"
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};