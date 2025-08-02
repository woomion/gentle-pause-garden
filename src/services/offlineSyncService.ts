
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { offlineQueueStore, OfflineOperation } from '../stores/offlineQueueStore';

class OfflineSyncService {
  private syncInProgress = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    const queue = offlineQueueStore.getQueue();
    if (queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync of', queue.length, 'operations');

    for (const operation of queue) {
      await this.syncOperation(operation);
    }

    this.syncInProgress = false;
    console.log('✅ Sync completed');
  }

  private async syncOperation(operation: OfflineOperation): Promise<void> {
    try {
      console.log('🔄 Syncing operation:', operation.type, operation.id);

      switch (operation.type) {
        case 'ADD_ITEM':
          await supabasePausedItemsStore.addItem(operation.data);
          break;
        case 'REMOVE_ITEM':
          await supabasePausedItemsStore.removeItem(operation.data.id);
          break;
        case 'EXTEND_PAUSE':
          await supabasePausedItemsStore.extendPause(operation.data.id, operation.data.duration);
          break;
        default:
          console.warn('Unknown operation type:', operation.type);
          break;
      }

      // Operation succeeded, remove from queue
      offlineQueueStore.removeOperation(operation.id);
      console.log('✅ Successfully synced operation:', operation.id);

    } catch (error) {
      console.error('❌ Failed to sync operation:', operation.id, error);
      
      // Increment retry count
      offlineQueueStore.incrementRetry(operation.id);
      
      // Remove operation if max retries exceeded
      if (operation.retryCount >= this.MAX_RETRIES) {
        console.error('❌ Max retries exceeded for operation:', operation.id);
        offlineQueueStore.removeOperation(operation.id);
      } else {
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
  }

  startPeriodicSync(): void {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingOperations();
      }
    }, 30000);
  }
}

export const offlineSyncService = new OfflineSyncService();
