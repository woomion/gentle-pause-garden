
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

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

type DbPauseLogItem = Database['public']['Tables']['paused_items']['Row'];
type DbPauseLogItemInsert = Database['public']['Tables']['paused_items']['Insert'];

type Listener = () => void;

class SupabasePauseLogStore {
  private items: PauseLogItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadItems();
  }

  private convertDbToLocal(dbItem: DbPauseLogItem): PauseLogItem {
    return {
      id: dbItem.id,
      itemName: dbItem.title,
      storeName: 'Unknown Store', // We should add store_name column to DB
      emotion: dbItem.reason || 'something else',
      letGoDate: new Date(dbItem.updated_at || dbItem.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      status: dbItem.status === 'purchased' ? 'purchased' : 'let-go',
      notes: dbItem.notes || undefined
    };
  }

  async loadItems(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('paused_items')
        .select('*')
        .in('status', ['purchased', 'let-go'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading pause log items:', error);
        return;
      }

      this.items = data?.map(item => this.convertDbToLocal(item)) || [];
      this.isLoaded = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error in loadItems:', error);
    }
  }

  async addItem(item: Omit<PauseLogItem, 'id' | 'letGoDate'>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('paused_items')
        .insert({
          user_id: user.id,
          title: item.itemName,
          reason: item.emotion,
          notes: item.notes || null,
          status: item.status,
          price: null,
          url: null,
          pause_duration_days: 1,
          review_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding pause log item to database:', error);
        return;
      }

      const newItem = this.convertDbToLocal(data);
      this.items.unshift(newItem);
      this.notifyListeners();
    } catch (error) {
      console.error('Error in addItem:', error);
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
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
