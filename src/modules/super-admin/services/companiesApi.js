import { adminDummyData } from '../data/adminDummyData';
import { SUPER_ADMIN_BASE, strictRequest } from './usersApi';
import { mapApiCompanyToUi } from './mappers';

const COMPANIES_BATCH_SIZE = 100;

const filterCompanies = (companies, filters = {}) =>
  companies.filter((company) => {
    const search = String(filters.search || '').toLowerCase();
    const matchesSearch = !search || [company.name, company.plan, company.owner, company.id].some((value) => String(value || '').toLowerCase().includes(search));
    const matchesStatus = !filters.status || company.status === filters.status;
    return matchesSearch && matchesStatus;
  });

const fetchCompaniesPage = async (page) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(COMPANIES_BATCH_SIZE)
  });

  return strictRequest({
    path: `${SUPER_ADMIN_BASE}/companies?${params.toString()}`
  });
};

const fetchAllCompanies = async () => {
  const firstPayload = await fetchCompaniesPage(1);
  const firstBatch = Array.isArray(firstPayload?.companies)
    ? firstPayload.companies.map(mapApiCompanyToUi)
    : [];
  const total = Number(firstPayload?.total || firstBatch.length || 0);

  if (!firstBatch.length || total <= firstBatch.length) {
    return firstBatch;
  }

  const totalPages = Math.ceil(total / COMPANIES_BATCH_SIZE);
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2);
  const remainingResults = await Promise.allSettled(remainingPages.map((page) => fetchCompaniesPage(page)));

  const companies = [...firstBatch];
  remainingResults.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const batch = Array.isArray(result.value?.companies) ? result.value.companies.map(mapApiCompanyToUi) : [];
    companies.push(...batch);
  });

  return companies;
};

export const getCompanies = async (filters = {}) => {
  try {
    const companies = await fetchAllCompanies();
    return {
      data: filterCompanies(companies, filters),
      error: '',
      isDemo: false
    };
  } catch (error) {
    return {
      data: filterCompanies(adminDummyData.companies, filters),
      error: error.message || 'Request failed.',
      isDemo: true
    };
  }
};
