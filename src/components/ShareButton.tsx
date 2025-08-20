import { Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ShareButtonProps {
  url?: string;
  text?: string;
  itemName?: string;
  price?: string;
  storeName?: string;
}

const ShareButton = ({ url, text, itemName, price, storeName }: ShareButtonProps) => {
  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Pause this item',
        text: text || (itemName && price 
          ? `Should I buy this ${itemName} for ${price}${storeName ? ` from ${storeName}` : ''}? Help me decide!`
          : 'I want to pause this purchase decision'),
        url: url || ''
      };

      // Use web share API if available
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied to clipboard",
          description: "Share it with friends!",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Can't share right now",
        description: "Try copying the URL manually",
        variant: "destructive"
      });
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 transition-colors border border-white/20"
      title="Share this item"
    >
      <Share2 size={18} className="text-gray-600" />
    </button>
  );
};

export default ShareButton;