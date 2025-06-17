
import { Database } from '@/integrations/supabase/types';
import { PausedItem } from '@/stores/supabasePausedItemsStore';
import { extractStoreName, parseDurationToDays, calculateCheckInTimeDisplay } from './pausedItemsUtils';

export type DbPausedItem = Database['public']['Tables']['paused_items']['Row'];
export type DbPausedItemInsert = Database['public']['Tables']['paused_items']['Insert'];

export const convertDbToLocal = (dbItem: DbPausedItem): PausedItem => {
  // Ensure proper date conversion - review_at is when they should check in
  const pausedAt = new Date(dbItem.created_at);
  const checkInDate = new Date(dbItem.review_at);
  
  const checkInTime = calculateCheckInTimeDisplay(checkInDate);

  const convertedItem: PausedItem = {
    id: dbItem.id,
    itemName: dbItem.title,
    storeName: extractStoreName(dbItem.url || ''),
    price: dbItem.price?.toString() || '',
    imageUrl: dbItem.url || undefined,
    emotion: dbItem.reason || '',
    notes: dbItem.notes || undefined,
    duration: `${dbItem.pause_duration_days} days`,
    link: dbItem.url || undefined,
    pausedAt,
    checkInTime,
    checkInDate
  };

  return convertedItem;
};

export const convertLocalToDb = (
  item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>,
  imageUrl?: string
): Omit<DbPausedItemInsert, 'user_id'> => {
  const durationDays = parseDurationToDays(item.duration);
  const now = new Date();
  const reviewAt = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));

  console.log('🔄 Converting local to DB:', {
    duration: item.duration,
    durationDays,
    now: now.toISOString(),
    reviewAt: reviewAt.toISOString()
  });

  return {
    title: item.itemName,
    url: item.link || imageUrl || null,
    reason: item.emotion,
    notes: item.notes || null,
    price: item.price ? parseFloat(item.price) : null,
    pause_duration_days: durationDays,
    review_at: reviewAt.toISOString(),
    status: 'paused'
  };
};
