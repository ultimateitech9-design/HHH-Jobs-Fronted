import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiStar
} from 'react-icons/fi';

import useAuthStore from '../../../../core/auth/authStore';
import { getCompanyEntryIntent } from '../../utils/publicAccess';
import { getSponsoredCompanies } from '../../services/companyDirectoryApi';

const getInitials = (name = '') =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CO';

const formatRating = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : '';
};

const CompanyCard = ({ company, isAuthenticated }) => {
  const [logoError, setLogoError] = useState(false);
  const entryIntent = getCompanyEntryIntent({
    companySlug: company.slug,
    isAuthenticated,
    totalJobs: company.totalJobs
  });

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e6d8c1] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(241,233,219,0.98))] shadow-[0_12px_26px_rgba(99,76,41,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(99,76,41,0.24)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(214,172,103,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.1),transparent_24%)] opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full flex-col rounded-[22px] bg-[linear-gradient(180deg,rgba(255,251,244,0.96),rgba(242,234,221,0.98))] px-3.5 pb-3.5 pt-3">
        <div className="flex items-start gap-3">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[#e8dcc9] bg-white p-2 shadow-[0_8px_18px_rgba(120,94,52,0.12)]">
            {company.logoUrl && !logoError ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="max-h-[34px] max-w-[34px] object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="font-heading text-xs font-black text-navy">{getInitials(company.name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-heading text-[1.08rem] font-black leading-tight text-[#22170e] xl:text-[1rem] 2xl:text-[1.08rem]">
              {company.name}
            </h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#7a5d33]">
              {company.sponsorRating ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[#bb8a22]">
                    <FiStar size={12} className="fill-current" />
                    {formatRating(company.sponsorRating)}
                  </span>
                  <span className="text-[#d4c4ad]">|</span>
                </>
              ) : null}
              <span className="line-clamp-1 text-[#6d5640]">
                {company.sponsorReviewsLabel || 'Premium sponsor'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d2c19]">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <FiStar size={10} className="text-[#c08a1f]" />
            Sponsor
          </span>
        </div>

        <div className="mt-3 rounded-[18px] border border-[#e7dbc8] bg-white/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <p className="line-clamp-2 text-[11px] leading-5 text-[#6a5441]">
            {company.sponsorReviewsLabel || 'Trusted sponsor company on HHH Jobs'}
          </p>
        </div>

        <div className="mt-auto pt-3">
          <Link
            to={entryIntent.to}
            state={entryIntent.state}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#263754] bg-[linear-gradient(135deg,rgba(44,61,94,0.98),rgba(67,86,122,0.94))] px-4 py-2.5 text-[12px] font-black text-white shadow-[0_10px_22px_rgba(32,45,72,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(32,45,72,0.28)]"
          >
            {isAuthenticated ? 'Open Hiring Lounge' : 'Login to Unlock'}
            <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
};

const LoadingCard = () => (
  <div className="flex h-full flex-col rounded-[22px] border border-[#e6d8c1] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(241,233,219,0.98))] p-3.5 shadow-[0_12px_26px_rgba(99,76,41,0.14)]">
    <div className="flex items-center gap-3">
      <div className="h-[52px] w-[52px] rounded-[16px] bg-[#e9decd]" />
      <div className="min-w-0 flex-1">
        <div className="h-5 rounded-full bg-[#dfd1bc]" />
        <div className="mt-2 h-3.5 w-3/4 rounded-full bg-[#eadfce]" />
      </div>
    </div>
    <div className="mt-3 flex justify-between gap-3">
      <div className="h-4 w-20 rounded-full bg-[#e7dbc8]" />
      <div className="h-6 w-24 rounded-full bg-[#efe6d8]" />
    </div>
    <div className="mt-3 h-12 rounded-[18px] bg-white/70" />
    <div className="mt-auto pt-3">
      <div className="h-9 rounded-full bg-[#304361]" />
    </div>
  </div>
);

export function SponsoredCompaniesSection() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const sliderRef = useRef(null);
  const sliderViewportRef = useRef(null);
  const [sectionState, setSectionState] = useState({
    companies: [],
    summary: null,
    loading: true,
    error: ''
  });
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      setSectionState((current) => ({ ...current, loading: true, error: '' }));
      const response = await getSponsoredCompanies();
      if (!mounted) return;

      setSectionState({
        companies: response.data?.companies || [],
        summary: response.data?.summary || null,
        loading: false,
        error: response.error || ''
      });
    };

    loadCompanies();

    return () => {
      mounted = false;
    };
  }, []);

  const baseItems = sectionState.loading ? Array.from({ length: 5 }) : sectionState.companies;
  const visibleItems = sectionState.loading ? baseItems : [...baseItems, ...baseItems];
  const paginationItems = sectionState.loading ? baseItems : sectionState.companies;

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return undefined;

    const normalizeLoopPosition = () => {
      const card = slider.querySelector('[data-sponsored-slide]');
      if (!card) return;

      const sliderStyle = window.getComputedStyle(slider);
      const gap = Number.parseFloat(sliderStyle.columnGap || sliderStyle.gap || '0') || 0;
      const stride = card.getBoundingClientRect().width + gap;
      const sourceLength = Math.max(paginationItems.length, 1);

      if (!sectionState.loading && sourceLength > 0) {
        const loopThreshold = stride * sourceLength;

        if (slider.scrollLeft >= loopThreshold) {
          slider.scrollLeft -= loopThreshold;
        }

        if (slider.scrollLeft < 0) {
          slider.scrollLeft += loopThreshold;
        }
      }
    };

    normalizeLoopPosition();
    slider.addEventListener('scroll', normalizeLoopPosition, { passive: true });
    window.addEventListener('resize', normalizeLoopPosition);

    return () => {
      slider.removeEventListener('scroll', normalizeLoopPosition);
      window.removeEventListener('resize', normalizeLoopPosition);
    };
  }, [paginationItems.length, sectionState.loading]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || sectionState.loading || paginationItems.length < 2 || isAutoPaused) return undefined;

    const mediaQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (mediaQuery?.matches) return undefined;

    let frameId = 0;
    let lastTimestamp = 0;
    const pixelsPerSecond = 42;

    const step = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      slider.scrollLeft += (elapsed * pixelsPerSecond) / 1000;
      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isAutoPaused, paginationItems.length, sectionState.loading]);

  return (
    <section className="relative left-1/2 right-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden py-8 md:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.1),transparent_18%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#f6eee1]/65 via-white/20 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#edf6ff]/60 via-white/20 to-transparent" />

      <div className="relative z-10 w-full px-4 md:px-6 xl:px-8">
        {sectionState.error ? (
          <div className="mx-auto max-w-2xl rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
            {sectionState.error}
          </div>
        ) : null}

        <div className={sectionState.error ? 'mt-6' : ''}>
          <div className="mb-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-amber-700 shadow-[0_10px_24px_rgba(245,158,11,0.08)] backdrop-blur-sm">
              Featured Network
            </span>
            <h2 className="mt-3 font-heading text-[2rem] font-black leading-none tracking-[-0.04em] text-transparent bg-[linear-gradient(135deg,#0f2747_0%,#173a67_48%,#c9851b_100%)] bg-clip-text md:text-[2.5rem]">
              Sponsored Companies
            </h2>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Trusted hiring partners
              </span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-sky-300" />
            </div>
          </div>

          <div
            ref={sliderViewportRef}
            className="relative"
            onMouseEnter={() => setIsAutoPaused(true)}
            onMouseLeave={() => setIsAutoPaused(false)}
          >
            <div
              ref={sliderRef}
              className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {sectionState.loading
                ? visibleItems.map((_, index) => (
                    <div
                      key={index}
                      data-sponsored-slide
                      className="min-w-0 shrink-0 basis-[88%] sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)] xl:basis-[calc((100%-4rem)/5)]"
                    >
                      <LoadingCard />
                    </div>
                  ))
                : visibleItems.map((company, index) => (
                    <div
                      key={`${company.id}-${index}`}
                      data-sponsored-slide
                      className="min-w-0 shrink-0 basis-[88%] sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)] xl:basis-[calc((100%-4rem)/5)]"
                    >
                      <CompanyCard
                        company={company}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
