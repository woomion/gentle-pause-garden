
import React, { useState } from 'react';
import { Camera, Link } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageUpload: (file: File, dataUrl: string) => void;
  onImageUrlChange: (url: string) => void;
}

const ImageUpload = ({ onImageUpload, onImageUrlChange }: ImageUploadProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPreviewUrl(dataUrl);
        onImageUpload(file, dataUrl);
      };
      reader.readAsDataURL(file);
      setImageUrl(''); // Clear URL input when file is selected
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    onImageUrlChange(url);
    setPreviewUrl(null); // Clear file preview when URL is entered
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label className="text-black dark:text-[#F9F5EB]">Add Image (optional)</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="photo" className="text-sm text-black dark:text-[#F9F5EB]">Upload Photo</Label>
            <div className="relative">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo')?.click()}
                className="w-full bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
              >
                <Camera size={16} className="mr-2" />
                Choose Photo
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="imageUrl" className="text-sm text-black dark:text-[#F9F5EB]">Or Image URL</Label>
            <div className="relative">
              <Link size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="imageUrl"
                type="url"
                placeholder="Paste image URL"
                value={imageUrl}
                onChange={handleUrlChange}
                className="pl-10 bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
              />
            </div>
          </div>
        </div>

        {previewUrl && (
          <div className="mt-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-white/20"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
