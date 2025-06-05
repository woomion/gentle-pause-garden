
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '../contexts/AuthContext';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import ImageUpload from './ImageUpload';

const formSchema = z.object({
  itemName: z.string().min(2, {
    message: "Item name must be at least 2 characters.",
  }),
  storeName: z.string().min(2, {
    message: "Store name must be at least 2 characters.",
  }),
  price: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  emotion: z.string().min(2, {
    message: "Please select an emotion.",
  }),
  notes: z.string().optional(),
  pauseDuration: z.string().min(1, {
    message: "Please select a pause duration.",
  }),
});

interface PauseFormProps {
  onClose: () => void;
  onShowSignup: () => void;
  signupModalDismissed: boolean;
}

const PauseForm = ({ onClose, onShowSignup, signupModalDismissed }: PauseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emotion, setEmotion] = useState('');
  const [pauseDuration, setPauseDuration] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  const { register, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleImageUpload = (file: File, dataUrl: string) => {
    setPhoto(file);
    setPhotoDataUrl(dataUrl);
    setImageUrl(null);
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setPhoto(null);
    setPhotoDataUrl(null);
  };

  const resetForm = () => {
    setItemName('');
    setStoreName('');
    setPrice('');
    setUrl('');
    setEmotion('');
    setNotes('');
    setPauseDuration('');
    setPhoto(null);
    setPhotoDataUrl(null);
    setImageUrl(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim() || !storeName.trim() || !emotion || !pauseDuration) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const pauseData = {
        itemName: itemName.trim(),
        storeName: storeName.trim(),
        price: price || undefined,
        url: url || undefined,
        emotion,
        notes: notes.trim() || undefined,
        duration: pauseDuration,
        photo: photo || undefined,
        photoDataUrl: photoDataUrl || undefined,
        imageUrl: imageUrl || undefined
      };

      if (user) {
        await supabasePausedItemsStore.addItem(pauseData);
        toast({
          title: "Item Paused!",
          description: "Your item has been added to the pause list.",
        });
      } else {
        pausedItemsStore.addItem(pauseData);
        toast({
          title: "Item Paused!",
          description: "Your item has been added to the pause list. (Guest Mode)",
        });
        if (!signupModalDismissed) {
          onShowSignup();
        }
      }
      onClose();
      resetForm();
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem submitting the form. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-[#F9F5EB]">Pause this decision</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Fill in the details below to pause your decision.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url" className="text-black dark:text-[#F9F5EB]">Link to product (optional)</Label>
              <Input 
                id="url" 
                placeholder="Enter URL" 
                type="url"
                {...register('url')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {errors.url && (
                <p className="text-red-500 text-sm">{errors.url.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="itemName" className="text-black dark:text-[#F9F5EB]">Item name</Label>
                <Input 
                  id="itemName" 
                  placeholder="Enter item name" 
                  type="text" 
                  {...register('itemName')}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                {errors.itemName && (
                  <p className="text-red-500 text-sm">{errors.itemName.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="storeName" className="text-black dark:text-[#F9F5EB]">Store name</Label>
                <Input 
                  id="storeName" 
                  placeholder="Enter store name" 
                  type="text" 
                  {...register('storeName')}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
                {errors.storeName && (
                  <p className="text-red-500 text-sm">{errors.storeName.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price" className="text-black dark:text-[#F9F5EB]">Price (optional)</Label>
              <Input 
                id="price" 
                placeholder="Enter price" 
                type="text"
                {...register('price')}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
               {errors.price && (
                <p className="text-red-500 text-sm">{errors.price.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emotion" className="text-black dark:text-[#F9F5EB]">I'm feeling</Label>
              <Select onValueChange={(value) => setEmotion(value)}>
                <SelectTrigger className="bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]">
                  <SelectValue placeholder="Select an emotion" />
                </SelectTrigger>
                <SelectContent className="bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]">
                  <SelectItem value="bored">Bored</SelectItem>
                  <SelectItem value="overwhelmed">Overwhelmed</SelectItem>
                  <SelectItem value="burnt out">Burnt out</SelectItem>
                  <SelectItem value="sad">Sad</SelectItem>
                  <SelectItem value="inspired">Inspired</SelectItem>
                  <SelectItem value="deserving">Deserving</SelectItem>
                  <SelectItem value="curious">Curious</SelectItem>
                  <SelectItem value="anxious">Anxious</SelectItem>
                  <SelectItem value="lonely">Lonely</SelectItem>
                  <SelectItem value="celebratory">Celebratory</SelectItem>
                  <SelectItem value="resentful">Resentful</SelectItem>
                  <SelectItem value="something else">Something else</SelectItem>
                </SelectContent>
              </Select>
              {errors.emotion && (
                <p className="text-red-500 text-sm">{errors.emotion.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-black dark:text-[#F9F5EB]">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes here."
                className="resize-none bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {errors.notes && (
                <p className="text-red-500 text-sm">{errors.notes.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-black dark:text-[#F9F5EB]">Pause duration</Label>
              <ToggleGroup 
                type="single" 
                value={pauseDuration} 
                onValueChange={(value) => setPauseDuration(value || '')}
                className="justify-start"
              >
                <ToggleGroupItem value="24 hours" aria-label="24 hours">
                  24 hours
                </ToggleGroupItem>
                <ToggleGroupItem value="1 day" aria-label="1 day">
                  1 day
                </ToggleGroupItem>
                <ToggleGroupItem value="3 days" aria-label="3 days">
                  3 days
                </ToggleGroupItem>
              </ToggleGroup>
              {errors.pauseDuration && (
                <p className="text-red-500 text-sm">{errors.pauseDuration.message}</p>
              )}
            </div>

            <ImageUpload 
              onImageUpload={handleImageUpload} 
              onImageUrlChange={handleImageUrlChange}
            />

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-[#CAB6F7] hover:bg-[#B8A3F0] text-black flex-1"
              >
                {isSubmitting ? "Starting Pause..." : "Start Pause"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PauseForm;
