
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting app');

// Ensure page always starts at top on refresh
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// Also scroll to top on page load
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// Immediate scroll to top
window.scrollTo(0, 0);

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
