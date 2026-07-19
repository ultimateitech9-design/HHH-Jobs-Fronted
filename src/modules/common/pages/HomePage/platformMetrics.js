export const HOME_PLATFORM_METRICS = Object.freeze([
  { id: 'regions', value: 36, displayValue: '36', label: 'States & UTs' },
  { id: 'districts', value: 783, displayValue: '783', label: 'Districts mapped' },
  { id: 'categories', value: 650, displayValue: '650', label: 'Career categories' },
  { id: 'cities', value: 4897, displayValue: '5K', label: 'Cities covered' }
]);

const HERO_METRIC_IDS = new Set(['regions', 'categories', 'cities']);

export const HOME_HERO_METRICS = Object.freeze(
  HOME_PLATFORM_METRICS.filter((metric) => HERO_METRIC_IDS.has(metric.id))
);
