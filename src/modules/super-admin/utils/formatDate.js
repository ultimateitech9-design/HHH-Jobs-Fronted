const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeMeridiem = (value = '') => value.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());

export const formatDate = (value) => {
  const date = toValidDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

export const formatDateTime = (value) => {
  const date = toValidDate(value);
  if (!date) return '-';
  return normalizeMeridiem(new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date));
};
