import test from 'node:test';
import assert from 'node:assert/strict';
import { footerSocialLinks } from '../../src/shared/components/layout/publicShell/footer/footerSocialLinks.js';
import { getPublicNavItems } from '../../src/shared/components/layout/publicShell/publicNavigation.js';
import { BLOG_BASE_URL } from '../../src/shared/utils/externalLinks.js';

test('footer quick links avoid placeholder targets', () => {
  assert.equal(footerSocialLinks.some((item) => item.href === '#'), false);
  assert.deepEqual(
    footerSocialLinks.map((item) => item.href),
    ['/contact-us', '/careers', BLOG_BASE_URL, 'mailto:support@hhh-jobs.com']
  );
});

test('public navigation wires the expected core destinations', () => {
  const navItems = getPublicNavItems({
    jobsNavPath: '/jobs'
  });

  const jobsItem = navItems.find((item) => item.key === 'jobs');
  const blogItem = navItems.find((item) => item.key === 'blog');
  const companyItem = navItems.find((item) => item.key === 'companies');
  const forYouItem = navItems.find((item) => item.key === 'for-you');

  assert.equal(jobsItem?.to, '/jobs');
  assert.equal(blogItem?.to, BLOG_BASE_URL);
  assert.equal(companyItem?.to, '/companies');
  assert.equal(forYouItem?.children?.find((item) => item.key === 'for-job-seekers')?.to, '/job-seekers');
  assert.equal(forYouItem?.children?.find((item) => item.key === 'for-recruiters')?.to, '/recruiters');
  assert.equal(forYouItem?.children?.find((item) => item.key === 'for-campus-connect')?.to, '/campus-connect');
});

test('logged-in public navigation sends For You links to the active dashboard', () => {
  const dashboardPath = '/portal/hr/dashboard';
  const navItems = getPublicNavItems({
    jobsNavPath: '/jobs',
    dashboardPath
  });

  const forYouItem = navItems.find((item) => item.key === 'for-you');
  const forYouPaths = forYouItem?.children?.map((item) => item.to);

  assert.deepEqual(forYouPaths, [dashboardPath, dashboardPath, dashboardPath]);
});
