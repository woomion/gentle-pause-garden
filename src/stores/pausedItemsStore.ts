
export interface PausedItem {
  id: string;
  itemName: string;
  storeName: string;
  price: string;
  imageUrl?: string;
  emotion: string;
  notes?: string;
  duration: string;
  otherDuration?: string;
  link?: string;
  photo?: File | null;
  pausedAt: Date;
  checkInTime: string;
}

class PausedItemsStore {
  private items: PausedItem[] = [];
  private listeners: Array<() => void> = [];
  private storageKey = 'pausedItems';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedItems = JSON.parse(stored);
        // Convert pausedAt back to Date objects
        this.items = parsedItems.map((item: any) => ({
          ...item,
          pausedAt: new Date(item.pausedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load paused items from storage:', error);
      this.items = [];
    }
  }

  private saveToStorage() {
    try {
      // Note: We can't store File objects in localStorage, so photo will be lost on refresh
      // For a production app, you'd want to upload the file to a server or use IndexedDB
      const itemsToStore = this.items.map(item => ({
        ...item,
        photo: null // Remove File objects as they can't be serialized
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(itemsToStore));
    } catch (error) {
      console.error('Failed to save paused items to storage:', error);
    }
  }

  addItem(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime'>) {
    const newItem: PausedItem = {
      ...item,
      id: Date.now().toString(),
      pausedAt: new Date(),
      checkInTime: this.calculateCheckInTime(item.duration || item.otherDuration || '24 hours')
    };
    
    this.items.push(newItem);
    this.saveToStorage();
    this.notifyListeners();
    console.log('Added paused item:', newItem);
  }

  getItems(): PausedItem[] {
    return [...this.items];
  }

  removeItem(id: string) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveToStorage();
    this.notifyListeners();
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

  private calculateCheckInTime(duration: string): string {
    const now = new Date();
    let checkInDate = new Date(now);

    switch (duration.toLowerCase()) {
      case '24 hours':
        checkInDate.setHours(now.getHours() + 24);
        break;
      case '3 days':
        checkInDate.setDate(now.getDate() + 3);
        break;
      case '1 week':
        checkInDate.setDate(now.getDate() + 7);
        break;
      case '2 weeks':
        checkInDate.setDate(now.getDate() + 14);
        break;
      case '1 month':
        checkInDate.setMonth(now.getMonth() + 1);
        break;
      case '3 months':
        checkInDate.setMonth(now.getMonth() + 3);
        break;
      default:
        checkInDate.setHours(now.getHours() + 24);
    }

    const diffMs = checkInDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `Checking-in in about ${diffHours} hours`;
    } else if (diffDays === 1) {
      return 'Checking-in in about 1 day';
    } else {
      return `Checking-in in about ${diffDays} days`;
    }
  }
}

export const pausedItemsStore = new PausedItemsStore();
