import { normalizeCompanies } from '../utils/companyContext';

const CompanyChip = ({ children, primary = false }) => (
  <span className={`company-context-chip${primary ? ' company-context-chip--primary' : ''}`} title={children}>
    {children}
  </span>
);

const CompanyContextSummary = ({
  companies = [],
  primaryCompany = '',
  jobCount = 0,
  postingCompanyCount = 0,
  emptyLabel = 'No company linked'
}) => {
  const normalizedCompanies = normalizeCompanies([primaryCompany, ...companies]);
  const primary = normalizedCompanies[0] || emptyLabel;
  const relatedCompanies = normalizedCompanies.slice(1);
  const visibleCompanies = relatedCompanies.slice(0, 2);
  const hiddenCompanies = relatedCompanies.slice(2);
  const normalizedJobCount = Number(jobCount || 0);
  const normalizedPostingCompanyCount = Number(postingCompanyCount || 0);

  return (
    <div className="company-context-summary">
      <strong className="company-context-summary__primary" title={primary}>{primary}</strong>

      {visibleCompanies.length ? (
        <div className="company-context-summary__chips">
          {visibleCompanies.map((company) => <CompanyChip key={company.toLowerCase()}>{company}</CompanyChip>)}
        </div>
      ) : null}

      {hiddenCompanies.length ? (
        <details className="company-context-summary__more">
          <summary>+{hiddenCompanies.length} more</summary>
          <div className="company-context-summary__chips company-context-summary__chips--expanded">
            {hiddenCompanies.map((company) => <CompanyChip key={company.toLowerCase()}>{company}</CompanyChip>)}
          </div>
        </details>
      ) : null}

      <span className={`company-context-summary__meta${normalizedJobCount ? ' company-context-summary__meta--active' : ''}`}>
        {normalizedJobCount
          ? `${normalizedJobCount} job${normalizedJobCount === 1 ? '' : 's'}${normalizedPostingCompanyCount ? ` across ${normalizedPostingCompanyCount} compan${normalizedPostingCompanyCount === 1 ? 'y' : 'ies'}` : ''}`
          : 'No job posts'}
      </span>
    </div>
  );
};

export default CompanyContextSummary;
