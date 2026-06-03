import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCompanySeoPath, buildJobSeoPath } from '../../src/shared/utils/seoRoutes.js';

test('buildJobSeoPath keeps job URLs short and removes repeated SEO words', () => {
  const path = buildJobSeoPath('/jobs', {
    id: '58b268e6-197f-46fb-a146-2d1234567890',
    jobTitle: 'Administrative Executive',
    companyName: 'Ultimate Itech',
    jobLocation: 'Ghitorni, New Delhi',
    seoSlug: 'administrative-executive-ultimate-itech-ghitorni-ghitorni-ghitorni-new-delhi-administrative-executive-ultimate-itech-ghitorni-new-delhi'
  });

  assert.equal(
    path,
    '/jobs/administrative-executive-ultimate-itech-ghitorni-new-delhi'
  );
});

test('buildCompanySeoPath prefers clean canonical company slugs', () => {
  assert.equal(
    buildCompanySeoPath('/companies', {
      slug: 'ultimate-itech-private-limited-limited'
    }),
    '/companies/ultimate-itech-private-limited'
  );
});
