export async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('✅ SW registered with scope:', reg.scope);
      // Wait for activation
      await navigator.serviceWorker.ready;
      console.log('✅ SW ready');
      return reg;
    } catch (error) {
      console.error('❌ SW registration failed:', error);
      return null;
    }
  }
  return null;
}