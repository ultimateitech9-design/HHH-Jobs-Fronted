export const SALARY_NOT_DISCLOSED_LABEL = 'Not disclosed';

const FALSE_VALUES = new Set(['0', 'false', 'hidden', 'no', 'not_disclosed', 'off']);
const TRUE_VALUES = new Set(['1', 'disclosed', 'on', 'true', 'yes']);

export const normalizeSalaryDisclosure = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return Boolean(fallback);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (FALSE_VALUES.has(normalized)) return false;
  if (TRUE_VALUES.has(normalized)) return true;
  return Boolean(fallback);
};

export const isJobSalaryDisclosed = (job = {}) => {
  const source = job && typeof job === 'object' ? job : {};
  return normalizeSalaryDisclosure(
    source.salaryDisclosed ?? source.salary_disclosed,
    true
  );
};
