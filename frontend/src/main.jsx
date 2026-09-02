// Must load before anything else: pdfjs-dist assumes the `Iterator` global
// (ES2025 Iterator Helpers) already exists, which older Android WebViews
// don't have. Without this, the whole app crashes at script-load time.
import 'core-js/actual/iterator';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
