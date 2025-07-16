
export interface PauseLogItem {
  id: string;
  itemName: string;
  storeName: string;
  emotion: string;
  letGoDate: string;
  status: 'purchased' | 'let-go';
  notes?: string;
  tags?: string[];
  originalPausedItem?: any;
}

type Listener = () => void;

class PauseLogStore {
  private items: PauseLogItem[] = [];
  private listeners: Set<Listener> = new Set();
  private readonly storageKey = 'pauseLog';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedItems = JSON.parse(stored);
        this.items = parsedItems.map((item: any) => ({
          ...item,
          status: item.status || 'let-go',
          notes: item.notes || undefined
        }));
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Failed to load pause log from storage:', error);
      this.items = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save pause log to storage:', error);
    }
  }

  addItem(item: Omit<PauseLogItem, 'id' | 'letGoDate'>): void {
    const newItem: PauseLogItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      letGoDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
      })
    };
    
    this.items.push(newItem);
    this.saveToStorage();
    this.notifyListeners();
  }

  deleteItem(id: string): void {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    
    if (this.items.length !== initialLength) {
      this.saveToStorage();
      this.notifyListeners();
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
}

export const pauseLogStore = new PauseLogStore();
