import { useEffect, useState, useRef } from 'react';
import { usePausedItems } from './usePausedItems';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface PendingPauseItem {
  itemName: string;
  storeName: string;
  price: string;
  link?: string;
  imageUrl?: string;
  duration: string;
  createdAt: string;
}

export const usePendingPauseItem = () => {
  const [hasPendingItem, setHasPendingItem] = useState(false);
  const [pendingItem, setPendingItem] = useState<PendingPauseItem | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const { addItem } = usePausedItems();
  const { user } = useAuth();
  const { toast } = useToast();
  const hasProcessedRef = useRef(false);

  // Check for pending item on mount and add it to local store for guests
  useEffect(() => {
    const stored = localStorage.getItem('pendingPauseItem');
    if (!stored || hasProcessedRef.current) return;

    try {
      const item = JSON.parse(stored) as PendingPauseItem;
      setPendingItem(item);
      setHasPendingItem(true);

      // If user is not logged in, add to local store immediately and show signup prompt
      if (!user) {
        hasProcessedRef.current = true;
        
        // Add to local store so it appears in the UI
        addItem({
          itemName: item.itemName,
          storeName: item.storeName,
          price: item.price,
          notes: undefined,
          duration: item.duration,
          link: item.link,
          photo: null,
          imageUrl: item.imageUrl,
          tags: [],
          isCart: false,
          itemType: 'item',
          usePlaceholder: false,
        });

        // Clear the pending item from localStorage (it's now in the local store)
        localStorage.removeItem('pendingPauseItem');
        
        // Show signup prompt
        setShowSignupPrompt(true);
        
        toast({
          title: 'Item paused!',
          description: `"${item.itemName}" added. Sign up to save it permanently.`,
          duration: 4000,
        });
      }
    } catch {
      localStorage.removeItem('pendingPauseItem');
    }
  }, [user, addItem, toast]);

  // Process pending item when user becomes authenticated (for items added before login)
  useEffect(() => {
    const processPendingItem = async () => {
      if (!user || !pendingItem || hasProcessedRef.current) return;

      hasProcessedRef.current = true;

      try {
        await addItem({
          itemName: pendingItem.itemName,
          storeName: pendingItem.storeName,
          price: pendingItem.price,
          notes: undefined,
          duration: pendingItem.duration,
          link: pendingItem.link,
          photo: null,
          imageUrl: pendingItem.imageUrl,
          tags: [],
          isCart: false,
          itemType: 'item',
          usePlaceholder: false,
        });

        // Clear the pending item and hide prompt
        localStorage.removeItem('pendingPauseItem');
        setPendingItem(null);
        setHasPendingItem(false);
        setShowSignupPrompt(false);

        toast({
          title: 'Item paused!',
          description: `"${pendingItem.itemName}" has been added to your pause list`,
          duration: 4000,
        });
      } catch (error) {
        console.error('Failed to add pending item:', error);
        toast({
          title: 'Error',
          description: 'Failed to add your item. Please try again.',
          variant: 'destructive',
        });
      }
    };

    processPendingItem();
  }, [user, pendingItem, addItem, toast]);

  const clearPendingItem = () => {
    localStorage.removeItem('pendingPauseItem');
    setPendingItem(null);
    setHasPendingItem(false);
    setShowSignupPrompt(false);
  };

  const dismissSignupPrompt = () => {
    setShowSignupPrompt(false);
  };

  return {
    hasPendingItem,
    pendingItem,
    showSignupPrompt,
    clearPendingItem,
    dismissSignupPrompt,
  };
};
