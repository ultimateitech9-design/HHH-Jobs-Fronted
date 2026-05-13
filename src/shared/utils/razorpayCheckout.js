let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout is only available in the browser.'));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-razorpay-checkout="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Razorpay));
        existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout.')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

export const openRazorpaySubscriptionCheckout = async (session = {}) => {
  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    try {
      const checkout = new Razorpay({
        key: session.keyId,
        subscription_id: session.subscriptionId,
        name: session.name || 'HHH Jobs',
        description: session.description || 'Enable auto-pay after your trial period.',
        image: session.image || '/hhh-job-logo.png',
        prefill: session.prefill || {},
        notes: session.notes || {},
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => resolve({ dismissed: true })
        },
        handler: (response) => resolve({
          dismissed: false,
          razorpayPaymentId: response?.razorpay_payment_id || '',
          razorpaySubscriptionId: response?.razorpay_subscription_id || '',
          razorpaySignature: response?.razorpay_signature || ''
        })
      });

      checkout.open();
    } catch (error) {
      reject(error);
    }
  });
};
