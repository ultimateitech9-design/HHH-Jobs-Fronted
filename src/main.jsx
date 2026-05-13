import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import NotificationToast from './shared/components/NotificationToast';
import './index.css';
import './styles/globals.css';
import './styles/animations.css';
import router from './app/router';
import { installChunkLoadRecovery } from './shared/utils/chunkLoadRecovery';

installChunkLoadRecovery();

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <RouterProvider router={router} />
    <NotificationToast />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(14,35,69,0.12)',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#1f8f53', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#b8393e', secondary: '#fff' },
        },
      }}
    />
  </HelmetProvider>
);
