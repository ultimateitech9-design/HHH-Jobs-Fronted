import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../../../../utils/api';
import './HomePage.css';

import { HeroSection } from './HeroSection';
import { TrustedBySection } from './TrustedBySection';
import { CategoryCards } from './CategoryCards';
import { FeaturedJobs } from './FeaturedJobs';
import { fallbackFeaturedJobs } from './data/fallbackFeaturedJobs';

const SponsoredCompaniesSection = lazy(() =>
  import('./SponsoredCompaniesSection').then((module) => ({ default: module.SponsoredCompaniesSection }))
);
const WhyHHHJobs = lazy(() =>
  import('./WhyHHHJobs').then((module) => ({ default: module.WhyHHHJobs }))
);
const CampusConnectSection = lazy(() =>
  import('./CampusConnectSection').then((module) => ({ default: module.CampusConnectSection }))
);
const HowItWorks = lazy(() =>
  import('./HowItWorks').then((module) => ({ default: module.HowItWorks }))
);
const StatsSection = lazy(() =>
  import('./StatsSection').then((module) => ({ default: module.StatsSection }))
);
const TestimonialsSection = lazy(() =>
  import('./TestimonialsSection').then((module) => ({ default: module.TestimonialsSection }))
);
const CtaBanner = lazy(() =>
  import('./CtaBanner').then((module) => ({ default: module.CtaBanner }))
);

const JOBS_PER_PAGE = 8;

const mapExternalJobToFeaturedJob = (job = {}) => ({
  id: job.id ? `external-${job.id}` : undefined,
  externalId: job.id,
  sourceType: 'external',
  sourceKey: job.source_key || '',
  companyName: job.company_name || 'Verified company',
  companyLogo: job.company_logo || '',
  companyWebsite: job.apply_url || '',
  jobTitle: job.job_title || 'Open Role',
  jobLocation: job.job_location || 'Remote',
  employmentType: job.employment_type || 'Full-time',
  experienceLevel: job.experience_level || '',
  category: job.category || '',
  description: Array.isArray(job.tags) && job.tags.length
    ? job.tags.slice(0, 6).join(', ')
    : 'Verified live-feed role from HHH Jobs external hiring sources.',
  postedAt: job.posted_at || job.created_at || ''
});

const mergeFeaturedJobs = (portalJobs = [], externalJobs = []) => [
  ...portalJobs.map((job) => ({ ...job, sourceType: job.sourceType || 'portal' })),
  ...externalJobs.map(mapExternalJobToFeaturedJob)
];

const includesTerm = (value, keyword) =>
  String(value || '').toLowerCase().includes(String(keyword || '').toLowerCase());

const matchesCategory = (job = {}, category = null) => {
  if (!category) return true;
  const haystack = [
    job.jobTitle,
    job.companyName,
    job.description,
    job.jobLocation,
    job.category,
    Array.isArray(job.skills) ? job.skills.join(' ') : ''
  ].join(' ').toLowerCase();
  return (category.keywords || []).some((keyword) =>
    haystack.includes(String(keyword).toLowerCase())
  );
};

const DeferredSection = ({ children, minHeight = 220, rootMargin = '260px 0px' }) => {
  const sectionRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return undefined;

    const node = sectionRef.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setShouldRender(true);
          observer.disconnect();
        });
      },
      {
        rootMargin,
        threshold: 0.01
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return (
    <div ref={sectionRef} style={shouldRender ? undefined : { minHeight }}>
      {shouldRender ? <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>{children}</Suspense> : null}
    </div>
  );
};

