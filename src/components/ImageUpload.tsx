
import React, { useState } from 'react';
import { Upload, Link, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageUpload: (file: File, dataUrl: string) => void;
  onImageUrlChange: (url: string) => void;
}

const ImageUpload = ({ onImageUpload, onImageUrlChange }: ImageUploadProps) => {
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImage(dataUrl);
        onImageUpload(file, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onImageUrlChange(imageUrl.trim());
      setUploadedImage(imageUrl.trim());
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImageUrl('');
    onImageUrlChange('');
  };

  return (
    <div className="grid gap-2">
      <Label className="text-black dark:text-[#F9F5EB]">Add image (optional)</Label>
      
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={uploadMethod === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('upload')}
          className="flex-1"
        >
          <Upload size={16} className="mr-2" />
          Upload
        </Button>
        <Button
          type="button"
          variant={uploadMethod === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('url')}
          className="flex-1"
        >
          <Link size={16} className="mr-2" />
          URL
        </Button>
      </div>

      {uploadMethod === 'upload' && (
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20"
        />
      )}

      {uploadMethod === 'url' && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            size="sm"
          >
            Add
          </Button>
        </div>
      )}

      {uploadedImage && (
        <div className="relative">
          <img
            src={uploadedImage}
            alt="Preview"
            className="w-full max-w-xs rounded-lg border border-gray-200 dark:border-white/20"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clearImage}
            className="absolute top-2 right-2"
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
