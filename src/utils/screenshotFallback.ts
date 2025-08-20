interface ScreenshotResult {
  success: boolean;
  screenshotUrl?: string;
  title?: string;
  error?: string;
}

// Screenshot fallback when all parsing fails
export const captureScreenshotFallback = async (url: string): Promise<ScreenshotResult> => {
  try {
    console.log('🖼️ Attempting screenshot fallback for:', url);
    
    // Use Firecrawl to capture screenshot
    const response = await fetch('/functions/v1/firecrawl-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        mode: 'screenshot',
        options: {
          formats: ['screenshot'],
          screenshot: true,
          fullPageScreenshot: true,
          waitFor: 2000 // Wait 2 seconds for page to load
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Screenshot service failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.screenshot) {
      console.log('✅ Screenshot captured successfully');
      
      // Try to get at least the page title
      let title = new URL(url).pathname.split('/').pop()?.replace(/-/g, ' ') || 'Page';
      
      // If we got HTML content along with screenshot, extract title
      if (data.markdown || data.html) {
        const tempDoc = new DOMParser().parseFromString(data.html || `<title>${data.markdown?.split('\n')[0] || ''}</title>`, 'text/html');
        const extractedTitle = tempDoc.title || tempDoc.querySelector('h1')?.textContent;
        if (extractedTitle?.trim()) {
          title = extractedTitle.trim();
        }
      }

      return {
        success: true,
        screenshotUrl: data.screenshot,
        title: title
      };
    } else {
      throw new Error(data.error || 'Failed to capture screenshot');
    }
  } catch (error) {
    console.error('❌ Screenshot fallback failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Screenshot capture failed'
    };
  }
};

// Check if we should use screenshot fallback
export const shouldUseScreenshotFallback = (parseResults: any[]): boolean => {
  // Use screenshot if all parsing methods failed or returned very low confidence
  const allFailed = parseResults.every(result => !result.success || result.confidence < 0.3);
  const noUsefulData = parseResults.every(result => 
    !result.data?.itemName && !result.data?.price && !result.data?.imageUrl
  );
  
  return allFailed || noUsefulData;
};

// Enhanced fallback that preserves whatever data we could extract
export const createFallbackResult = async (
  url: string, 
  partialData: any = {},
  screenshotUrl?: string
): Promise<any> => {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace(/^www\./, '');
  
  // Import URL-based extraction
  const { extractProductNameFromUrl } = await import('./smartUrlParser');
  const urlBasedName = extractProductNameFromUrl(url);
  
  return {
    success: true,
    data: {
      itemName: partialData.itemName || 
                urlBasedName ||
                urlObj.pathname.split('/').pop()?.replace(/-/g, ' ') || 
                'Product',
      storeName: partialData.storeName || 
                 domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0],
      price: partialData.price,
      priceCurrency: partialData.priceCurrency,
      imageUrl: partialData.imageUrl,
      brand: partialData.brand,
      description: partialData.description,
      canonicalUrl: partialData.canonicalUrl || url,
      ...partialData
    },
    method: 'url_fallback',
    confidence: urlBasedName ? 0.6 : (screenshotUrl ? 0.4 : 0.2), // Higher confidence if we extracted from URL
    url: url,
    canonicalUrl: partialData.canonicalUrl || url,
    screenshot: screenshotUrl,
    raw: partialData
  };
};