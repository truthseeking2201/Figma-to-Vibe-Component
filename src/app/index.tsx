import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

function initializeApp() {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root container not found');
    return;
  }
  
  try {
    const root = createRoot(container);
    root.render(<App />);
  } catch (error) {
    console.error('Failed to create React root:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
