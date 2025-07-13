
import { PausedItem } from '@/stores/supabasePausedItemsStore';
import { DbPausedItem, DbPausedItemInsert, extractStoreName, parseDurationToDays, calculateCheckInTimeDisplay } from './pausedItemsUtils';
import { 
  extractStoreNameFromNotes, 
  extractProductLinkFromNotes, 
  extractActualNotes, 
  formatNotesWithMetadata 
} from './notesMetadataUtils';
import { processUrls, determineFinalUrl } from './urlProcessingUtils';

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
  
  // Extract store name from notes or URL
  let storeName = extractStoreNameFromNotes(dbItem.notes);
  if (storeName === 'Unknown Store' && dbItem.url) {
    storeName = extractStoreName(dbItem.url);
  }
  
  // Extract actual notes (cleaned of metadata)
  const actualNotes = extractActualNotes(dbItem.notes);
  
  // Extract product link from notes
  const notesProductLink = extractProductLinkFromNotes(dbItem.notes);
  
  // Process URLs to determine image and product link
  // Special case: preserve cart-placeholder for cart items
  let imageUrl: string | undefined;
  let productLink: string | undefined;
  
  if (dbItem.title === 'Cart' && dbItem.url === 'cart-placeholder') {
    imageUrl = 'cart-placeholder';
    // For cart items, the product link should come from notes
    productLink = notesProductLink;
  } else {
    const processed = processUrls(dbItem.url, notesProductLink);
    imageUrl = processed.imageUrl;
    productLink = processed.productLink;
  }
  
  console.log('🖼️ Image URL processing in convertDbToLocal:', {
    dbUrl: dbItem.url,
    notesProductLink,
    processedImageUrl: imageUrl,
    processedProductLink: productLink
  });
  
  return {
    id: dbItem.id,
    itemName: dbItem.title,
    storeName: dbItem.store_name || storeName,
    price: dbItem.price?.toString() || '',
    imageUrl: dbItem.image_url || imageUrl,
    emotion: dbItem.emotion || dbItem.reason || 'something else',
    notes: actualNotes || undefined,
    duration: `${dbItem.pause_duration_days} days`,
    otherDuration: dbItem.other_duration || undefined,
    link: productLink,
    photo: null,
    photoDataUrl: undefined,
    tags: dbItem.tags || [],
    pausedAt,
    checkInTime: calculateCheckInTimeDisplay(reviewAt),
    checkInDate: reviewAt,
    isCart: dbItem.is_cart || dbItem.title === 'Cart' || false,
    itemType: (dbItem.item_type === 'cart' ? 'cart' : 'item') as 'cart' | 'item',
    sharedWithPartners: dbItem.shared_with_partners || [],
    originalUserId: dbItem.user_id
  };
};

export const convertLocalToDb = (
  item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>, 
  imageUrl?: string
): Omit<DbPausedItemInsert, 'user_id'> => {
  const pauseDurationDays = parseDurationToDays(item.duration || item.otherDuration || '24 hours');
  const reviewAt = new Date();
  reviewAt.setDate(reviewAt.getDate() + pauseDurationDays);

  // Format notes with metadata
  const notesWithMetadata = formatNotesWithMetadata(
    item.storeName, 
    item.link, 
    item.notes
  );
  
  // Determine final URL for database storage
  // Priority: uploaded image > auto-parsed image > product link
  // Special case: preserve cart-placeholder for cart items
  let finalUrl: string | null;
  if (item.isCart && item.imageUrl === 'cart-placeholder') {
    finalUrl = 'cart-placeholder';
  } else {
    finalUrl = determineFinalUrl(imageUrl || item.imageUrl, item.link);
  }
  
  console.log('Converting local to DB:', {
    itemName: item.itemName,
    emotion: item.emotion,
    storeName: item.storeName,
    productLink: item.link,
    uploadedImageUrl: imageUrl,
    autoParsedImageUrl: item.imageUrl,
    finalUrl,
    notesWithMetadata
  });

  return {
    title: item.itemName,
    price: item.price ? parseFloat(item.price) : null,
    url: finalUrl,
    reason: item.emotion,
    notes: notesWithMetadata,
    pause_duration_days: pauseDurationDays,
    review_at: reviewAt.toISOString(),
    status: 'paused',
    tags: item.tags || [],
    shared_with_partners: item.sharedWithPartners || [],
    emotion: item.emotion,
    image_url: imageUrl || item.imageUrl || '',
    is_cart: item.isCart || false,
    item_type: item.itemType || 'item',
    store_name: item.storeName || '',
    other_duration: item.otherDuration || ''
  };
};
