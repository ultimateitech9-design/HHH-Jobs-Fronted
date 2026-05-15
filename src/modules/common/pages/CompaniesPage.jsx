import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiShield
} from 'react-icons/fi';

import useAuthStore from '../../../core/auth/authStore';
import { getCompanyEntryIntent } from '../utils/publicAccess';
import { getPublicCompanies } from '../services/companyDirectoryApi';
import CompanyDirectoryCard from '../components/CompanyDirectoryCard';

const CompaniesPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const [directoryState, setDirectoryState] = useState({
    companies: [],
    summary: null,
    loading: true,
    error: ''
  });
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      setDirectoryState((current) => ({ ...current, loading: true, error: '' }));
      const response = await getPublicCompanies();
      if (!mounted) return;

      setDirectoryState({
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

  const filteredCompanies = useMemo(() => {
    return directoryState.companies.filter((company) => {
      const haystack = [
        company.name,
        company.location,
        company.industry,
        company.companySize,
        ...(company.categories || [])
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
      return matchesSearch;
    });
  }, [directoryState.companies, search]);


  const handleOpenCompany = (company) => {
    const entryIntent = getCompanyEntryIntent({
      companySlug: company.slug,
      isAuthenticated,
      totalJobs: company.totalJobs
    });

    if (!entryIntent?.to) return;
    navigate(entryIntent.to, entryIntent.state ? { state: entryIntent.state } : undefined);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.24),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(14,165,233,0.12),transparent_22%),linear-gradient(180deg,rgba(255,248,235,0.98),rgba(248,250,252,0.72))]" />

      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 px-4 pb-10 pt-4 md:px-6 md:pt-3 lg:px-8">
        <section className="relative -mt-1 overflow-hidden rounded-[32px] border border-slate-800 bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_50%,#0f172a_100%)] px-6 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.4)] md:py-20 lg:px-12 flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-1/4 h-[300px] w-[300px] rounded-full bg-brand-500/20 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-3xl">
            <div className="flex flex-wrap justify-center items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 backdrop-blur-sm">
                Company Directory
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-300 backdrop-blur-sm shadow-sm">
                <FiShield size={12} className="text-emerald-400" />
                Verified Employers
              </span>
            </div>

            <h1 className="mt-6 font-heading text-[2rem] font-black leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem] lg:text-[3.2rem]">
              Discover Premium Employers
            </h1>
            <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate-300 sm:text-[16px]">
              Explore top-tier companies actively hiring on HHH Jobs. Browse through verified employer profiles by industry, location, and category to find your next big career opportunity.
            </p>
          </div>
        </section>

        <section className="relative z-20 -mt-8 mx-auto w-full max-w-3xl rounded-[32px] border border-white/60 bg-white/80 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:-mt-10 md:p-4">
          <div className="relative w-full group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-500" size={22} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search companies, categories, industry, location..."
              className="w-full rounded-full border-2 border-transparent bg-slate-100/80 py-4 pl-14 pr-6 text-[15px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-brand-300 focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,158,11,0.15)] hover:bg-slate-100"
            />
          </div>
        </section>

        {directoryState.error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {directoryState.error}
          </div>
        ) : null}

        {directoryState.loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[32px] border border-slate-200 bg-white/80">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          </div>
        ) : (
          <section className="space-y-6 pt-2">

            {filteredCompanies.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCompanies.map((company) => (
                  <CompanyDirectoryCard
                    key={company.id || company.slug}
                    company={company}
                    onOpenCompany={handleOpenCompany}
                    primaryLabel={isAuthenticated ? 'Open company' : 'Login to Unlock'}
                    secondaryTo="/jobs"
                    secondaryLabel="Browse jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <FiSearch size={28} />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-black text-navy">
                  No listed companies match this search
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Search by company name, city, industry, or category. Try a different keyword.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;
