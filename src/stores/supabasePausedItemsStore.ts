
import { PausedItem, Listener } from './supabase/types';
import { PausedItemsOperations } from './supabase/pausedItemsOperations';
import { PausedItemsUtils } from './supabase/pausedItemsUtils';

class SupabasePausedItemsStore {
  private items: PausedItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    // Load items when store is created
    this.loadItems();
  }

  async loadItems(): Promise<void> {
    try {
      const items = await PausedItemsOperations.loadItems();
      this.items = items;
      PausedItemsUtils.updateCheckInTimes(this.items);
      this.isLoaded = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error in loadItems:', error);
    }
  }

  async addItem(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>): Promise<void> {
    const newItem = await PausedItemsOperations.addItem(item);
    if (newItem) {
      this.items.unshift(newItem);
      PausedItemsUtils.updateCheckInTimes(this.items);
      this.notifyListeners();
    }
  }

  getItems(): PausedItem[] {
    PausedItemsUtils.updateCheckInTimes(this.items);
    return [...this.items];
  }

  getItemsForReview(): PausedItem[] {
    return PausedItemsUtils.getItemsForReview(this.items);
  }

  async removeItem(id: string): Promise<void> {
    const success = await PausedItemsOperations.removeItem(id);
    if (success) {
      this.items = this.items.filter(item => item.id !== id);
      this.notifyListeners();
    }
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

export const supabasePausedItemsStore = new SupabasePausedItemsStore();
export type { PausedItem };
