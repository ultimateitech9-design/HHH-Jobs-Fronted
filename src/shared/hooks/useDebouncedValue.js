import { useEffect, useState } from 'react';

const useDebouncedValue = (value, delayMs = 250) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setDebouncedValue(value), Math.max(0, Number(delayMs) || 0));
    return () => globalThis.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
};

export default useDebouncedValue;
