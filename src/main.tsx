import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Élément racine introuvable');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* --------------------------------------------------------------------------
   Service worker — mise en cache de l’interface pour un usage hors ligne.
   Enregistré uniquement en production ; ignoré silencieusement s’il échoue.
-------------------------------------------------------------------------- */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* L’application reste pleinement fonctionnelle sans service worker. */
    });
  });
}
