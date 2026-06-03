import { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import router from './app/router';
import { useDeferredMount } from './shared/hooks/useDeferredMount';
import { installChunkLoadRecovery } from './shared/utils/chunkLoadRecovery';

installChunkLoadRecovery();

const loadGlobalStyles = () => {
  import('./styles/globals.css');
};

const loadAnimationStyles = () => {
  import('./styles/animations.css');
};

if (typeof window !== 'undefined') {
  const needsPortalStylesNow = /^\/(?:portal|management)\b/i.test(window.location.pathname);
  if (needsPortalStylesNow) {
    loadGlobalStyles();
    window.setTimeout(loadAnimationStyles, 5000);
  } else {
    window.setTimeout(() => {
      loadGlobalStyles();
      loadAnimationStyles();
    }, 8000);
  }
}

const AppOverlays = lazy(() => import('./shared/components/AppOverlays'));

const DeferredAppOverlays = () => {
  const shouldMount = useDeferredMount(true, { delayMs: 5000, timeoutMs: 10000 });

  if (!shouldMount) return null;

  return (
    <Suspense fallback={null}>
      <AppOverlays />
    </Suspense>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <RouterProvider router={router} />
    <DeferredAppOverlays />
  </HelmetProvider>
);
