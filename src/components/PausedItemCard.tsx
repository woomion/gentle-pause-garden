import { ShoppingCart, MessageCircle } from 'lucide-react';
import { memo, useMemo, useEffect, useState } from 'react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { formatPrice } from '../utils/priceFormatter';
import EmotionBadge from './EmotionBadge';
import { getEmotionColor } from '../utils/emotionColors';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useItemComments } from '@/hooks/useItemComments';

interface Partner {
  partner_id: string;
  partner_email: string;
  partner_name: string;
}

interface PausedItemCardProps {
  item: PausedItem;
  onClick: () => void;
  partners?: Partner[];
  currentUserId?: string;
}

const PausedItemCard = memo(({ item, onClick, partners = [], currentUserId }: PausedItemCardProps) => {
  const emotionColor = useMemo(() => getEmotionColor(item.emotion), [item.emotion]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { hasNewComments, getUnreadCount } = useItemComments(currentUserId || null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Calculate days left and progress
  const pauseProgress = useMemo(() => {
    if (!item.checkInTime) return { daysLeft: 0, progress: 0, nextNudgeText: '', checkInDate: '' };
    
    try {
      const now = new Date();
      const checkInDate = new Date(item.checkInTime);
      
      // Check if the date is valid
      if (isNaN(checkInDate.getTime())) {
        return { daysLeft: 0, progress: 0, nextNudgeText: '', checkInDate: '' };
      }
      
      const diffTime = checkInDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      // Calculate progress based on total pause duration (assuming 7 days for now)
      const totalDays = 7; // This should come from your pause duration logic
      const progress = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));
      
      // Format check-in date
      const formattedDate = checkInDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      
      // Format next nudge text
      const nextNudgeDate = new Date(checkInDate);
      nextNudgeDate.setDate(nextNudgeDate.getDate() - 1); // Day before check-in
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekday = weekdays[nextNudgeDate.getDay()];
      const time = '9:00 AM'; // Default time, should come from user settings
      
      return {
        daysLeft,
        progress,
        checkInDate: formattedDate,
        nextNudgeText: `${weekday} ${time}`
      };
    } catch (error) {
      console.error('Error calculating pause progress:', error);
      return { daysLeft: 0, progress: 0, nextNudgeText: '', checkInDate: '' };
    }
  }, [item.checkInTime]);

  // Get initials for shared partners
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get partner info for the badges
  const sharedWithPartners = useMemo(() => {
    if (!item.sharedWithPartners || item.sharedWithPartners.length === 0) return [];
    
    return partners.filter(partner => 
      item.sharedWithPartners.includes(partner.partner_id)
    );
  }, [item.sharedWithPartners, partners]);

  // Get sharing attribution text
  const getAttributionText = useMemo(() => {
    const userId = currentUser || currentUserId;
    if (!userId) return null;

    const itemOwnerId = item.originalUserId;
    if (!itemOwnerId) return null;

    const isSharedByCurrentUser = itemOwnerId === userId;
    
    if (isSharedByCurrentUser) {
      if (sharedWithPartners.length > 0) {
        if (sharedWithPartners.length === 1) {
          return { from: 'You', to: sharedWithPartners[0].partner_name, direction: 'shared-with' };
        } else {
          return { from: 'You', to: `${sharedWithPartners.length} partners`, direction: 'shared-with' };
        }
      } else if (item.sharedWithPartners && item.sharedWithPartners.length > 0) {
        return { from: 'You', to: `${item.sharedWithPartners.length} partner${item.sharedWithPartners.length > 1 ? 's' : ''}`, direction: 'shared-with' };
      }
    } else {
      const sharer = partners.find(p => p.partner_id === itemOwnerId);
      if (sharer) {
        return { from: sharer.partner_name, to: 'You', direction: 'shared-by' };
      } else {
        return { from: 'Partner', to: 'You', direction: 'shared-by' };
      }
    }
    
    return null;
  }, [currentUser, currentUserId, item.originalUserId, sharedWithPartners, partners]);

  const imageUrl = useMemo(() => {
    if (item.isCart && item.imageUrl === 'cart-placeholder') {
      return 'cart-placeholder';
    }

    if (item.imageUrl && item.imageUrl !== 'cart-placeholder') {
      if (item.imageUrl.includes('supabase.co/storage') || item.imageUrl.includes('supabase')) {
        return item.imageUrl;
      }
      try {
        new URL(item.imageUrl);
        return item.imageUrl;
      } catch {
        // Invalid URL format - continue to next option
      }
    }
    
    if (item.photoDataUrl) {
      return item.photoDataUrl;
    }
    
    if (item.photo instanceof File) {
      return URL.createObjectURL(item.photo);
    }
    
    return null;
  }, [item.imageUrl, item.photoDataUrl, item.photo, item.id, item.isCart]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.parentElement) {
      target.parentElement.innerHTML = '<div class="w-8 h-8 bg-muted rounded-full opacity-50" aria-hidden="true"></div>';
    }
  };

  const formattedPrice = useMemo(() => {
    if (!item.price) return '';
    
    const price = parseFloat(item.price);
    if (isNaN(price)) return '';
    
    return `$${price.toFixed(2)}`;
  }, [item.price]);

  return (
    <div 
      className="relative overflow-hidden bg-background rounded-lg border border-[#EDEBE8] cursor-pointer hover:bg-muted/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 animate-fade-in"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${item.itemName}`}
      style={{
        animationDelay: '0.1s',
        animationFillMode: 'both'
      }}
    >
      {/* New message indicator */}
      {item.sharedWithPartners && item.sharedWithPartners.length > 0 && hasNewComments(item.id) && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full shadow-sm">
            <MessageCircle size={10} />
            <span className="font-medium">{getUnreadCount(item.id)}</span>
          </div>
        </div>
      )}
      
      {/* Main content with specified padding - increased height */}
      <div className="px-4 py-4">
        {/* Horizontal flex layout */}
        <div className="flex items-center gap-4">
          {/* LEFT: 56x72px rectangular thumbnail (taller) */}
          <div className="w-14 h-18 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageUrl === 'cart-placeholder' ? (
              <div className="w-full h-full bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ShoppingCart size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt={item.itemName}
                className="w-full h-full object-cover rounded-lg"
                onError={handleImageError}
                loading="lazy"
              />
             ) : (
               <img 
                 src="/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png" 
                 alt="Placeholder" 
                 className="w-full h-full object-cover rounded-lg"
               />
             )}
          </div>
          
          {/* CENTER: Vertical stack */}
          <div className="flex-1 min-w-0">
            {/* Product name - 16px/600 */}
            <h3 className="text-base font-semibold text-[#1D1D1D] dark:text-foreground truncate mb-1">
              {item.itemName}
            </h3>
            
            {/* Brand - 14px/400 */}
            <p className="text-sm font-normal text-[#6F6F6F] dark:text-muted-foreground mb-2">
              {item.storeName}
            </p>
            
            {/* Inline emotion badge */}
            <div className="flex items-center gap-2">
              <EmotionBadge emotion={item.emotion} size="sm" />
              
              {/* Sharing attribution or partner badges */}
              {getAttributionText && (
                <Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs border-green-200 dark:border-green-800">
                  {getAttributionText.from} → {getAttributionText.to}
                </Badge>
              )}
              
              {!getAttributionText && sharedWithPartners.length > 0 && (
                <div className="flex gap-1">
                  {sharedWithPartners.slice(0, 3).map((partner) => (
                    <Avatar key={partner.partner_id} className="h-5 w-5 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <AvatarFallback className="text-xs text-green-800 dark:text-green-400">
                        {getInitials(partner.partner_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {sharedWithPartners.length > 3 && (
                    <div className="h-5 w-5 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">+{sharedWithPartners.length - 3}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Price - not in pill, smaller and not bold */}
        {formattedPrice && (
          <div className="mt-2 px-4">
            <span className="text-sm font-normal text-muted-foreground">
              {formattedPrice}
            </span>
          </div>
        )}
      </div>
      
      {/* 1px divider */}
      <div className="border-t border-[#F2F1EF] dark:border-border"></div>
      
      {/* Progress bar - 2px lavender, positioned above caption */}
      <div className="relative">
        <Progress 
          value={pauseProgress.progress} 
          className="h-0.5 rounded-none bg-[#F2F1EF] dark:bg-muted"
          style={{
            '--progress-bg': '#D7C7FF',
          } as any}
        />
        
        {/* Caption - 12px #6F6F6F */}
        <div className="px-4 py-2">
          {pauseProgress.checkInDate ? (
            <p className="text-xs text-[#6F6F6F] dark:text-muted-foreground">
              {pauseProgress.daysLeft} d left ({pauseProgress.checkInDate}) · next nudge {pauseProgress.nextNudgeText}
            </p>
          ) : (
            <p className="text-xs text-[#6F6F6F] dark:text-muted-foreground">
              Pause details unavailable
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

PausedItemCard.displayName = 'PausedItemCard';

export default PausedItemCard;