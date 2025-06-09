import { useState, useEffect } from 'react';
import { pauseLogStore, PauseLogItem } from '../stores/pauseLogStore';

export const usePauseLog = () => {
  const [items, setItems] = useState<PauseLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateItems = () => {
      const allItems = pauseLogStore.getItems();
      setItems(allItems);
      setLoading(false);
    };

    updateItems();
    const unsubscribe = pauseLogStore.subscribe(updateItems);

    return unsubscribe;
  }, []);

  const addItem = (item: Omit<PauseLogItem, 'id' | 'letGoDate'>) => {
    pauseLogStore.addItem(item);
  };

  const deleteItem = (id: string) => {
    pauseLogStore.deleteItem(id);
  };

  const loadItems = async () => {
    // For local storage, we don't need to do anything async
    // but we keep the same interface as useSupabasePauseLog
    const allItems = pauseLogStore.getItems();
    setItems(allItems);
  };

  return {
    items,
    loading,
    addItem,
    deleteItem,
    loadItems
  };
};
