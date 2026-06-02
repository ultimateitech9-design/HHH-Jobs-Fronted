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

const normalizeRazorpaySession = (session = {}) => ({
  ...session,
  keyId: session.keyId || session.key_id || session.razorpayKeyId || session.razorpay_key_id || '',
  subscriptionId: session.subscriptionId || session.subscription_id || session.razorpaySubscriptionId || session.razorpay_subscription_id || '',
  localSubscriptionId: session.localSubscriptionId || session.local_subscription_id || '',
  shortUrl: session.shortUrl || session.short_url || ''
});

export const preloadRazorpayCheckout = () => loadRazorpayScript();

const isLocalCheckoutHost = () => {
  if (typeof window === 'undefined') return true;
  const host = String(window.location.hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
};

const assertRazorpayKeyAllowed = (keyId = '') => {
  const normalizedKeyId = String(keyId || '').trim();
  const productionHost = !isLocalCheckoutHost();
  if (productionHost && normalizedKeyId.startsWith('rzp_test_')) {
    throw new Error('Razorpay live key is required on production. Payment was not started.');
  }
};

const getCheckoutImage = (image) => {
  if (image) return image;
  if (typeof window === 'undefined') return undefined;
  const host = String(window.location.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return undefined;
  return `${window.location.origin}/hhh-job-logo.png`;
};

export const openRazorpaySubscriptionCheckout = async (session = {}) => {
  const normalizedSession = normalizeRazorpaySession(session);
  if (!normalizedSession.keyId) {
    throw new Error('Razorpay key is missing from checkout session.');
  }
  assertRazorpayKeyAllowed(normalizedSession.keyId);

  if (!normalizedSession.subscriptionId) {
    throw new Error('Razorpay subscription id is missing from checkout session.');
  }

  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    try {
      const checkout = new Razorpay({
        key: normalizedSession.keyId,
        subscription_id: normalizedSession.subscriptionId,
        name: normalizedSession.name || 'HHH Jobs',
        description: normalizedSession.description || 'Enable auto-pay after your trial period.',
        image: getCheckoutImage(normalizedSession.image),
        prefill: normalizedSession.prefill || {},
        notes: normalizedSession.notes || {},
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

export const openRazorpayOrderCheckout = async (session = {}) => {
  const normalizedSession = {
    ...session,
    keyId: session.keyId || session.key_id || session.razorpayKeyId || session.razorpay_key_id || '',
    orderId: session.orderId || session.order_id || session.razorpayOrderId || session.razorpay_order_id || '',
    purchaseId: session.purchaseId || session.purchase_id || ''
  };

  if (!normalizedSession.keyId) {
    throw new Error('Razorpay key is missing from checkout session.');
  }
  assertRazorpayKeyAllowed(normalizedSession.keyId);

  if (!normalizedSession.orderId) {
    throw new Error('Razorpay order id is missing from checkout session.');
  }

  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    try {
      const checkout = new Razorpay({
        key: normalizedSession.keyId,
        order_id: normalizedSession.orderId,
        amount: normalizedSession.amount,
        currency: normalizedSession.currency || 'INR',
        name: normalizedSession.name || 'HHH Jobs',
        description: normalizedSession.description || 'Recruiter plan checkout.',
        image: getCheckoutImage(normalizedSession.image),
        prefill: normalizedSession.prefill || {},
        notes: normalizedSession.notes || {},
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => resolve({ dismissed: true })
        },
        handler: (response) => resolve({
          dismissed: false,
          purchaseId: normalizedSession.purchaseId,
          razorpayOrderId: response?.razorpay_order_id || normalizedSession.orderId,
          razorpayPaymentId: response?.razorpay_payment_id || '',
          razorpaySignature: response?.razorpay_signature || ''
        })
      });

      checkout.open();
    } catch (error) {
      reject(error);
    }
  });
};
