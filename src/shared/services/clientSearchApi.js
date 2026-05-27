import { apiFetch } from '../../utils/api';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

const normalizeSearchResult = (result = {}) => ({
  id: result.id || '',
  type: result.type || '',
  name: result.name || '-',
  company: result.company || '',
  email: result.email || '',
  phone: result.phone || '',
  role: result.role || '',
  state: result.state || '',
  location: result.location || '',
  owner: result.owner || '',
  status: result.status || '',
  source: result.source || '',
  updatedAt: result.updatedAt || result.updated_at || null
});

export const searchClients = async (filters = {}) => {
  const queryString = buildQueryString({
    search: filters.search || filters.q || '',
    role: filters.role || '',
    state: filters.state || '',
    limit: filters.limit || 30
  });

  try {
    const response = await apiFetch(`/ops/client-search${queryString ? `?${queryString}` : ''}`);
    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || `Request failed with status ${response.status}`);
    }

    const results = Array.isArray(payload?.results) ? payload.results : [];

    return {
      data: {
        results: results.map(normalizeSearchResult),
        total: Number(payload?.total || results.length)
      },
      error: ''
    };
  } catch (error) {
    return {
      data: { results: [], total: 0 },
      error: error.message || 'Unable to search clients.'
    };
  }
};
