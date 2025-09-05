
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting app');

// Register our minimal service worker that cooperates with Progressier
const updateSW = registerSW({
  immediate: false, // Don't auto-refresh
  onOfflineReady() {
    console.log('🔋 App ready to work offline');
  },
  onNeedRefresh() {
    console.log('⬆️ New content available; manual refresh needed');
    // Don't auto-update, let user control when to refresh
  }
});

// Comprehensive scroll restoration
const scrollToTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

// Immediate scroll to top
scrollToTop();

// Ensure page always starts at top on refresh/load
window.addEventListener('beforeunload', scrollToTop);
window.addEventListener('load', scrollToTop);
window.addEventListener('pageshow', scrollToTop);

// Additional scroll restoration after DOM is ready
document.addEventListener('DOMContentLoaded', scrollToTop);

// React-specific scroll restoration
setTimeout(scrollToTop, 0);
setTimeout(scrollToTop, 100);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found');
} else {
  console.log('Root element found, creating React root');
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
