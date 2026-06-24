const SQL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/;
const TIMEZONE_SUFFIX_PATTERN = /(z|[+-]\d{2}:?\d{2})$/i;

export const parseAppDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value || '').trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const numericDate = new Date(Number(raw));
    return Number.isNaN(numericDate.getTime()) ? null : numericDate;
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const timestamp = SQL_DATE_TIME_PATTERN.test(raw) && !TIMEZONE_SUFFIX_PATTERN.test(raw)
    ? `${normalized}Z`
    : normalized;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeMeridiem = (value = '') => value.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());

export const formatDate = (value, {
  locale = 'en-IN',
  timeZone = 'Asia/Kolkata'
} = {}) => {
  const date = parseAppDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone
  }).format(date);
};

export const formatDateTime = (value, {
  locale = 'en-IN',
  timeZone = 'Asia/Kolkata'
} = {}) => {
  const date = parseAppDate(value);
  if (!date) return '-';
  return normalizeMeridiem(new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone
  }).format(date));
};

export const formatDateTimeParts = (value, {
  locale = 'en-IN',
  timeZone = 'Asia/Kolkata',
  timeZoneLabel = 'IST'
} = {}) => {
  const date = parseAppDate(value);
  if (!date) return null;

  const dateText = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone
  }).format(date);

  const timeText = normalizeMeridiem(new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone
  }).format(date));

  return {
    dateText,
    timeText: timeZoneLabel ? `${timeText} ${timeZoneLabel}` : timeText,
    iso: date.toISOString()
  };
};
