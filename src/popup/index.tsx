import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { App } from '@/features/app/App';
const root = document.getElementById('root'); if (root) { createRoot(root).render(<App />); }
