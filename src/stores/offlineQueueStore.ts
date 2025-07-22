
export interface OfflineOperation {
  id: string;
  type: 'ADD_ITEM' | 'REMOVE_ITEM' | 'EXTEND_PAUSE';
  data: any;
  timestamp: Date;
  retryCount: number;
}

type Listener = () => void;

class OfflineQueueStore {
  private queue: OfflineOperation[] = [];
  private listeners: Set<Listener> = new Set();
  private readonly storageKey = 'offlineQueue';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedQueue = JSON.parse(stored);
        this.queue = parsedQueue.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue from storage:', error);
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue to storage:', error);
    }
  }

  addOperation(type: OfflineOperation['type'], data: any): string {
    const operation: OfflineOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    this.queue.push(operation);
    this.saveToStorage();
    this.notifyListeners();
    
    console.log('🔄 Added offline operation:', operation);
    return operation.id;
  }

  removeOperation(id: string): void {
    this.queue = this.queue.filter(op => op.id !== id);
    this.saveToStorage();
    this.notifyListeners();
    console.log('✅ Removed offline operation:', id);
  }

  getQueue(): OfflineOperation[] {
    return [...this.queue];
  }

  incrementRetry(id: string): void {
    const operation = this.queue.find(op => op.id === id);
    if (operation) {
      operation.retryCount++;
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
        console.error('Error in offline queue listener:', error);
      }
    });
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }
}

export const offlineQueueStore = new OfflineQueueStore();
