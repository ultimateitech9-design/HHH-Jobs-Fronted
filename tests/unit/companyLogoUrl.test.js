import test from 'node:test';
import assert from 'node:assert/strict';

import { API_BASE_URL } from '../../src/utils/api.js';
import { buildCompanyLogoUrl } from '../../src/modules/common/services/companyLogoUrl.js';

test('buildCompanyLogoUrl proxies public remote logo URLs through the backend', () => {
  assert.equal(
    buildCompanyLogoUrl('https://indiantrademart.com/itm-logo.png'),
    `${API_BASE_URL}/assets/logo?url=${encodeURIComponent('https://indiantrademart.com/itm-logo.png')}`
  );
});

test('buildCompanyLogoUrl preserves already proxied and local-safe sources', () => {
  const proxied = `${API_BASE_URL}/assets/logo?url=${encodeURIComponent('https://cdn.example.com/logo.png')}`;
  assert.equal(buildCompanyLogoUrl(proxied), proxied);
  assert.equal(buildCompanyLogoUrl('/images/company-logo.png'), '/images/company-logo.png');
  assert.equal(buildCompanyLogoUrl('data:image/png;base64,abc123'), 'data:image/png;base64,abc123');
});

test('buildCompanyLogoUrl falls back to the next available candidate', () => {
  assert.equal(
    buildCompanyLogoUrl('', 'https://cdn.example.com/logo.svg'),
    `${API_BASE_URL}/assets/logo?url=${encodeURIComponent('https://cdn.example.com/logo.svg')}`
  );
});

test('buildCompanyLogoUrl ignores broken favicon-service URLs for reserved test hosts', () => {
  assert.equal(
    buildCompanyLogoUrl(
      'https://www.google.com/s2/favicons?sz=256&domain_url=https%3A%2F%2Flocal-e2e-hiring.example.com',
      '',
      'https://local-e2e-hiring.example.com/jobs/1'
    ),
    ''
  );
});
