
import { PausedItem } from '../stores/supabasePausedItemsStore';

export const getImageUrl = (item: PausedItem): string | null => {
  console.log('📸 getImageUrl - Processing item:', {
    itemId: item.id,
    itemName: item.itemName,
    imageUrl: item.imageUrl,
    photoDataUrl: item.photoDataUrl,
    hasPhoto: !!item.photo,
    isCart: item.isCart,
    usePlaceholder: item.usePlaceholder
  });
  
  // Handle cart placeholder first
  if (item.imageUrl === 'cart-placeholder') {
    console.log('📸 Using cart placeholder');
    return 'cart-placeholder';
  }
  
  // Priority order:
  // 1. Supabase Storage URL (contains supabase)
  // 2. photoDataUrl (base64 encoded image)
  // 3. File object (create blob URL)
  // 4. Regular image URL (external)
  // 5. Default placeholder if usePlaceholder is true OR no image available
  
  if (item.imageUrl) {
    if (item.imageUrl.includes('supabase.co/storage') || item.imageUrl.includes('supabase')) {
      console.log('📸 Using Supabase storage URL:', item.imageUrl);
      return item.imageUrl;
    }
  }
  
  if (item.photoDataUrl) {
    console.log('📸 Using photo data URL');
    return item.photoDataUrl;
  }
  
  if (item.photo && item.photo instanceof File) {
    console.log('📸 Creating object URL from file');
    return URL.createObjectURL(item.photo);
  }
  
  if (item.imageUrl) {
    try {
      new URL(item.imageUrl);
      console.log('📸 Using external image URL:', item.imageUrl);
      return item.imageUrl;
    } catch {
      console.log('📸 Invalid URL format:', item.imageUrl);
    }
  }
  
  // If usePlaceholder is explicitly true OR no image available, use placeholder
  if (item.usePlaceholder || (!item.imageUrl && !item.photoDataUrl && !item.photo)) {
    console.log('📸 Using default placeholder image');
    return '/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png';
  }
  
  console.log('📸 No valid image URL found');
  return null;
};
