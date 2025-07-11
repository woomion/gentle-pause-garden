
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting app');

// Add global error handler for mobile debugging, but filter out Vite dev server issues
window.addEventListener('error', (event) => {
  // Filter out Vite development server connection errors
  if (event.error?.message?.includes('Failed to fetch') && event.error?.stack?.includes('vite/client')) {
    return; // Ignore Vite dev server connection errors
  }
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  // Filter out Vite development server connection errors
  if (event.reason?.message?.includes('Failed to fetch') && event.reason?.stack?.includes('vite/client')) {
    event.preventDefault(); // Prevent the error from propagating
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found');
} else {
  console.log('Root element found, creating React root');
  const root = createRoot(rootElement);
  root.render(<App />);
}
