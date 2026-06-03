import { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './styles/globals.css';
import './styles/animations.css';
import router from './app/router';
import { useDeferredMount } from './shared/hooks/useDeferredMount';
import { installChunkLoadRecovery } from './shared/utils/chunkLoadRecovery';

installChunkLoadRecovery();

const AppOverlays = lazy(() => import('./shared/components/AppOverlays'));

const DeferredAppOverlays = () => {
  const shouldMount = useDeferredMount(true, { delayMs: 700, timeoutMs: 2200 });

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
