
import { PauseLogItem } from '@/stores/supabasePauseLogStore';
import { DbPausedItem, extractStoreName, extractStoreNameFromNotes, extractActualNotes, formatNotesWithStore } from './pausedItemsUtils';

export const convertDbToPauseLogItem = (dbItem: DbPausedItem): PauseLogItem => {
  console.log('Converting DB item to local for pause log:', dbItem);
  
  // Use the store name from notes if it was stored there, otherwise try to extract from URL
  let storeName = 'Unknown Store';
  
  // Check if store name was stored in notes (new format)
  if (dbItem.notes) {
    storeName = extractStoreNameFromNotes(dbItem.notes);
  }
  
  // Fallback to extracting from URL if no store name found in notes
  if (storeName === 'Unknown Store' && dbItem.url) {
    storeName = extractStoreName(dbItem.url);
  }
  
  // Extract actual notes (remove store name if it was stored there)
  const actualNotes = extractActualNotes(dbItem.notes);
  
  // Ensure status mapping is correct
  let status: 'purchased' | 'let-go' = 'let-go';
  if (dbItem.status === 'purchased') {
    status = 'purchased';
  } else if (dbItem.status === 'let-go') {
    status = 'let-go';
  }
  
  console.log('Status conversion:', { dbStatus: dbItem.status, localStatus: status });
  console.log('Store name conversion:', { 
    originalNotes: dbItem.notes, 
    extractedStoreName: storeName,
    actualNotes: actualNotes 
  });
  
  return {
    id: dbItem.id,
    itemName: dbItem.title,
    storeName: storeName,
    emotion: dbItem.reason || 'something else',
    letGoDate: new Date(dbItem.created_at).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    }),
    status: status,
    notes: actualNotes,
    tags: dbItem.tags || []
  };
};

export const convertPauseLogItemToDb = (
  item: Omit<PauseLogItem, 'id' | 'letGoDate'>
): Omit<DbPausedItem, 'id' | 'user_id' | 'created_at' | 'url' | 'price' | 'pause_duration_days' | 'review_at'> => {
  // Ensure the status is exactly what we expect and matches database values
  const dbStatus = item.status === 'purchased' ? 'purchased' : 'let-go';
  console.log('DB status being saved:', dbStatus);

  // Store the store name in the notes field with a special format
  const notesWithStore = formatNotesWithStore(item.storeName, item.notes);

  console.log('Insert data being prepared:', {
    title: item.itemName,
    reason: item.emotion,
    notes: notesWithStore,
    status: dbStatus
  });

  return {
    title: item.itemName,
    reason: item.emotion,
    notes: notesWithStore,
    status: dbStatus,
    tags: item.tags || [],
    shared_with_partners: [],
    emotion: item.emotion,
    image_url: '',
    is_cart: false,
    item_type: 'item',
    store_name: item.storeName || '',
    other_duration: ''
  };
};
