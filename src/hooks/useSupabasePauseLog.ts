
import { useState, useEffect } from 'react';
import { supabasePauseLogStore, PauseLogItem } from '../stores/supabasePauseLogStore';
import { useAuth } from '../contexts/AuthContext';

export const useSupabasePauseLog = () => {
  const [items, setItems] = useState<PauseLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const updateItems = () => {
      const allItems = supabasePauseLogStore.getItems();
      setItems(allItems);
      
      if (supabasePauseLogStore.isDataLoaded()) {
        setLoading(false);
      }
    };

    updateItems();
    const unsubscribe = supabasePauseLogStore.subscribe(updateItems);

    return unsubscribe;
  }, [user]);

  const addItem = async (item: Omit<PauseLogItem, 'id' | 'letGoDate'>) => {
    await supabasePauseLogStore.addItem(item);
  };

  const deleteItem = async (id: string) => {
    await supabasePauseLogStore.deleteItem(id);
  };

  return {
    items,
    loading,
    addItem,
    deleteItem
  };
};
