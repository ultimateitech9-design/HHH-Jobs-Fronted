import { useEffect, useState } from 'react';

export const useDeferredMount = (enabled = true, options = {}) => {
  const { delayMs = 0, timeoutMs = 2500 } = options;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return undefined;
    }

    if (ready) return undefined;

    let delayId = null;
    let idleId = null;
    let mounted = true;

    const markReady = () => {
      if (mounted) setReady(true);
    };

    const scheduleIdle = () => {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(markReady, { timeout: timeoutMs });
        return;
      }

      delayId = window.setTimeout(markReady, Math.max(0, timeoutMs));
    };

    if (delayMs > 0) {
      delayId = window.setTimeout(scheduleIdle, delayMs);
    } else {
      scheduleIdle();
    }

    return () => {
      mounted = false;
      if (delayId) window.clearTimeout(delayId);
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [delayMs, enabled, ready, timeoutMs]);

  return ready;
};
