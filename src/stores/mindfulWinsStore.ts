
export interface MindfulWinItem {
  id: string;
  itemName: string;
  storeName: string;
  emotion: string;
  letGoDate: string;
  originalPausedItem?: any; // Reference to original paused item if needed
}

class MindfulWinsStore {
  private items: MindfulWinItem[] = [];
  private listeners: Array<() => void> = [];
  private storageKey = 'mindfulWins';

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
      console.error('Failed to load mindful wins from storage:', error);
      this.items = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save mindful wins to storage:', error);
    }
  }

  addMindfulWin(item: Omit<MindfulWinItem, 'id' | 'letGoDate'>) {
    const newItem: MindfulWinItem = {
      ...item,
      id: Date.now().toString(),
      letGoDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    
    this.items.push(newItem);
    this.saveToStorage();
    this.notifyListeners();
    console.log('Added mindful win:', newItem);
  }

  getItems(): MindfulWinItem[] {
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

export const mindfulWinsStore = new MindfulWinsStore();
