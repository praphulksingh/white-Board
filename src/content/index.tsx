
import { createRoot } from 'react-dom/client';
import { Overlay } from './Overlay';
import styles from '@/styles/index.css?inline';

const initOverlay = () => {
  const container = document.createElement('div');
  container.id = 'gestureboard-overlay-container';
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: 'open' });

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  shadow.appendChild(styleElement);

  const rootElement = document.createElement('div');
  shadow.appendChild(rootElement);

  const root = createRoot(rootElement);
  root.render(<Overlay />);
};

initOverlay();
