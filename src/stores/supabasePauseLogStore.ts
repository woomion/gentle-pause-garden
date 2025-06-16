
import { supabase } from '@/integrations/supabase/client';
import { convertDbToPauseLogItem, convertPauseLogItemToDb } from '@/utils/pauseLogConverters';

export interface PauseLogItem {
  id: string;
  itemName: string;
  storeName: string;
  emotion: string;
  letGoDate: string;
  status: 'purchased' | 'let-go';
  notes?: string;
  originalPausedItem?: any;
}

type Listener = () => void;

class SupabasePauseLogStore {
  private items: PauseLogItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadItems();
  }

  async loadItems(): Promise<void> {
    try {
      console.log('Loading pause log items from Supabase...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping pause log load');
        this.items = [];
        this.isLoaded = true;
        this.notifyListeners();
        return;
      }

      // Load both 'purchased' and 'let-go' items
      const { data, error } = await supabase
        .from('paused_items')
        .select('*')
        .in('status', ['purchased', 'let-go'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pause log items:', error);
        return;
      }

      console.log('Raw pause log data from Supabase:', data);
      console.log('Number of items loaded:', data?.length || 0);
      
      // Log the status of each item
      data?.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.title} - Status: ${item.status}`);
      });
      
      this.items = data?.map(item => convertDbToPauseLogItem(item)) || [];
      
      console.log('Converted pause log items:', this.items);
      console.log('Items by status:', {
        purchased: this.items.filter(item => item.status === 'purchased').length,
        letGo: this.items.filter(item => item.status === 'let-go').length
      });
      
      this.isLoaded = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error in loadItems:', error);
    }
  }

  async addItem(item: Omit<PauseLogItem, 'id' | 'letGoDate'>): Promise<void> {
    try {
      console.log('Adding item to pause log with status:', item.status);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const convertedItem = convertPauseLogItemToDb(item);

      const insertData = {
        user_id: user.id,
        ...convertedItem,
        price: null,
        url: null,
        pause_duration_days: 1,
        review_at: new Date().toISOString()
      };

      console.log('Insert data being sent to database:', insertData);

      const { data, error } = await supabase
        .from('paused_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error adding pause log item to database:', error);
        throw error;
      }

      console.log('Successfully added pause log item to database:', data);

      const newItem = convertDbToPauseLogItem(data);
      console.log('Converted new item for local state:', newItem);
      
      this.items.unshift(newItem);
      this.notifyListeners();
    } catch (error) {
      console.error('Error in addItem:', error);
      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      console.log('Deleting pause log item:', id);
      
      const { error } = await supabase
        .from('paused_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting pause log item:', error);
        return;
      }

      this.items = this.items.filter(item => item.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error('Error in deleteItem:', error);
    }
  }

  getItems(): PauseLogItem[] {
    return [...this.items];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    });
  }

  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

export const supabasePauseLogStore = new SupabasePauseLogStore();
