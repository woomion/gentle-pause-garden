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
    console.log('Converting DB item to local for pause log:', dbItem);
    
    // Use the store name from notes if it was stored there, otherwise try to extract from URL
    let storeName = 'Unknown Store';
    
    // Check if store name was stored in notes (new format)
    if (dbItem.notes && dbItem.notes.includes('STORE:')) {
      const storeMatch = dbItem.notes.match(/STORE:([^|]*)/);
      if (storeMatch) {
        storeName = storeMatch[1].trim();
      }
    } else if (dbItem.url) {
      // Fallback to extracting from URL (old format)
      storeName = this.extractStoreName(dbItem.url);
    }
    
    // Extract actual notes (remove store name if it was stored there)
    let actualNotes = dbItem.notes;
    if (actualNotes && actualNotes.includes('STORE:')) {
      actualNotes = actualNotes.replace(/STORE:[^|]*\|?/, '').trim();
      if (actualNotes === '') {
        actualNotes = undefined;
      }
    }
    
    // Ensure status mapping is correct
    let status: 'purchased' | 'let-go' = 'let-go';
    if (dbItem.status === 'purchased') {
      status = 'purchased';
    } else if (dbItem.status === 'let-go') {
      status = 'let-go';
    }
    
    console.log('Status conversion:', { dbStatus: dbItem.status, localStatus: status });
    console.log('Store name conversion:', { 
      originalNotes: dbItem.notes, 
      extractedStoreName: storeName,
      actualNotes: actualNotes 
    });
    
    return {
      id: dbItem.id,
      itemName: dbItem.title,
      storeName: storeName,
      emotion: dbItem.reason || 'something else',
      letGoDate: new Date(dbItem.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      status: status,
      notes: actualNotes
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
      
      this.items = data?.map(item => this.convertDbToLocal(item)) || [];
      
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

      // Ensure the status is exactly what we expect and matches database values
      const dbStatus = item.status === 'purchased' ? 'purchased' : 'let-go';
      console.log('DB status being saved:', dbStatus);

      // Store the store name in the notes field with a special format so we can retrieve it later
      let notesWithStore = '';
      if (item.storeName && item.storeName !== 'Unknown Store') {
        notesWithStore = `STORE:${item.storeName}`;
        if (item.notes && item.notes.trim()) {
          notesWithStore += `|${item.notes}`;
        }
      } else if (item.notes && item.notes.trim()) {
        notesWithStore = item.notes;
      }

      const insertData = {
        user_id: user.id,
        title: item.itemName,
        reason: item.emotion,
        notes: notesWithStore || null,
        status: dbStatus,
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

      const newItem = this.convertDbToLocal(data);
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
