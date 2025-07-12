
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting app');

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
