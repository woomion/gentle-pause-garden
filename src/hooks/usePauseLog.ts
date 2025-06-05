
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

  return {
    items,
    loading,
    addItem,
    deleteItem
  };
};
