import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const campusPartners = [
  {
    name: 'Amity University Noida',
    website: 'https://www.amity.edu/noida/'
  },
  {
    name: 'Jaypee Institute of Information Technology',
    website: 'https://www.jiit.ac.in/'
  },
  {
    name: 'JSS Academy of Technical Education',
    website: 'https://jssaten.ac.in/'
  },
  {
    name: 'IMS Noida',
    website: 'https://www.imsnoida.com/'
  },
  {
    name: 'AAFT Noida',
    website: 'https://aaft.com/'
  },
  {
    name: 'IIM Lucknow Noida Campus',
    website: 'https://www.iiml.ac.in/campus/noida-campus'
  },
  {
    name: 'SCMS Noida',
    website: 'https://www.scmsnoida.ac.in/'
  },
  {
    name: 'GLA Noida Campus',
    website: 'https://noida.gla.ac.in/'
  },
  {
    name: 'Vikrant University',
    website: 'https://vikrantuniversity.ac.in/'
  },
  {
    name: 'Mangalmay Group of Institutions',
    website: 'https://www.mangalmay.org/'
  }
];

const getInitials = (name = '') =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CC';

const getPartnerNameClassName = (name = '') => {
  const length = String(name || '').trim().length;

  if (length >= 30) {
    return 'text-[1rem] leading-[1.18]';
  }

  if (length >= 22) {
    return 'text-[1.05rem] leading-[1.2]';
  }

  return 'text-lg leading-tight';
};

const getFaviconUrl = (website) =>
  `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(website)}&sz=256`;

function CampusPartnerCard({ partner }) {
  const [logoError, setLogoError] = useState(false);
  const logoSrc = getFaviconUrl(partner.website);

  return (
    <motion.a
      href={partner.website}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -2, scale: 1.01 }}
      className="group flex min-w-[250px] max-w-[250px] shrink-0 items-center gap-4 px-3 py-2.5 transition-transform"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/90 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
        {logoError ? (
          <span className="font-heading text-sm font-black tracking-[0.08em] text-navy">
            {getInitials(partner.name)}
          </span>
        ) : (
          <img
            src={logoSrc}
            alt={partner.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-9 w-9 object-contain"
            onError={() => setLogoError(true)}
          />
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`font-heading font-bold text-navy transition-colors group-hover:text-brand-700 ${getPartnerNameClassName(partner.name)}`}
        >
          {partner.name}
        </p>
      </div>
    </motion.a>
  );
}

export function CampusConnectSection() {
  const marqueeItems = [...campusPartners, ...campusPartners];

  return (
    <section className="relative left-1/2 right-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden px-0 py-16 md:py-18">
      <div className="mx-auto w-full max-w-none px-4 md:px-6 xl:px-8">
        <AnimatedSection className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/75 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-gold-dark shadow-sm backdrop-blur">
            <GraduationCap className="h-3.5 w-3.5" />
            Campus Connect
          </span>
          <h2 className="mt-4 font-heading text-3xl font-extrabold text-navy md:text-4xl">
            Campus Network
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-10">
          <div className="relative overflow-hidden">
            <motion.div
              className="flex w-max items-center gap-6"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{ willChange: 'transform' }}
            >
              {marqueeItems.map((partner, index) => (
                <CampusPartnerCard
                  key={`${partner.name}-${index}`}
                  partner={partner}
                />
              ))}
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
