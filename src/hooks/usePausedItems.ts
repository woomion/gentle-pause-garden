
import { useState, useEffect } from 'react';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { useAuth } from '../contexts/AuthContext';

export const usePausedItems = () => {
  const [items, setItems] = useState<PausedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const updateItems = () => {
      const allItems = supabasePausedItemsStore.getItems();
      setItems(allItems);
      
      if (supabasePausedItemsStore.isDataLoaded()) {
        setLoading(false);
      }
    };

    updateItems();
    const unsubscribe = supabasePausedItemsStore.subscribe(updateItems);

    return unsubscribe;
  }, [user]);

  const addItem = async (item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>) => {
    await supabasePausedItemsStore.addItem(item);
  };

  const removeItem = async (id: string) => {
    await supabasePausedItemsStore.removeItem(id);
  };

  const getItemsForReview = () => {
    return supabasePausedItemsStore.getItemsForReview();
  };

  return {
    items,
    loading,
    addItem,
    removeItem,
    getItemsForReview
  };
};
