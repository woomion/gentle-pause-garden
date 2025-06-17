
import { calculateCheckInTimeDisplay } from '@/utils/pausedItemsUtils';
import { PausedItem } from './types';

export class PausedItemsUtils {
  static updateCheckInTimes(items: PausedItem[]): void {
    items.forEach(item => {
      item.checkInTime = calculateCheckInTimeDisplay(item.checkInDate);
    });
  }

  static getItemsForReview(items: PausedItem[]): PausedItem[] {
    const now = new Date();
    console.log('🔍 getItemsForReview DETAILED DEBUG:');
    console.log('🔍 Current time:', now.toISOString());
    console.log('🔍 Current timestamp:', now.getTime());
    console.log('🔍 Total items:', items.length);
    
    const reviewItems = items.filter(item => {
      const checkInTimestamp = item.checkInDate.getTime();
      const nowTimestamp = now.getTime();
      
      // Use the same logic as calculateCheckInTimeDisplay for consistency
      const diffMs = checkInTimestamp - nowTimestamp;
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const isReady = diffHours <= 0;
      
      console.log(`🔍 Item "${item.itemName}":`, {
        checkInDate: item.checkInDate.toISOString(),
        checkInTimestamp,
        nowTimestamp,
        diffMs,
        diffHours,
        isReady: isReady ? '✅ READY' : '❌ NOT READY',
        checkInTime: item.checkInTime
      });
      
      return isReady;
    });
    
    console.log('🔍 Items ready for review:', reviewItems.length);
    console.log('🔍 Review items:', reviewItems.map(item => ({
      id: item.id,
      itemName: item.itemName,
      checkInDate: item.checkInDate.toISOString(),
      checkInTime: item.checkInTime
    })));
    
    return reviewItems;
  }
}
