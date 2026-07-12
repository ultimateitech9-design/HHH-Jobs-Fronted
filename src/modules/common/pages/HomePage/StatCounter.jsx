import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const StatCounter = ({ duration = 2, end, label, suffix = '', inline = false }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

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
    if (!inView || end === null || end === undefined) return undefined;

    let start = 0;
    const step = end / (duration * 60);
    const timer = window.setInterval(() => {
      start += step;

      if (start >= end) {
        setCount(end);
        window.clearInterval(timer);
        return;
      }

      setCount(Math.floor(start));
    }, 1000 / 60);

    return () => window.clearInterval(timer);
  }, [duration, end, inView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      viewport={{ once: true, amount: 0.35 }}
      className={inline ? 'flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center' : 'w-full text-center'}
    >
      <div className={`font-heading font-bold text-white ${inline ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'}`}>
        {end === null || end === undefined ? '--' : formatter.format(count)}
        {end === null || end === undefined ? '' : suffix}
      </div>
      <p className={inline ? 'text-xs font-semibold text-white/70' : 'mt-2 text-sm text-white/75 md:text-base'}>{label}</p>
    </motion.div>
  );
};

export default StatCounter;
