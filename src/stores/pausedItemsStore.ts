
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
  photoDataUrl?: string;
  pausedAt: Date;
  checkInTime: string;
}

type Listener = () => void;

class PausedItemsStore {
  private items: PausedItem[] = [];
  private listeners: Set<Listener> = new Set();
  private readonly storageKey = 'pausedItems';

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
          pausedAt: new Date(item.pausedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load paused items from storage:', error);
      this.items = [];
    }
  }

  private saveToStorage(): void {
    try {
      const itemsToStore = this.items.map(item => ({
        ...item,
        photo: null // Remove File objects as they can't be serialized
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(itemsToStore));
    } catch (error) {
      console.error('Failed to save paused items to storage:', error);
    }
  }

  private convertFileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private calculateCheckInTime(duration: string): string {
    const now = new Date();
    const checkInDate = new Date(now);

    const durationMap: Record<string, () => void> = {
      '24 hours': () => checkInDate.setHours(now.getHours() + 24),
      '3 days': () => checkInDate.setDate(now.getDate() + 3),
      '1 week': () => checkInDate.setDate(now.getDate() + 7),
      '2 weeks': () => checkInDate.setDate(now.getDate() + 14),
      '1 month': () => checkInDate.setMonth(now.getMonth() + 1),
      '3 months': () => checkInDate.setMonth(now.getMonth() + 3)
    };

    const adjustTime = durationMap[duration.toLowerCase()];
    if (adjustTime) {
      adjustTime();
    } else {
      checkInDate.setHours(now.getHours() + 24);
    }

    const diffMs = checkInDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours <= 0) return 'Checking-in now';
    if (diffHours === 1) return 'Checking-in in about 1 hour';
    if (diffHours <= 24) return `Checking-in in about ${diffHours} hours`;
    if (diffDays === 1) return 'Checking-in in about 1 day';
    
    return `Checking-in in about ${diffDays} days`;
  }

  async addItem(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime'>): Promise<void> {
    let photoDataUrl: string | undefined;
    
    if (item.photo instanceof File) {
      try {
        photoDataUrl = await this.convertFileToDataUrl(item.photo);
      } catch (error) {
        console.error('Failed to convert image to base64:', error);
      }
    }

    const newItem: PausedItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pausedAt: new Date(),
      checkInTime: this.calculateCheckInTime(item.duration || item.otherDuration || '24 hours'),
      photoDataUrl
    };
    
    this.items.push(newItem);
    this.saveToStorage();
    this.notifyListeners();
  }

  getItems(): PausedItem[] {
    return [...this.items];
  }

  removeItem(id: string): void {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    
    if (this.items.length !== initialLength) {
      this.saveToStorage();
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
}

export const pausedItemsStore = new PausedItemsStore();
