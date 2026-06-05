import { Toaster } from 'react-hot-toast';
import NotificationToast from './NotificationToast';

const AppOverlays = () => (
  <>
    <NotificationToast />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(14,35,69,0.12)',
          padding: '12px 16px'
        },
        success: {
          iconTheme: { primary: '#1f8f53', secondary: '#fff' }
        },
        error: {
          iconTheme: { primary: '#b8393e', secondary: '#fff' }
        }
      }}
    />
  </>
);

export default AppOverlays;
