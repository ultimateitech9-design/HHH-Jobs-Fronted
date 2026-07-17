import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useDeferredMount } from '../../../../shared/hooks/useDeferredMount';

import { HeroSection } from './HeroSection';
import HomeConnectionRail from './HomeConnectionRail';
import './homeCinematic.css';

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
const HowItWorks = lazy(() =>
  import('./HowItWorks').then((module) => ({ default: module.HowItWorks }))
);
const StatsSection = lazy(() =>
  import('./StatsSection').then((module) => ({ default: module.StatsSection }))
);
const CtaBanner = lazy(() =>
  import('./CtaBanner').then((module) => ({ default: module.CtaBanner }))
);
const HiringFacetsSection = lazy(() =>
  import('./HiringFacetsSection').then((module) => ({ default: module.HiringFacetsSection }))
);
const HomeStoryExperience = lazy(() => import('./HomeStoryExperience'));

const JOBS_PER_PAGE = 8;
const INITIAL_PORTAL_JOB_LIMIT = 12;

const mapExternalJobToFeaturedJob = (job = {}) => ({
  id: job.id ? `external-${job.id}` : undefined,
  externalId: job.id,
  sourceType: 'external',
  sourceKey: job.source_key || '',
  companyName: job.company_name || '',
  companyLogo: job.company_logo || '',
  companyWebsite: job.apply_url || '',
  jobTitle: job.job_title || '',
  jobLocation: job.job_location || '',
  employmentType: job.employment_type || '',
  experienceLevel: job.experience_level || '',
  category: job.category || '',
  description: Array.isArray(job.tags) && job.tags.length
    ? job.tags.slice(0, 6).join(', ')
    : '',
  postedAt: job.posted_at || job.created_at || ''
});

const mergeFeaturedJobs = (portalJobs = [], externalJobs = []) => [
  ...portalJobs.map((job) => ({ ...job, sourceType: job.sourceType || 'portal' })),
  ...externalJobs.map(mapExternalJobToFeaturedJob)
];

const includesTerm = (value, keyword) =>
  String(value || '').toLowerCase().includes(String(keyword || '').toLowerCase());

const DeferredSection = ({ children, id, minHeight = 220, rootMargin = '260px 0px' }) => {
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
    <div id={id} ref={sectionRef} className={id ? 'scroll-mt-24' : undefined} style={shouldRender ? undefined : { minHeight }}>
      {shouldRender ? <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>{children}</Suspense> : null}
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    experience: 'Any Experience'
  });
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [reloadSeed, setReloadSeed] = useState(0);
  const [hiringFacets, setHiringFacets] = useState({
    roles: [],
    sectors: [],
    cities: [],
    totals: { openJobs: null, companies: null, roles: null, sectors: null, cities: null }
  });
  const shouldLoadFeaturedJobs = useDeferredMount(true, { delayMs: 2200, timeoutMs: 4500 });
  const shouldLoadHiringFacets = useDeferredMount(true, { delayMs: 5000, timeoutMs: 9000 });

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

        const portalPayload = portalResponse?.ok ? await portalResponse.json().catch(() => null) : null;
        const externalPayload = externalResponse?.ok ? await externalResponse.json().catch(() => null) : null;

        if (!mounted) return;
        const portalJobs = portalPayload?.jobs || [];
        const externalJobs = externalPayload?.data?.jobs || [];
        const nextJobs = mergeFeaturedJobs(portalJobs, externalJobs);
        setJobs(nextJobs);
        setJobsError(nextJobs.length || portalResponse?.ok || externalResponse?.ok
          ? ''
          : 'Unable to load live jobs right now.');
        setLoadingJobs(false);
      } catch {
        if (!mounted) return;
        setJobs([]);
        setJobsError('Unable to load live jobs right now.');
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
        const response = await apiFetch('/jobs/meta/homepage-facets?roleLimit=24&sectorLimit=24&cityLimit=24');
        const payload = response.ok ? await response.json().catch(() => null) : null;
        if (!mounted || !payload?.status) return;

        setHiringFacets({
          roles: payload.roles || [],
          sectors: payload.sectors || [],
          cities: payload.cities || [],
          totals: payload.totals || { openJobs: 0, companies: 0, roles: 0, sectors: 0, cities: 0 }
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

      return keywordMatch && locationMatch && experienceMatch;
    });
  }, [filters, jobs]);

  const pagedJobs = useMemo(() => {
    return filteredJobs.slice(0, JOBS_PER_PAGE);
  }, [filteredJobs]);
  const hasHiringFacets = Boolean(
    hiringFacets.roles.length || hiringFacets.sectors.length || hiringFacets.cities.length
  );

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const keyword = filters.keyword.trim();
    const location = filters.location.trim();
    const experience = filters.experience.trim();

    if (keyword) params.set('search', keyword);
    if (location) params.set('location', location);
    if (experience && experience !== 'Any Experience') params.set('experience', experience);

    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleKeywordChipClick = (keyword) => {
    setFilters((current) => ({ ...current, keyword }));
    const params = new URLSearchParams();
    params.set('search', keyword);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="home-cinematic-page flex min-h-screen flex-col bg-[#f7f8fb]">
      <div>
        <HeroSection
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearchSubmit}
          onKeywordChipClick={handleKeywordChipClick}
          stats={hiringFacets.totals}
        />
      </div>

      <HomeConnectionRail />

      <DeferredSection minHeight={1040} rootMargin="320px 0px">
        <HomeStoryExperience />
      </DeferredSection>

      <DeferredSection id="job-categories" minHeight={540} rootMargin="180px 0px">
        <CategoryCards />
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
        <HowItWorks />
      </DeferredSection>

      <DeferredSection minHeight={260}>
        <StatsSection totals={hiringFacets.totals} />
      </DeferredSection>

      <DeferredSection minHeight={260}>
        <CtaBanner />
      </DeferredSection>

    </div>
  );
};

export default HomePage;
