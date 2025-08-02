import { Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
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

      await Share.share(shareData);
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Fallback to web share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Pause this item',
            text: text || (itemName && price 
              ? `Should I buy this ${itemName} for ${price}${storeName ? ` from ${storeName}` : ''}? Help me decide!`
              : 'I want to pause this purchase decision'),
            url: url || ''
          });
        } catch (webShareError) {
          console.error('Web share also failed:', webShareError);
          toast({
            title: "Can't share right now",
            description: "Try copying the URL manually",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Can't share right now",
          description: "Try copying the URL manually",
          variant: "destructive"
        });
      }
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