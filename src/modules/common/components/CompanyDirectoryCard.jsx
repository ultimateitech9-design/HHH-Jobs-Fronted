import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBriefcase,
  FiLayers,
  FiMapPin,
  FiStar
} from 'react-icons/fi';

const primaryActionClassName =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 via-brand-500 to-warning-400 px-3.5 py-2 text-[12px] font-black text-white shadow-[0_12px_22px_rgba(229,155,23,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_28px_rgba(229,155,23,0.24)]';

const secondaryActionClassName =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700';

const getInitials = (name = '') =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CO';

const formatMetaLine = (company = {}) => {
  const parts = [company.industry, company.companySize].filter(Boolean);
  return parts.length > 0 ? parts.join(' • ') : 'Employer profile on HHH Jobs';
};

const getCategoryList = (company = {}) => {
  const categories = Array.isArray(company.categories)
    ? company.categories.filter(Boolean).slice(0, 2)
    : [];

  return categories.length > 0 ? categories : ['General hiring'];
};

const CompanyDirectoryCard = ({
  company,
  onOpenCompany,
  primaryLabel = 'Open company',
  secondaryTo = '/jobs',
  secondaryLabel = 'Browse jobs'
}) => {
  const [logoError, setLogoError] = useState(false);
  const categories = getCategoryList(company);
  const description = company.description || 'Open this company to see its available roles and hiring page.';

  return (
    <article className="flex h-full min-w-0 flex-col rounded-[1rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 shadow-[0_10px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {company.logoUrl && !logoError ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">
              {getInitials(company.name)}
            </div>
          )}

          <div className="min-w-0">
            <h3
              title={company.name}
              className="line-clamp-2 text-base font-bold leading-5 text-navy"
            >
              {company.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-slate-500">
              {company.headline || company.industry || 'Hiring on HHH Jobs'}
            </p>
          </div>
        </div>

        <span className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
          company.premium
            ? 'border border-amber-200 bg-amber-50 text-amber-700'
            : 'border border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <FiStar size={10} />
          {company.premium ? 'Premium' : 'Employer'}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-[0.8rem] border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-sm text-slate-600">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            <FiBriefcase size={11} />
            Open roles
          </p>
          <p className="mt-1 text-lg font-bold text-navy">{Number(company.totalJobs || 0)}</p>
        </div>

        <div className="rounded-[0.8rem] border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-sm text-slate-600">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            <FiMapPin size={11} />
            Location
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-4 text-slate-800">
            {company.location || 'Multi-city hiring'}
          </p>
        </div>
      </div>

      <div className="mt-2.5 rounded-[0.8rem] border border-slate-200 bg-white px-2.5 py-2">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          <FiLayers size={11} />
          Company profile
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-4 text-slate-700">
          {formatMetaLine(company)}
        </p>
      </div>

      <p className="mt-2.5 min-h-10 line-clamp-2 text-[12px] leading-4 text-slate-600">
        {description}
      </p>

      <div className="mt-2.5 flex min-h-7 flex-wrap gap-1.5">
        {categories.map((category) => (
          <span
            key={`${company.id}-${category}`}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          >
            {category}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap">
        <button type="button" className={`${primaryActionClassName} w-full sm:w-auto`} onClick={() => onOpenCompany(company)}>
          {primaryLabel}
          <FiArrowRight size={13} />
        </button>

        {secondaryTo ? (
          <Link to={secondaryTo} className={`${secondaryActionClassName} w-full sm:w-auto`}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
};

export default CompanyDirectoryCard;
