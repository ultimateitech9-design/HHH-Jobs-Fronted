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
    companyName: company.name,
    company,
    isAuthenticated,
    totalJobs: company.totalJobs
  });

  return (
    <article className="public-cinematic-card group relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition duration-300 hover:border-amber-300 hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-amber-400 transition-transform duration-300 group-hover:scale-x-100" />

      <div className="relative z-10 flex h-full flex-col px-3.5 pb-3.5 pt-3">
        <div className="flex items-start gap-3">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
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
            <h3 className="line-clamp-2 font-heading text-[1.08rem] font-black leading-tight text-slate-950 xl:text-[1rem] 2xl:text-[1.08rem]">
              {company.name}
            </h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              {company.sponsorRating ? (
                <>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <FiStar size={12} className="fill-current" />
                    {formatRating(company.sponsorRating)}
                  </span>
                  <span className="text-slate-300">|</span>
                </>
              ) : null}
              <span className="line-clamp-1 text-slate-500">
                {company.sponsorReviewsLabel || 'Premium sponsor'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3 text-[10px] font-bold uppercase text-slate-700">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <FiStar size={10} className="text-amber-600" />
            Sponsor
          </span>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="line-clamp-2 text-[11px] leading-5 text-slate-500">
            {company.sponsorReviewsLabel || 'Trusted sponsor company on HHH Jobs'}
          </p>
        </div>

        <div className="mt-auto pt-3">
          <Link
            to={entryIntent.to}
            state={entryIntent.state}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-[12px] font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
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
  <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="h-[52px] w-[52px] rounded-lg bg-slate-200" />
      <div className="min-w-0 flex-1">
        <div className="h-5 rounded bg-slate-200" />
        <div className="mt-2 h-3.5 w-3/4 rounded bg-slate-100" />
      </div>
    </div>
    <div className="mt-3 flex justify-between gap-3">
      <div className="h-4 w-20 rounded bg-slate-100" />
      <div className="h-6 w-24 rounded bg-slate-100" />
    </div>
    <div className="mt-3 h-12 rounded-lg bg-slate-100" />
    <div className="mt-auto pt-3">
      <div className="h-9 rounded-lg bg-slate-800" />
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

    const intervalId = window.setInterval(() => {
      const card = slider.querySelector('[data-sponsored-slide]');
      if (!card) return;
      const sliderStyle = window.getComputedStyle(slider);
      const gap = Number.parseFloat(sliderStyle.columnGap || sliderStyle.gap || '0') || 0;
      slider.scrollBy({ left: card.getBoundingClientRect().width + gap, behavior: 'smooth' });
    }, 5200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAutoPaused, paginationItems.length, sectionState.loading]);

  return (
    <section className="relative w-full max-w-none overflow-hidden border-y border-slate-200 bg-white py-8 md:py-10">

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
            <h2 className="mt-3 font-heading text-[2rem] font-black leading-none text-navy md:text-[2.5rem]">
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
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {sectionState.loading
                ? visibleItems.map((_, index) => (
                    <div
                      key={index}
                      data-sponsored-slide
                      className="min-w-0 shrink-0 snap-start basis-[88%] sm:basis-[calc((100%-0.75rem)/2)] md:basis-[calc((100%-1.5rem)/3)] lg:basis-[calc((100%-2.25rem)/4)] xl:basis-[calc((100%-3rem)/5)]"
                    >
                      <LoadingCard />
                    </div>
                  ))
                : visibleItems.map((company, index) => (
                    <div
                      key={`${company.id}-${index}`}
                      data-sponsored-slide
                      className="min-w-0 shrink-0 snap-start basis-[88%] sm:basis-[calc((100%-0.75rem)/2)] md:basis-[calc((100%-1.5rem)/3)] lg:basis-[calc((100%-2.25rem)/4)] xl:basis-[calc((100%-3rem)/5)]"
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
