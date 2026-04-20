import { motion } from 'framer-motion';
import {
  SiAmazon,
  SiApple,
  SiGoogle,
  SiMeta,
  SiMicrosoft,
  SiNetflix,
  SiSpotify,
  SiStripe
} from 'react-icons/si';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const companies = [
  { name: 'Google', icon: SiGoogle, color: '#4285F4', glow: 'rgba(66,133,244,0.16)' },
  { name: 'Microsoft', icon: SiMicrosoft, color: '#00A4EF', glow: 'rgba(0,164,239,0.15)' },
  { name: 'Amazon', icon: SiAmazon, color: '#FF9900', glow: 'rgba(255,153,0,0.15)' },
  { name: 'Meta', icon: SiMeta, color: '#0866FF', glow: 'rgba(8,102,255,0.14)' },
  { name: 'Apple', icon: SiApple, color: '#111827', glow: 'rgba(17,24,39,0.1)' },
  { name: 'Netflix', icon: SiNetflix, color: '#E50914', glow: 'rgba(229,9,20,0.14)' },
  { name: 'Spotify', icon: SiSpotify, color: '#1ED760', glow: 'rgba(30,215,96,0.14)' },
  { name: 'Stripe', icon: SiStripe, color: '#635BFF', glow: 'rgba(99,91,255,0.14)' }
];

export function TrustedBySection() {
  return (
    <section className="overflow-hidden border-b border-slate-200 px-4 py-12 md:py-14">
      <div className="container mx-auto max-w-7xl">
        <AnimatedSection>
          <p className="mb-6 text-center text-[12px] font-medium uppercase tracking-[0.3em] text-slate-500">
            Trusted by leading companies worldwide
          </p>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#fbf8f2] to-transparent" />
            <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#fbf8f2] to-transparent" />
            <motion.div
              className="flex w-max items-center gap-10"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              style={{ willChange: 'transform' }}
            >
              {[...companies, ...companies].map((company, index) => {
                const CompanyIcon = company.icon;

                return (
                  <motion.div
                    key={`${company.name}-${index}`}
                    whileHover={{ scale: 1.08, y: -1 }}
                    className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 transition-transform"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                      style={{ color: company.color }}
                    >
                      <CompanyIcon size={22} />
                    </span>
                    <span
                      className="font-heading text-[1.15rem] font-bold text-slate-700"
                    >
                      {company.name}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
