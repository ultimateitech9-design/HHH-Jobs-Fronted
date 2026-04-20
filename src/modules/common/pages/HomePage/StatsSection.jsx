import { motion } from 'framer-motion';
import StatCounter from './StatCounter';

const stats = [
  { end: 50000, label: 'Active Job Listings', suffix: '+' },
  { end: 10000, label: 'Companies Hiring', suffix: '+' },
  { end: 500000, label: 'Registered Users', suffix: '+' },
  { end: 98, label: 'Verified Jobs', suffix: '%' }
];

export function StatsSection() {
  return (
    <section className="gradient-primary relative overflow-hidden py-20">
      <motion.div
        className="absolute left-0 top-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gold/5 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-8 md:px-12 xl:px-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 md:gap-x-10 md:gap-y-0">
          {stats.map((item) => (
            <StatCounter key={item.label} end={item.end} label={item.label} suffix={item.suffix} />
          ))}
        </div>
      </div>
    </section>
  );
}