const HomePage = () => {
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    experience: 'Any Experience'
  });
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [reloadSeed, setReloadSeed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      setLoadingJobs(true);
      setJobsError('');

      try {
        const [portalResult, externalResult] = await Promise.allSettled([
          apiFetch('/jobs?page=1&limit=120&status=open'),
          apiFetch(`/external-jobs?page=1&limit=${JOBS_PER_PAGE}`)
        ]);

        const portalResponse = portalResult.status === 'fulfilled' ? portalResult.value : null;
        const externalResponse = externalResult.status === 'fulfilled' ? externalResult.value : null;

        if (!portalResponse?.ok) {
          if (!mounted) return;
          setJobs(fallbackFeaturedJobs);
          setJobsError('');
          setLoadingJobs(false);
          return;
        }

        const portalPayload = await portalResponse.json().catch(() => null);
        const externalPayload = externalResponse?.ok ? await externalResponse.json().catch(() => null) : null;

        if (!mounted) return;
        const portalJobs = portalPayload?.jobs?.length ? portalPayload.jobs : fallbackFeaturedJobs;
        const externalJobs = externalPayload?.data?.jobs || [];
        setJobs(mergeFeaturedJobs(portalJobs, externalJobs));
        setLoadingJobs(false);
      } catch {
        if (!mounted) return;
        setJobs(fallbackFeaturedJobs);
        setJobsError('');
        setLoadingJobs(false);
      }
    };

    loadJobs();
    return () => {
      mounted = false;
    };
  }, [reloadSeed]);

  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!revealNodes.length) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      revealNodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    revealNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const keyword = filters.keyword.trim().toLowerCase();
      const keywordMatch =
        !keyword ||
        includesTerm(job.jobTitle, keyword) ||
        includesTerm(job.companyName, keyword) ||
        includesTerm(job.description, keyword) ||
        (Array.isArray(job.skills) && job.skills.some((skill) => includesTerm(skill, keyword)));

      const locationMatch =
        !filters.location.trim() ||
        includesTerm(job.jobLocation, filters.location);

      const experienceMatch =
        filters.experience === 'Any Experience' ||
        includesTerm(job.experienceLevel, filters.experience.replace('+', ''));

      const categoryMatch = matchesCategory(job, selectedCategory);

      return keywordMatch && locationMatch && experienceMatch && categoryMatch;
    });
  }, [filters, jobs, selectedCategory]);

  const pagedJobs = useMemo(() => {
    return filteredJobs.slice(0, JOBS_PER_PAGE);
  }, [filteredJobs]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const jobsSection = document.getElementById('jobs');
    if (jobsSection) {
      jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategorySelect = (searchTerm, category) => {
    setSelectedCategory(category);
    setFilters((current) => ({ ...current, keyword: searchTerm }));
    const jobsSection = document.getElementById('jobs');
    if (jobsSection) {
      jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBrowseAll = () => {
    setSelectedCategory(null);
    setFilters((current) => ({ ...current, keyword: '' }));
    const jobsSection = document.getElementById('jobs');
    if (jobsSection) jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleKeywordChipClick = (keyword) => {
    setSelectedCategory(null);
    setFilters((current) => ({ ...current, keyword }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-base">
      <div data-reveal style={{ '--jg-reveal-delay': '0ms' }}>
        <HeroSection
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearchSubmit}
          onKeywordChipClick={handleKeywordChipClick}
        />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '90ms' }}>
        <TrustedBySection />
        <CategoryCards
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          onBrowseAll={handleBrowseAll}
        />
        <FeaturedJobs
          jobs={pagedJobs}
          loading={loadingJobs}
          error={jobsError}
          onRefresh={() => setReloadSeed((current) => current + 1)}
        />
      </div>

      <DeferredSection minHeight={340}>
        <SponsoredCompaniesSection />
      </DeferredSection>

      <DeferredSection minHeight={300}>
        <WhyHHHJobs />
      </DeferredSection>

      <DeferredSection minHeight={320}>
        <CampusConnectSection />
      </DeferredSection>

      <DeferredSection minHeight={320}>
        <HowItWorks />
      </DeferredSection>

      <DeferredSection minHeight={260}>
        <StatsSection />
      </DeferredSection>

      <DeferredSection minHeight={340}>
        <TestimonialsSection />
      </DeferredSection>

      <DeferredSection minHeight={260}>
        <CtaBanner />
      </DeferredSection>
    </div>
  );
};

export default HomePage;
