import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../../utils/api';
import './HomePage.css';

import { HeroSection } from './HeroSection';
import { TrustedBySection } from './TrustedBySection';
import { CategoryCards } from './CategoryCards';
import { FeaturedJobs } from './FeaturedJobs';
import { SponsoredCompaniesSection } from './SponsoredCompaniesSection';
import { WhyHHHJobs } from './WhyHHHJobs';
import { CampusConnectSection } from './CampusConnectSection';
import { HowItWorks } from './HowItWorks';
import { StatsSection } from './StatsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { CtaBanner } from './CtaBanner';
import { fallbackFeaturedJobs } from './data/fallbackFeaturedJobs';

const JOBS_PER_PAGE = 6;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      setLoadingJobs(true);
      setJobsError('');

      try {
        const response = await apiFetch('/jobs?page=1&limit=120&status=open');
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          if (!mounted) return;
          setJobs(fallbackFeaturedJobs);
          setJobsError('');
          setLoadingJobs(false);
          return;
        }

        if (!mounted) return;
        setJobs(payload?.jobs?.length ? payload.jobs : fallbackFeaturedJobs);
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

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));

  const pagedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const pagination = useMemo(() => {
    const pages = [];
    const maxSlots = 5;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pageCount, start + maxSlots - 1);
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [currentPage, pageCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.keyword, filters.location, filters.experience]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    const jobsSection = document.getElementById('jobs');
    if (jobsSection) {
      jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategorySelect = (searchTerm, category) => {
    setSelectedCategory(category);
    setFilters((current) => ({ ...current, keyword: searchTerm }));
    setCurrentPage(1);
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
          currentPage={currentPage}
          totalPages={pageCount}
          pagination={pagination}
          onPageChange={setCurrentPage}
          onRefresh={() => setReloadSeed((current) => current + 1)}
        />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '110ms' }}>
        <SponsoredCompaniesSection />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '120ms' }}>
        <WhyHHHJobs />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '140ms' }}>
        <CampusConnectSection />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '160ms' }}>
        <HowItWorks />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '180ms' }}>
        <StatsSection />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '220ms' }}>
        <TestimonialsSection />
      </div>

      <div data-reveal style={{ '--jg-reveal-delay': '300ms' }}>
        <CtaBanner />
      </div>
    </div>
  );
};

export default HomePage;
