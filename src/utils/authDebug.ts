// Debug authentication state and session persistence
export function debugAuthState() {
  console.log('🔍 AUTH DEBUG START');
  
  // Check localStorage for Supabase session
  const supabaseAuthKey = `sb-${window.location.hostname.replace(/\./g, '-')}-auth-token`;
  const localStorageKeys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'));
  
  console.log('🔍 LocalStorage keys related to auth:', localStorageKeys);
  
  for (const key of localStorageKeys) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        console.log(`🔍 ${key}:`, {
          hasAccessToken: !!parsed?.access_token,
          hasRefreshToken: !!parsed?.refresh_token,
          expiresAt: parsed?.expires_at,
          expiresIn: parsed?.expires_in,
          user: parsed?.user?.email
        });
      }
    } catch (e) {
      console.log(`🔍 ${key}: (could not parse)`, localStorage.getItem(key));
    }
  }
  
  // Check session storage
  console.log('🔍 SessionStorage keys:', Object.keys(sessionStorage));
  
  // Check current URL and origin
  console.log('🔍 Current URL:', window.location.href);
  console.log('🔍 Current Origin:', window.location.origin);
  
  console.log('🔍 AUTH DEBUG END');
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState;
}