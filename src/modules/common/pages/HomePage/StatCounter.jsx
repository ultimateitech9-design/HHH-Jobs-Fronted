import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const StatCounter = ({ duration = 2, end, label, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 0
      }),
    []
  );

  useEffect(() => {
    if (!inView) return undefined;

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
      className="w-full text-center"
    >
      <div className="font-heading text-3xl font-bold tracking-tight text-white md:text-5xl">
        {formatter.format(count)}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-white/75 md:text-base">{label}</p>
    </motion.div>
  );
};

export default StatCounter;
