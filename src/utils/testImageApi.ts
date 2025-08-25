// Test function to check what image data is available
export const testImageApi = async () => {
  try {
    console.log('🧪 Testing image API...');
    const response = await fetch('https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/test-image-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    console.log('🧪 Test result:', result);
    return result;
  } catch (error) {
    console.error('🧪 Test error:', error);
    return null;
  }
};

// Call this function in console to test
(window as any).testImageApi = testImageApi;