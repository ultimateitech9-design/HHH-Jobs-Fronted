import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../../../../utils/api';
import { useDeferredMount } from '../../../../shared/hooks/useDeferredMount';

import { HeroSection } from './HeroSection';
import { fallbackFeaturedJobs } from './data/fallbackFeaturedJobs';

const TrustedBySection = lazy(() =>
  import('./TrustedBySection').then((module) => ({ default: module.TrustedBySection }))
);
const CategoryCards = lazy(() =>
  import('./CategoryCards').then((module) => ({ default: module.CategoryCards }))
);
const FeaturedJobs = lazy(() =>
  import('./FeaturedJobs').then((module) => ({ default: module.FeaturedJobs }))
);
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
const HiringFacetsSection = lazy(() =>
  import('./HiringFacetsSection').then((module) => ({ default: module.HiringFacetsSection }))
);

const JOBS_PER_PAGE = 8;
const INITIAL_PORTAL_JOB_LIMIT = 32;

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

const scrollToJobsSection = () => {
  const jobsSection = document.getElementById('jobs');
  if (jobsSection) {
    jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
  const [hiringFacets, setHiringFacets] = useState({
    roles: [],
    sectors: [],
    cities: [],
    totals: { openJobs: 0, companies: 0 }
  });
  const shouldLoadFeaturedJobs = useDeferredMount(true, { delayMs: 700, timeoutMs: 2400 });
  const shouldLoadHiringFacets = useDeferredMount(true, { delayMs: 1100, timeoutMs: 3200 });

  useEffect(() => {
    if (!shouldLoadFeaturedJobs) return undefined;

    let mounted = true;

    const loadJobs = async () => {
      setLoadingJobs(true);
      setJobsError('');

      try {
        const [portalResult, externalResult] = await Promise.allSettled([
          apiFetch(`/jobs?page=1&limit=${INITIAL_PORTAL_JOB_LIMIT}&status=open`),
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
  }, [reloadSeed, shouldLoadFeaturedJobs]);

  useEffect(() => {
    if (!shouldLoadHiringFacets) return undefined;

    let mounted = true;

    const loadHiringFacets = async () => {
      try {
        const response = await apiFetch('/jobs/meta/homepage-facets?roleLimit=650&sectorLimit=120&cityLimit=650');
        const payload = response.ok ? await response.json().catch(() => null) : null;
        if (!mounted || !payload?.status) return;

        setHiringFacets({
          roles: payload.roles || [],
          sectors: payload.sectors || [],
          cities: payload.cities || [],
          totals: payload.totals || { openJobs: 0, companies: 0 }
        });
      } catch {
        if (!mounted) return;
        setHiringFacets((current) => current);
      }
    };

    loadHiringFacets();

    return () => {
      mounted = false;
    };
  }, [reloadSeed, shouldLoadHiringFacets]);

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
  const hasHiringFacets = Boolean(
    hiringFacets.roles.length || hiringFacets.sectors.length || hiringFacets.cities.length
  );

  const handleFiltersChange = (nextFilters) => {
    if (
      selectedCategory
      && (
        nextFilters.keyword !== filters.keyword
        || nextFilters.location !== filters.location
        || nextFilters.experience !== filters.experience
      )
    ) {
      setSelectedCategory(null);
    }

    setFilters(nextFilters);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    scrollToJobsSection();
  };

  const handleCategorySelect = (_searchTerm, category) => {
    setSelectedCategory(category);
    setFilters((current) => ({ ...current, keyword: '' }));
    scrollToJobsSection();
  };

  const handleBrowseAll = () => {
    setSelectedCategory(null);
    setFilters((current) => ({ ...current, keyword: '' }));
    scrollToJobsSection();
  };

  const handleKeywordChipClick = (keyword) => {
    setSelectedCategory(null);
    setFilters((current) => ({ ...current, keyword }));
    scrollToJobsSection();
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-base">
      <div>
        <HeroSection
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearchSubmit}
          onKeywordChipClick={handleKeywordChipClick}
        />
      </div>

      <DeferredSection minHeight={120} rootMargin="120px 0px">
        <TrustedBySection />
      </DeferredSection>

      <DeferredSection minHeight={540} rootMargin="180px 0px">
        <CategoryCards
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          onBrowseAll={handleBrowseAll}
        />
      </DeferredSection>

      <DeferredSection minHeight={360} rootMargin="220px 0px">
        <FeaturedJobs
          jobs={pagedJobs}
          loading={loadingJobs}
          error={jobsError}
          onRefresh={() => setReloadSeed((current) => current + 1)}
        />
      </DeferredSection>

      {hasHiringFacets ? (
        <DeferredSection minHeight={300}>
          <HiringFacetsSection facets={hiringFacets} />
        </DeferredSection>
      ) : null}

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
