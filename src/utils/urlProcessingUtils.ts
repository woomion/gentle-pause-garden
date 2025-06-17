
export const isSupabaseStorageUrl = (url: string): boolean => {
  return url.includes('supabase.co/storage');
};

export const determineUrlType = (url: string): 'image' | 'product' => {
  return isSupabaseStorageUrl(url) ? 'image' : 'product';
};

export const processUrls = (dbUrl: string | null, notesProductLink?: string) => {
  let imageUrl: string | undefined;
  let productLink: string | undefined;
  
  // First, check if we have a product link from notes
  if (notesProductLink) {
    productLink = notesProductLink;
  }
  
  // Then process the main URL field
  if (dbUrl) {
    if (isSupabaseStorageUrl(dbUrl)) {
      // This is an uploaded image
      imageUrl = dbUrl;
    } else {
      // This is a product link (fallback if no link in notes)
      if (!productLink) {
        productLink = dbUrl;
      }
    }
  }
  
  return { imageUrl, productLink };
};

export const determineFinalUrl = (imageUrl?: string, productLink?: string): string | null => {
  if (imageUrl) {
    // Priority: uploaded image goes in URL field
    return imageUrl;
  } else if (productLink && productLink.trim()) {
    // Fallback: product link goes in URL field if no image
    return productLink;
  }
  
  return null;
};
