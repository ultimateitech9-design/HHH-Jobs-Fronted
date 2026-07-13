import { useEffect, useMemo, useRef, useState } from 'react';

const StatCounter = ({ duration = 2, end, label, suffix = '', inline = false }) => {
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 0
      }),
    []
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || end === null || end === undefined) return undefined;

    const startedAt = performance.now();
    let frameId = 0;
    const tick = (timestamp) => {
      const progress = Math.min(1, (timestamp - startedAt) / Math.max(1, duration * 1000));
      if (progress >= 1) {
        setCount(end);
        return;
      }
      setCount(Math.floor(end * progress));
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [duration, end, inView]);

  return (
    <div
      ref={ref}
      className={`native-animated-section ${inline ? 'flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center' : 'w-full text-center'}`}
    >
      <div className={`font-heading font-bold text-white ${inline ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'}`}>
        {end === null || end === undefined ? '--' : formatter.format(count)}
        {end === null || end === undefined ? '' : suffix}
      </div>
      <p className={inline ? 'text-xs font-semibold text-white/70' : 'mt-2 text-sm text-white/75 md:text-base'}>{label}</p>
    </div>
  );
};

export default StatCounter;
