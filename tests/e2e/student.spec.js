import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9p2H2mQAAAAASUVORK5CYII=',
  'base64'
);
const API_BASE = 'http://127.0.0.1:6001';

test.describe('Student Portal E2E', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://127.0.0.1:4173',
          localStorage: [
            { name: 'job_portal_token', value: 'managed-student-e2e' },
            {
              name: 'job_portal_user',
              value: JSON.stringify({
                id: 'student-e2e',
                role: 'student',
                name: 'Mock Student',
                email: 'student@example.com',
                mobile: '9876543210'
              })
            }
          ]
        }
      ]
    }
  });

  test.beforeEach(async ({ page }) => {
    const state = {
      profile: {
        name: 'Mock Student',
        email: 'student@example.com',
        mobile: '9876543210',
        headline: 'Frontend Intern',
        targetRole: 'Frontend Developer',
        location: 'Pune, India',
        profileSummary: 'Aspiring frontend developer focused on React.',
        technical_skills: ['React'],
        soft_skills: ['Communication'],
        tools_technologies: ['Git'],
        experience: ['Frontend Intern | Demo Co | 2024'],
        projects: ['Placement portal | React | Express'],
        education: [],
        resume_url: '',
        resume_text: '',
        linkedin_url: '',
        github_url: ''
      },
      savedJobs: [
        {
          id: 'saved-1',
          jobId: 'job-1',
          createdAt: '2026-04-07T10:00:00.000Z',
          job: {
            id: 'job-1',
            jobTitle: 'Frontend Developer',
            companyName: 'Tech Co',
            jobLocation: 'Remote',
            experienceLevel: 'Entry',
            status: 'open'
          }
        }
      ],
      applications: []
    };

    await page.route(`${API_BASE}/student/overview`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          overview: {
            profile: state.profile,
            profileCompletion: 72,
            counters: {
              totalApplications: state.applications.length,
              savedJobs: state.savedJobs.length,
              upcomingInterviews: 1,
              unreadNotifications: 0,
              atsChecks: 2
            },
            pipeline: {
              applied: 1,
              shortlisted: 0,
              interviewed: 0,
              offered: 0,
              rejected: 0,
              hired: 0,
              moved: 0
            },
            recommendedJobs: [],
            recentApplications: [],
            upcomingInterviews: [{ id: 'int-1', companyName: 'Tech Co', status: 'scheduled', scheduledAt: '2026-04-09T10:00:00.000Z' }],
            recentNotifications: [],
            nextInterview: null
          }
        })
      });
    });

    await page.route(`${API_BASE}/student/profile/resume-score`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          score: 78,
          maxScore: 100,
          grade: 'Good',
          breakdown: [
            { label: 'Headline', weight: 10, earned: 10, filled: true },
            { label: 'Education', weight: 15, earned: 15, filled: true }
          ],
          tips: ['Add more projects', 'Upload latest resume']
        })
      });
    });

    await page.route(`${API_BASE}/student/profile/import-resume`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          import: {
            source: 'txt',
            warnings: [],
            profileDraft: {
              headline: 'Frontend Developer',
              targetRole: 'Frontend Developer',
              profileSummary: 'Frontend engineer with React and TypeScript projects.',
              technicalSkills: ['React', 'TypeScript', 'JavaScript'],
              softSkills: ['Communication'],
              toolsTechnologies: ['Git', 'Postman'],
              experience: ['Frontend Intern | Product Studio | 2025'],
              projects: ['Campus hiring portal with React and Node.js'],
              educationEntries: [
                {
                  educationLevel: 'Graduation',
                  courseName: 'B.Tech Computer Science',
                  instituteName: 'Demo Institute',
                  universityBoard: 'Demo University',
                  specialization: 'Computer Science',
                  startYear: '2021',
                  endYear: '2025',
                  educationStatus: 'completed',
                  isHighestQualification: true
                }
              ],
              resumeText: 'Imported resume text',
              linkedinUrl: 'https://linkedin.com/in/mockstudent',
              githubUrl: 'https://github.com/mockstudent'
            }
          }
        })
      });
    });

    await page.route(`${API_BASE}/student/upload/resume`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          resumeUrl: 'https://files.example.com/resume.pdf',
          resumeText: 'Imported resume text',
          warnings: []
        })
      });
    });

    await page.route(`${API_BASE}/student/profile`, async (route) => {
      if (route.request().method() === 'PUT') {
        const body = await route.request().postDataJSON();
        state.profile = {
          ...state.profile,
          ...body,
          avatar_url: body.avatarUrl || state.profile.avatar_url || state.profile.avatarUrl || '',
          resume_url: body.resumeUrl || state.profile.resume_url || '',
          resume_text: body.resumeText || state.profile.resume_text || ''
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: true, profile: state.profile })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, profile: state.profile })
      });
    });

    await page.route(`${API_BASE}/student/saved-jobs`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, savedJobs: state.savedJobs })
      });
    });

    await page.route(`${API_BASE}/student/applications`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, applications: state.applications })
      });
    });

    await page.route(`${API_BASE}/student/company-reviews/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, summary: { count: 2, averageRating: 4.2 }, reviews: [{ id: 'r-1', title: 'Good place', rating: 4, review: 'Supportive team' }] })
      });
    });

    await page.route(`${API_BASE}/ats/check/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          atsCheckId: 'ats-1',
          saved: true,
          result: {
            score: 82,
            keywordScore: 80,
            similarityScore: 84,
            formatScore: 79,
            missingKeywords: ['Redux']
          }
        })
      });
    });

    await page.route(`${API_BASE}/jobs**`, async (route) => {
      const url = new URL(route.request().url());
      const { pathname } = url;

      if (route.request().method() === 'POST' && pathname.endsWith('/apply')) {
        state.applications.push({ id: 'app-1', jobId: 'job-1' });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: true, application: { id: 'app-1', jobId: 'job-1' } })
        });
        return;
      }

      if (pathname.endsWith('/jobs/job-1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: true,
            job: {
              id: 'job-1',
              jobTitle: 'Frontend Developer',
              companyName: 'Tech Co',
              companyLogo: '',
              jobLocation: 'Remote',
              experienceLevel: 'Entry',
              employmentType: 'Full-time',
              minPrice: 400000,
              maxPrice: 700000,
              salaryType: 'yearly',
              skills: ['React', 'TypeScript'],
              status: 'open',
              description: 'Build product experiences for students.'
            }
          })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          jobs: [
            {
              id: 'job-1',
              jobTitle: 'Frontend Developer',
              companyName: 'Tech Co',
              companyLogo: '',
              jobLocation: 'Remote',
              experienceLevel: 'Entry',
              employmentType: 'Full-time',
              minPrice: 400000,
              maxPrice: 700000,
              salaryType: 'yearly',
              skills: ['React', 'TypeScript'],
              status: 'open'
            }
          ],
          pagination: { page: 1, limit: 8, total: 1, totalPages: 1 }
        })
      });
    });
  });

  test('dashboard loads current student overview', async ({ page }) => {
    await page.goto('/portal/student/dashboard');
    await expect(page.getByText('Student Dashboard', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /welcome back, mock student/i })).toBeVisible();
    await expect(page.getByText('Frontend Developer').first()).toBeVisible();
  });

  test('dashboard resume card imports and saves profile-ready resume data', async ({ page }) => {
    await page.goto('/portal/student/dashboard');
    await expect(page.getByRole('heading', { name: /turn resume into profile data/i })).toBeVisible();

    const profileSave = page.waitForResponse((response) => response.url() === `${API_BASE}/student/profile` && response.request().method() === 'PUT');
    await page.getByTestId('student-dashboard-resume-input').setInputFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Mock Student\nFrontend Developer\nstudent@example.com\nSKILLS\nReact, TypeScript\nEDUCATION\nB.Tech Computer Science | Demo Institute | Demo University | 2021 | 2025', 'utf8')
    });
    await profileSave;

    await expect(page.getByText(/resume imported and profile updated/i)).toBeVisible();
    await expect(page.getByText(/updated .*education entries/i)).toBeVisible();
  });

  test('profile supports avatar upload, resume import, education add, and save', async ({ page }) => {
    await page.goto('/portal/student/profile?section=resume');
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();

    const avatarUpdate = page.waitForResponse(`${API_BASE}/student/profile`);
    await page.getByTestId('student-avatar-input').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: tinyPng
    });
    await avatarUpdate;

    await expect(page.getByRole('button', { name: /upload resume/i })).toBeVisible();
    await page.getByLabel('Resume Text').fill('Mock Student\nFrontend Developer\nstudent@example.com\nSkills\nReact, TypeScript');
    const resumeImport = page.waitForResponse(`${API_BASE}/student/profile/import-resume`);
    const importedProfileSave = page.waitForResponse((response) => response.url() === `${API_BASE}/student/profile` && response.request().method() === 'PUT');
    await page.getByRole('button', { name: /import from text/i }).click();
    await resumeImport;
    await importedProfileSave;
    await expect(page.getByText('Resume ready', { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel('Resume Text')).toHaveValue('Imported resume text');
    await expect(page.getByText(/saved .*education entries to profile/i)).toBeVisible();

    await page.getByRole('button', { name: 'Education' }).click();
    await expect(page.locator('input[placeholder="B.Tech Computer Science"]').first()).toHaveValue('B.Tech Computer Science');
    await page.getByRole('button', { name: /add education/i }).click();
    await page.locator('input[placeholder="B.Tech Computer Science"]').nth(1).fill('MBA');
    await page.locator('input[placeholder="Institute name"]').nth(1).fill('Demo Business School');
    await page.locator('input[placeholder="2021"]').nth(1).fill('2026');
    await page.locator('input[placeholder="2025"]').nth(1).fill('2028');

    const profileSave = page.waitForResponse(`${API_BASE}/student/profile`);
    await page.getByTestId('student-profile-save').click();
    await profileSave;
    await expect(page.getByText(/profile saved successfully/i)).toBeVisible();
  });

  test('jobs apply failure points students to resume section', async ({ page }) => {
    await page.route(`${API_BASE}/jobs**`, async (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === 'POST' && url.pathname.endsWith('/apply')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ status: false, message: 'Resume is required. Upload profile resume or provide new resume content.' })
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/portal/student/jobs');
    await page.getByRole('button', { name: 'Apply Now' }).click();

    await expect(page.getByText(/profile resume missing/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open resume section/i })).toBeVisible();
  });

  test('jobs list apply works and job details ATS check renders score', async ({ page }) => {
    await page.goto('/portal/student/jobs');
    await expect(page.getByRole('heading', { name: /search and apply jobs/i })).toBeVisible();
    await page.getByRole('button', { name: 'Apply Now' }).click();
    await expect(page.getByText(/application submitted successfully/i)).toBeVisible();

    await page.getByRole('link', { name: /view details/i }).click();
    await expect(page).toHaveURL(/\/portal\/student\/jobs\/job-1$/);
    await page.getByRole('button', { name: /ats check/i }).click();
    await expect(page.getByText('Resume Match Score')).toBeVisible();
    await expect(page.getByText('82')).toBeVisible();
  });
});
