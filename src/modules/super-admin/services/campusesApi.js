import { adminDummyData } from '../data/adminDummyData';
import { SUPER_ADMIN_BASE, strictRequest } from './usersApi';
import { mapApiCampusToUi } from './mappers';

const CAMPUSES_BATCH_SIZE = 100;

const filterCampuses = (campuses, filters = {}) =>
  campuses.filter((campus) => {
    const search = String(filters.search || '').toLowerCase();
    const matchesSearch = !search || [campus.name, campus.city, campus.state, campus.affiliation, campus.id].some((value) => String(value || '').toLowerCase().includes(search));
    const matchesStatus = !filters.status || campus.status === filters.status;
    return matchesSearch && matchesStatus;
  });

const buildDemoSummary = (campuses) => ({
  totalCampuses: campuses.length,
  activeCampuses: campuses.filter((campus) => campus.status === 'active').length,
  connectedCampuses: campuses.filter((campus) => Number(campus.connectedCompanies || 0) > 0).length,
  totalTalentPool: campuses.reduce((sum, campus) => sum + Number(campus.totalPool || 0), 0),
  placedStudents: campuses.reduce((sum, campus) => sum + Number(campus.placedStudents || 0), 0),
  liveDrives: campuses.reduce((sum, campus) => sum + Number(campus.activeDrives || 0), 0)
});

const fetchCampusesPage = async (page) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(CAMPUSES_BATCH_SIZE)
  });

  return strictRequest({
    path: `${SUPER_ADMIN_BASE}/campuses?${params.toString()}`
  });
};

const fetchAllCampuses = async () => {
  const firstPayload = await fetchCampusesPage(1);
  const firstBatch = Array.isArray(firstPayload?.campuses)
    ? firstPayload.campuses.map(mapApiCampusToUi)
    : [];
  const total = Number(firstPayload?.total || firstBatch.length || 0);
  const summary = firstPayload?.summary || {};

  if (!firstBatch.length || total <= firstBatch.length) {
    return { campuses: firstBatch, summary };
  }

  const totalPages = Math.ceil(total / CAMPUSES_BATCH_SIZE);
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2);
  const remainingResults = await Promise.allSettled(remainingPages.map((page) => fetchCampusesPage(page)));

  const campuses = [...firstBatch];
  remainingResults.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const batch = Array.isArray(result.value?.campuses) ? result.value.campuses.map(mapApiCampusToUi) : [];
    campuses.push(...batch);
  });

  return { campuses, summary };
};

export const getCampuses = async (filters = {}) => {
  try {
    const { campuses, summary } = await fetchAllCampuses();
    return {
      data: filterCampuses(campuses, filters),
      summary,
      error: '',
      isDemo: false
    };
  } catch (error) {
    const demoCampuses = adminDummyData.campuses || [];
    return {
      data: filterCampuses(demoCampuses, filters),
      summary: buildDemoSummary(demoCampuses),
      error: error.message || 'Request failed.',
      isDemo: true
    };
  }
};
