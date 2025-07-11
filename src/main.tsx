
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting app');

// Temporarily disable all error handlers to debug the issue
// window.addEventListener('error', (event) => {
//   console.error('Global error:', event.error);
// });

// window.addEventListener('unhandledrejection', (event) => {
//   console.error('Unhandled promise rejection:', event.reason);
// });

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found');
} else {
  console.log('Root element found, creating React root');
  const root = createRoot(rootElement);
  root.render(<App />);
}
