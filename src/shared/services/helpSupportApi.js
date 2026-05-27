import { apiFetch } from '../../utils/api';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const submitHelpSupportQuery = async (payload = {}) => {
  const response = await apiFetch('/support/queries', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const body = await parseJson(response);

  if (!response.ok || body?.status === false) {
    throw new Error(body?.message || 'Unable to submit support query.');
  }

  return body?.ticket || null;
};

export const getMyHelpSupportQueries = async () => {
  const response = await apiFetch('/support/queries');
  const body = await parseJson(response);

  if (!response.ok || body?.status === false) {
    throw new Error(body?.message || 'Unable to load support queries.');
  }

  return body?.tickets || [];
};
