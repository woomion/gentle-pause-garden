
import { useState, useEffect } from 'react';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { offlineQueueStore } from '../stores/offlineQueueStore';
import { useAuth } from '../contexts/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';

export const usePausedItems = () => {
  const [items, setItems] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!user) {
      // Guest mode - use local storage only
      const updateItems = () => {
        const allItems = pausedItemsStore.getItems();
        setItems(allItems);
        setLoading(false);
      };

      updateItems();
      const unsubscribe = pausedItemsStore.subscribe(updateItems);
      return unsubscribe;
    }

    // Authenticated mode - hybrid approach
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

  const addItem = async (item: Omit<PausedItem | LocalPausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>) => {
    if (!user) {
      // Guest mode - local only
      await pausedItemsStore.addItem(item);
      return;
    }

    // Authenticated mode - offline-first approach
    if (isOnline) {
      try {
        // Try to add directly to Supabase
        await supabasePausedItemsStore.addItem(item);
        console.log('✅ Item added directly to Supabase');
      } catch (error) {
        console.error('❌ Failed to add item to Supabase, queuing for offline sync:', error);
        // Add to offline queue if direct add fails
        offlineQueueStore.addOperation('ADD_ITEM', item);
        // Also add to local store for immediate UI feedback
        await pausedItemsStore.addItem(item);
      }
    } else {
      // Offline - add to queue and local store
      console.log('📵 Offline: Adding item to queue and local store');
      offlineQueueStore.addOperation('ADD_ITEM', item);
      await pausedItemsStore.addItem(item);
    }
  };

  const removeItem = async (id: string) => {
    if (!user) {
      // Guest mode - local only
      pausedItemsStore.removeItem(id);
      return;
    }

    // Authenticated mode - offline-first approach
    if (isOnline) {
      try {
        // Try to remove directly from Supabase
        await supabasePausedItemsStore.removeItem(id);
        console.log('✅ Item removed directly from Supabase');
      } catch (error) {
        console.error('❌ Failed to remove item from Supabase, queuing for offline sync:', error);
        // Add to offline queue if direct removal fails
        offlineQueueStore.addOperation('REMOVE_ITEM', { id });
        // Also remove from local store for immediate UI feedback
        pausedItemsStore.removeItem(id);
      }
    } else {
      // Offline - add to queue and remove from local store
      console.log('📵 Offline: Queuing item removal');
      offlineQueueStore.addOperation('REMOVE_ITEM', { id });
      pausedItemsStore.removeItem(id);
    }
  };

  const extendPause = async (itemId: string, newDuration: string) => {
    if (!user) {
      // Guest mode - local only
      pausedItemsStore.extendPause(itemId, newDuration);
      return;
    }

    // Authenticated mode - offline-first approach
    if (isOnline) {
      try {
        // Try to extend directly in Supabase
        await supabasePausedItemsStore.extendPause(itemId, newDuration);
        console.log('✅ Pause extended directly in Supabase');
      } catch (error) {
        console.error('❌ Failed to extend pause in Supabase, queuing for offline sync:', error);
        // Add to offline queue if direct extend fails
        offlineQueueStore.addOperation('EXTEND_PAUSE', { id: itemId, duration: newDuration });
        // Also extend in local store for immediate UI feedback
        pausedItemsStore.extendPause(itemId, newDuration);
      }
    } else {
      // Offline - add to queue and extend in local store
      console.log('📵 Offline: Queuing pause extension');
      offlineQueueStore.addOperation('EXTEND_PAUSE', { id: itemId, duration: newDuration });
      pausedItemsStore.extendPause(itemId, newDuration);
    }
  };

  const updateItem = async (itemId: string, updates: Partial<PausedItem | LocalPausedItem>) => {
    // For now, we'll implement update as remove + add since the stores don't have update methods
    const currentItems = user ? supabasePausedItemsStore.getItems() : pausedItemsStore.getItems();
    const itemToUpdate = currentItems.find(item => item.id === itemId);
    
    if (itemToUpdate) {
      const updatedItem = { ...itemToUpdate, ...updates };
      await removeItem(itemId);
      await addItem(updatedItem);
    }
  };

  const getItemsForReview = () => {
    if (!user) {
      return pausedItemsStore.getItemsForReview();
    }
    return supabasePausedItemsStore.getItemsForReview();
  };

  return {
    items,
    loading,
    addItem,
    removeItem,
    updateItem,
    extendPause,
    getItemsForReview
  };
};
