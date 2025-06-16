
import { PausedItem } from '../stores/supabasePausedItemsStore';

export const getImageUrl = (item: PausedItem): string | null => {
  // Debug logging
  console.log('Getting image URL for item:', {
    itemId: item.id,
    imageUrl: item.imageUrl,
    photoDataUrl: item.photoDataUrl,
    hasPhoto: !!item.photo
  });
  
  if (item.imageUrl && item.imageUrl.includes('supabase')) {
    console.log('Using Supabase image URL:', item.imageUrl);
    return item.imageUrl;
  }
  if (item.photoDataUrl) {
    console.log('Using photo data URL');
    return item.photoDataUrl;
  }
  if (item.photo && item.photo instanceof File) {
    console.log('Creating object URL from file');
    return URL.createObjectURL(item.photo);
  }
  if (item.imageUrl) {
    console.log('Using regular image URL:', item.imageUrl);
    return item.imageUrl;
  }
  console.log('No image URL found');
  return null;
};
