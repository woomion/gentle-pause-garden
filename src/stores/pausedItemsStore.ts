
export interface PausedItem {
  id: string;
  itemName: string;
  storeName: string;
  price: string;
  imageUrl?: string;
  notes?: string;
  duration: string;
  otherDuration?: string;
  link?: string;
  photo?: File | null;
  photoDataUrl?: string;
  tags?: string[];
  pausedAt: Date;
  checkInTime: string;
  checkInDate: Date;
  isCart?: boolean;
  itemType?: 'item' | 'cart';
  usePlaceholder?: boolean;
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
      console.log('🔍 Loading from localStorage:', stored ? 'Found data' : 'No data found');
      if (stored) {
        const parsedItems = JSON.parse(stored);
        console.log('🔍 Parsed items from localStorage:', parsedItems);
        this.items = parsedItems.map((item: any) => ({
          ...item,
          pausedAt: new Date(item.pausedAt),
          checkInDate: new Date(item.checkInDate || item.pausedAt)
        }));
        this.updateCheckInTimes();
        console.log('🔍 Final loaded items:', this.items);
      } else {
        console.log('🔍 No items in localStorage, starting with empty list');
        this.items = [];
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

  private calculateCheckInDate(duration: string, pausedAt: Date): Date {
    const checkInDate = new Date(pausedAt);

    const durationMap: Record<string, () => void> = {
      '24 hours': () => checkInDate.setHours(pausedAt.getHours() + 24),
      '3 days': () => checkInDate.setDate(pausedAt.getDate() + 3),
      '1 week': () => checkInDate.setDate(pausedAt.getDate() + 7),
      '2 weeks': () => checkInDate.setDate(pausedAt.getDate() + 14),
      '1 month': () => checkInDate.setMonth(pausedAt.getMonth() + 1),
      '3 months': () => checkInDate.setMonth(pausedAt.getMonth() + 3)
    };

    const adjustTime = durationMap[duration.toLowerCase()];
    if (adjustTime) {
      adjustTime();
    } else {
      checkInDate.setHours(pausedAt.getHours() + 24);
    }

    return checkInDate;
  }

  private calculateCheckInTimeDisplay(checkInDate: Date): string {
    const now = new Date();
    const diffMs = checkInDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours <= 0) return 'Ready to review';
    if (diffHours <= 24) return `Reviewing in ${diffHours}hr${diffHours === 1 ? '' : 's'}`;
    if (diffDays === 1) return 'Reviewing in 1 day';
    
    return `Reviewing in ${diffDays} days`;
  }

  private updateCheckInTimes(): void {
    this.items.forEach(item => {
      item.checkInTime = this.calculateCheckInTimeDisplay(item.checkInDate);
    });
  }

  async addItem(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>): Promise<void> {
    let photoDataUrl: string | undefined;
    
    if (item.photo instanceof File) {
      try {
        photoDataUrl = await this.convertFileToDataUrl(item.photo);
      } catch (error) {
        console.error('Failed to convert image to base64:', error);
      }
    }

    const pausedAt = new Date();
    const checkInDate = this.calculateCheckInDate(item.duration || item.otherDuration || '24 hours', pausedAt);

    const newItem: PausedItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pausedAt,
      checkInDate,
      checkInTime: this.calculateCheckInTimeDisplay(checkInDate),
      photoDataUrl
    };
    
    this.items.push(newItem);
    this.saveToStorage();
    this.notifyListeners();
  }

  getItems(): PausedItem[] {
    this.updateCheckInTimes();
    return [...this.items];
  }

  getItemsForReview(): PausedItem[] {
    const now = new Date();
    console.log('🔍 getItemsForReview - Current time:', now);
    console.log('🔍 getItemsForReview - All items:', this.items.map(item => ({
      id: item.id,
      itemName: item.itemName,
      checkInDate: item.checkInDate,
      checkInTime: item.checkInTime,
      isReady: item.checkInDate <= now
    })));
    
    const reviewItems = this.items.filter(item => item.checkInDate <= now);
    console.log('🔍 getItemsForReview - Items ready for review:', reviewItems.length);
    return reviewItems;
  }

  removeItem(id: string): void {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    
    if (this.items.length !== initialLength) {
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  extendPause(itemId: string, newDuration: string): void {
    console.log('🔄 Local store extendPause called:', { itemId, newDuration });
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      console.log('❌ Item not found in local store:', itemId);
      return;
    }

    const originalItem = this.items[itemIndex];
    console.log('📦 Original item before extend:', originalItem);

    // Calculate new check-in date
    const now = new Date();
    const newCheckInDate = this.calculateCheckInDate(newDuration, now);
    
    // Update the item
    this.items[itemIndex] = {
      ...this.items[itemIndex],
      duration: newDuration,
      checkInDate: newCheckInDate,
      checkInTime: this.calculateCheckInTimeDisplay(newCheckInDate)
    };

    console.log('📦 Updated item after extend:', this.items[itemIndex]);
    console.log('📦 All items in store:', this.items);

    this.saveToStorage();
    this.notifyListeners();
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
