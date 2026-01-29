import { useRef, useState } from 'react';
import { Plus, Camera, Upload } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ImageAddButtonProps {
  onImageSelected: (file: File) => void;
  className?: string;
}

const ImageAddButton = ({ onImageSelected, className = '' }: ImageAddButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      setIsOpen(false);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-sm hover:bg-background hover:shadow-md transition-all duration-200 z-10 ${className}`}
          aria-label="Add or change image"
        >
          <Plus size={16} className="text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2 bg-background border border-border shadow-lg" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2">
          {/* Camera capture */}
          <button
            onClick={handleCameraClick}
            className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Camera size={20} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Camera</span>
          </button>
          
          {/* Upload from files */}
          <button
            onClick={handleUploadClick}
            className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Upload size={20} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Gallery</span>
          </button>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </PopoverContent>
    </Popover>
  );
};

export default ImageAddButton;
