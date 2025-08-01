
// Enhanced URL detection with mobile app support
export const isImageUrl = (url: string): boolean => {
  // Check if it's a Supabase storage URL
  if (url.includes('supabase.co/storage')) {
    return true;
  }
  
  // Check if URL has image file extension
  const imageExtensions = /\.(jpg|jpeg|png|webp|gif|avif|svg)($|\?)/i;
  if (imageExtensions.test(url)) {
    return true;
  }
  
  // Check if URL contains image-related paths
  const imagePathPatterns = [
    /\/images?\//i,
    /\/media\//i,
    /\/photos?\//i,
    /\/pics?\//i,
    /\/assets\//i,
    /\/cdn\//i,
    /\/uploads\//i,
    /\/content\//i,
    /\.cloudfront\.net/i,
    /img\./i,
    /image\./i
  ];
  
  return imagePathPatterns.some(pattern => pattern.test(url));
};

// Enhanced URL normalization for mobile apps and shortened URLs
export const normalizeUrl = (url: string): string => {
  // Handle app-specific URLs (convert to web URLs)
  const appUrlMappings: Record<string, string> = {
    'amazon://': 'https://amazon.com/',
    'target://': 'https://target.com/',
    'etsy://': 'https://etsy.com/',
    'ebay://': 'https://ebay.com/',
  };
  
  for (const [appScheme, webUrl] of Object.entries(appUrlMappings)) {
    if (url.startsWith(appScheme)) {
      return url.replace(appScheme, webUrl);
    }
  }
  
  // Add https if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

export const isSupabaseStorageUrl = (url: string): boolean => {
  return url.includes('supabase.co/storage');
};

export const determineUrlType = (url: string): 'image' | 'product' => {
  return isImageUrl(url) ? 'image' : 'product';
};

export const processUrls = (dbUrl: string | null, notesProductLink?: string) => {
  let imageUrl: string | undefined;
  let productLink: string | undefined;
  
  console.log('🖼️ processUrls called with:', { dbUrl, notesProductLink });
  
  // First, check if we have a product link from notes
  if (notesProductLink) {
    productLink = normalizeUrl(notesProductLink);
    console.log('🖼️ Product link from notes (normalized):', productLink);
  }
  
  // Then process the main URL field
  if (dbUrl) {
    const normalizedDbUrl = normalizeUrl(dbUrl);
    
    if (isImageUrl(normalizedDbUrl)) {
      // This is an image URL (either Supabase storage or external image)
      imageUrl = normalizedDbUrl;
      console.log('🖼️ Detected as image URL:', imageUrl);
    } else {
      // This is a product link (fallback if no link in notes)
      if (!productLink) {
        productLink = normalizedDbUrl;
        console.log('🖼️ Detected as product link (normalized):', productLink);
      }
    }
  }
  
  const result = { imageUrl, productLink };
  console.log('🖼️ processUrls result:', result);
  return result;
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
