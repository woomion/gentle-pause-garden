
export interface PauseLogItem {
  id: string;
  itemName: string;
  storeName: string;
  emotion: string;
  letGoDate: string;
  originalPausedItem?: any; // Reference to original paused item if needed
}

class PauseLogStore {
  private items: PauseLogItem[] = [];
  private listeners: Array<() => void> = [];
  private storageKey = 'pauseLog';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pause log from storage:', error);
      this.items = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save pause log to storage:', error);
    }
  }

  addItem(item: Omit<PauseLogItem, 'id' | 'letGoDate'>) {
    const newItem: PauseLogItem = {
      ...item,
      id: Date.now().toString(),
      letGoDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    
    this.items.push(newItem);
    this.saveToStorage();
    this.notifyListeners();
    console.log('Added pause log item:', newItem);
  }

  getItems(): PauseLogItem[] {
    return [...this.items];
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const pauseLogStore = new PauseLogStore();
