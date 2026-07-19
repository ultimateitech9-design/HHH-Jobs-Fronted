import { expect, test } from '@playwright/test';

const expectNoHorizontalOverflow = async (page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
};

test('home hero film and story chapters stay interactive on desktop', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'load' });

  await expect(page.getByRole('heading', { name: /ambition meets the right opportunity/i })).toBeVisible();
  const hero = page.locator('.home-film-hero');
  await expect(hero.getByText('36', { exact: true })).toBeVisible();
  await expect(hero.getByText('States & UTs', { exact: true })).toBeVisible();
  await expect(hero.getByText('650', { exact: true })).toBeVisible();
  await expect(hero.getByText('Career categories', { exact: true })).toBeVisible();
  await expect(hero.getByText('5K', { exact: true })).toBeVisible();
  await expect(hero.getByText('Cities covered', { exact: true })).toBeVisible();
  const heroVideo = page.locator('.home-film-hero__video');
  await expect(heroVideo).toHaveCount(1, { timeout: 7000 });
  await expect.poll(() => heroVideo.evaluate((video) => video.readyState), { timeout: 10_000 }).toBeGreaterThanOrEqual(2);

  const playbackButton = page.getByRole('button', { name: /pause hero film/i });
  await expect(playbackButton).toBeVisible();
  await playbackButton.click();
  await expect.poll(() => heroVideo.evaluate((video) => video.paused)).toBe(true);

  await page.locator('.home-connection-rail').evaluate((rail) => {
    window.scrollTo({ top: rail.offsetTop + rail.offsetHeight + 240, behavior: 'instant' });
  });
  const story = page.locator('.home-story-experience');
  await expect(story).toHaveCount(1, { timeout: 10_000 });
  await story.scrollIntoViewIfNeeded();
  await expect(story.getByRole('heading', { name: /one journey. every side of hiring connected/i })).toBeVisible();
  await expect(story.locator('.home-story-chapter')).toHaveCount(4);
  await expectNoHorizontalOverflow(page);

  if (process.env.CAPTURE_HOME_VISUALS === '1') {
    await page.screenshot({ path: testInfo.outputPath('story-desktop.png') });
  }
});

test('deferred platform coverage stays static and readable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const platformStats = page.locator('.home-platform-stats');
  for (let step = 0; step < 20 && (await platformStats.count()) === 0; step += 1) {
    await page.evaluate(() => window.scrollBy({ top: Math.max(window.innerHeight * 0.85, 480), behavior: 'instant' }));
    await page.waitForTimeout(120);
  }

  await expect(platformStats).toHaveCount(1);
  await platformStats.scrollIntoViewIfNeeded();
  await expect(platformStats.getByText('36', { exact: true })).toBeVisible();
  await expect(platformStats.getByText('783', { exact: true })).toBeVisible();
  await expect(platformStats.getByText('650', { exact: true })).toBeVisible();
  await expect(platformStats.getByText('5K', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test.describe('mobile home cinematic experience', () => {
  test.use({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 1 });

  test('keeps hero and story inside the viewport', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /ambition meets the right opportunity/i })).toBeVisible();
    const hero = page.locator('.home-film-hero');
    await expect(hero.getByText('36', { exact: true })).toBeVisible();
    await expect(hero.getByText('650', { exact: true })).toBeVisible();
    await expect(hero.getByText('5K', { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.locator('.home-connection-rail').evaluate((rail) => {
      window.scrollTo({ top: rail.offsetTop + rail.offsetHeight + 240, behavior: 'instant' });
    });
    const story = page.locator('.home-story-experience');
    await expect(story).toHaveCount(1, { timeout: 10_000 });
    await story.scrollIntoViewIfNeeded();
    await expect(story).toBeVisible();
    await expect(story.locator('.home-story-console__frame')).toBeVisible();
    await page.waitForTimeout(500);
    await expectNoHorizontalOverflow(page);

    if (process.env.CAPTURE_HOME_VISUALS === '1') {
      await page.screenshot({ path: testInfo.outputPath('story-mobile.png') });
    }
  });
});
