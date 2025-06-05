
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

type DbPausedItem = Database['public']['Tables']['paused_items']['Row'];
type DbPausedItemInsert = Database['public']['Tables']['paused_items']['Insert'];

type Listener = () => void;

class SupabasePauseLogStore {
  private items: PauseLogItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadItems();
  }

  private convertDbToLocal(dbItem: DbPausedItem): PauseLogItem {
    console.log('Converting DB item to local:', dbItem);
    
    // Extract store name from URL or use emotion as fallback
    const storeName = this.extractStoreName(dbItem.url || '') || dbItem.reason || 'Unknown Store';
    
    return {
      id: dbItem.id,
      itemName: dbItem.title,
      storeName: storeName,
      emotion: dbItem.reason || 'something else',
      letGoDate: new Date(dbItem.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      status: dbItem.status === 'purchased' ? 'purchased' : 'let-go',
      notes: dbItem.notes || undefined
    };
  }

  private extractStoreName(url: string): string {
    if (!url) return '';
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return '';
    }
  }

  async loadItems(): Promise<void> {
    try {
      console.log('Loading pause log items from Supabase...');
      
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
      
      this.items = data?.map(item => this.convertDbToLocal(item)) || [];
      
      console.log('Converted pause log items:', this.items);
      
      this.isLoaded = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error in loadItems:', error);
    }
  }

  async addItem(item: Omit<PauseLogItem, 'id' | 'letGoDate'>): Promise<void> {
    try {
      console.log('Adding item to pause log:', item);
      
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

      console.log('Successfully added pause log item to database:', data);

      const newItem = this.convertDbToLocal(data);
      this.items.unshift(newItem);
      this.notifyListeners();
    } catch (error) {
      console.error('Error in addItem:', error);
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
