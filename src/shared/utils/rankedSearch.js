import { matchSorter } from 'match-sorter';

const normalizeSearchText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/gi, ' ')
  .trim();

const resolveValue = (item, key) => {
  if (typeof key === 'function') {
    return key(item);
  }

  if (typeof key !== 'string' || !key) {
    return '';
  }

  return key.split('.').reduce((current, segment) => current?.[segment], item);
};

export const buildSearchText = (item, keys = []) => normalizeSearchText(
  keys
    .map((key) => resolveValue(item, key))
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value) => value !== null && value !== undefined && value !== '')
    .join(' ')
);

export const rankedSearch = (items = [], query = '', keys = [], options = {}) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return items;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const threshold = options.threshold ?? matchSorter.rankings.CONTAINS;

  const enrichedItems = items.map((item) => ({
    item,
    searchText: buildSearchText(item, keys)
  }));

  const tokenMatchedItems = enrichedItems.filter(({ searchText }) => tokens.every((token) => searchText.includes(token)));
  const candidateItems = tokenMatchedItems.length > 0 ? tokenMatchedItems : enrichedItems;

  return matchSorter(candidateItems, normalizedQuery, {
    keys: ['searchText'],
    threshold,
    keepDiacritics: false,
    ...options
  }).map(({ item }) => item);
};

export default rankedSearch;
