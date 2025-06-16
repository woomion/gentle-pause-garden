
import { PausedItem } from '@/stores/supabasePausedItemsStore';
import { DbPausedItem, DbPausedItemInsert, extractStoreName, parseDurationToDays, calculateCheckInTimeDisplay } from './pausedItemsUtils';

export const convertDbToLocal = (dbItem: DbPausedItem): PausedItem => {
  const pausedAt = new Date(dbItem.created_at);
  const reviewAt = new Date(dbItem.review_at);
  
  console.log('Converting DB item to local:', {
    id: dbItem.id,
    title: dbItem.title,
    notes: dbItem.notes,
    url: dbItem.url,
    reason: dbItem.reason,
    rawItem: dbItem
  });
  
  // Use the store name from notes if it was stored there, otherwise try to extract from URL
  let storeName = 'Unknown Store';
  
  // Check if store name was stored in notes (new format)
  if (dbItem.notes && dbItem.notes.includes('STORE:')) {
    const storeMatch = dbItem.notes.match(/STORE:([^|]*)/);
    if (storeMatch) {
      storeName = storeMatch[1].trim();
    }
  } else if (dbItem.url) {
    // Fallback to extracting from URL (old format)
    storeName = extractStoreName(dbItem.url);
  }
  
  // Extract actual notes (remove store name if it was stored there)
  let actualNotes = dbItem.notes;
  if (actualNotes && actualNotes.includes('STORE:')) {
    actualNotes = actualNotes.replace(/STORE:[^|]*\|?/, '').trim();
    if (actualNotes === '') {
      actualNotes = undefined;
    }
  }
  
  return {
    id: dbItem.id,
    itemName: dbItem.title,
    storeName: storeName,
    price: dbItem.price?.toString() || '',
    imageUrl: dbItem.url || undefined,
    emotion: dbItem.reason || 'something else',
    notes: actualNotes || undefined,
    duration: `${dbItem.pause_duration_days} days`,
    otherDuration: undefined,
    link: dbItem.url || undefined,
    photo: null,
    photoDataUrl: undefined,
    pausedAt,
    checkInTime: calculateCheckInTimeDisplay(reviewAt),
    checkInDate: reviewAt
  };
};

export const convertLocalToDb = (
  item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>, 
  imageUrl?: string
): Omit<DbPausedItemInsert, 'user_id'> => {
  const pauseDurationDays = parseDurationToDays(item.duration || item.otherDuration || '24 hours');
  const reviewAt = new Date();
  reviewAt.setDate(reviewAt.getDate() + pauseDurationDays);

  // For authenticated users, prioritize uploaded images over product links
  let finalUrl = null;
  
  if (imageUrl) {
    // This is an uploaded image URL from Supabase Storage
    finalUrl = imageUrl;
    console.log('Using uploaded image URL:', imageUrl);
  } else if (item.link && !item.photo) {
    // This is a product link without an uploaded image
    finalUrl = item.link;
    console.log('Using product link:', item.link);
  }
  
  // Store the store name in the notes field with a special format so we can retrieve it later
  let notesWithStore = '';
  if (item.storeName && item.storeName !== 'Unknown Store') {
    notesWithStore = `STORE:${item.storeName}`;
    if (item.notes && item.notes.trim()) {
      notesWithStore += `|${item.notes}`;
    }
  } else if (item.notes && item.notes.trim()) {
    notesWithStore = item.notes;
  }
  
  console.log('Converting local to DB:', {
    itemName: item.itemName,
    emotion: item.emotion,
    storeName: item.storeName,
    finalUrl,
    notesWithStore,
    hasUploadedImage: !!imageUrl,
    hasProductLink: !!item.link
  });

  return {
    title: item.itemName,
    price: item.price ? parseFloat(item.price) : null,
    url: finalUrl,
    reason: item.emotion,
    notes: notesWithStore || null,
    pause_duration_days: pauseDurationDays,
    review_at: reviewAt.toISOString(),
    status: 'paused'
  };
};
