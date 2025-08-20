import { useState } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ClipboardButtonProps {
  onUrlPasted: (url: string) => void;
}

const ClipboardButton = ({ onUrlPasted }: ClipboardButtonProps) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleReadClipboard = async () => {
    try {
      // Use web clipboard API
      const value = await navigator.clipboard.readText();
      
      if (value && value.trim()) {
        // Check if it looks like a URL
        const urlPattern = /https?:\/\//i;
        if (urlPattern.test(value.trim())) {
          onUrlPasted(value.trim());
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
          toast({
            title: "URL pasted from clipboard!",
            description: "We'll try to extract the product details",
          });
        } else {
          toast({
            title: "No URL found",
            description: "Please copy a product URL to your clipboard first",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Clipboard is empty",
          description: "Please copy a product URL to your clipboard first",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      toast({
        title: "Can't access clipboard",
        description: "Please paste the URL manually",
        variant: "destructive"
      });
    }
  };

  return (
    <button
      onClick={handleReadClipboard}
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 transition-colors border border-white/20"
      title="Paste from clipboard"
    >
      {showSuccess ? (
        <Check size={18} className="text-green-600" />
      ) : (
        <Clipboard size={18} className="text-gray-600" />
      )}
    </button>
  );
};

export default ClipboardButton;