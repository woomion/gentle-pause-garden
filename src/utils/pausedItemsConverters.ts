
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
  
  // Parse the notes to extract link and imageUrl separately
  let productLink = undefined;
  let imageUrl = undefined;
  
  if (actualNotes && actualNotes.includes('LINK:')) {
    const linkMatch = actualNotes.match(/LINK:([^|]*)/);
    if (linkMatch) {
      productLink = linkMatch[1].trim();
    }
    actualNotes = actualNotes.replace(/LINK:[^|]*\|?/, '').trim();
    if (actualNotes === '') {
      actualNotes = undefined;
    }
  }
  
  // Determine if the URL is an uploaded image or product link
  if (dbItem.url) {
    if (dbItem.url.includes('supabase.co/storage')) {
      // This is an uploaded image
      imageUrl = dbItem.url;
    } else {
      // This is a product link
      productLink = dbItem.url;
    }
  }
  
  return {
    id: dbItem.id,
    itemName: dbItem.title,
    storeName: storeName,
    price: dbItem.price?.toString() || '',
    imageUrl: imageUrl,
    emotion: dbItem.reason || 'something else',
    notes: actualNotes || undefined,
    duration: `${dbItem.pause_duration_days} days`,
    otherDuration: undefined,
    link: productLink,
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

  // Store the store name and product link in the notes field with a special format
  let notesWithMetadata = '';
  
  if (item.storeName && item.storeName !== 'Unknown Store') {
    notesWithMetadata = `STORE:${item.storeName}`;
  }
  
  // Store the product link separately from the uploaded image
  if (item.link && item.link.trim()) {
    if (notesWithMetadata) {
      notesWithMetadata += `|LINK:${item.link}`;
    } else {
      notesWithMetadata = `LINK:${item.link}`;
    }
  }
  
  if (item.notes && item.notes.trim()) {
    if (notesWithMetadata) {
      notesWithMetadata += `|${item.notes}`;
    } else {
      notesWithMetadata = item.notes;
    }
  }
  
  // Determine what goes in the URL field
  let finalUrl = null;
  
  if (imageUrl) {
    // If we have an uploaded image, store that in the URL field
    finalUrl = imageUrl;
    console.log('Using uploaded image URL in database:', imageUrl);
  } else if (item.link && item.link.trim()) {
    // If no uploaded image but we have a product link, store the product link
    finalUrl = item.link;
    console.log('Using product link in database:', item.link);
  }
  
  console.log('Converting local to DB:', {
    itemName: item.itemName,
    emotion: item.emotion,
    storeName: item.storeName,
    productLink: item.link,
    uploadedImageUrl: imageUrl,
    finalUrl,
    notesWithMetadata
  });

  return {
    title: item.itemName,
    price: item.price ? parseFloat(item.price) : null,
    url: finalUrl,
    reason: item.emotion,
    notes: notesWithMetadata || null,
    pause_duration_days: pauseDurationDays,
    review_at: reviewAt.toISOString(),
    status: 'paused'
  };
};
