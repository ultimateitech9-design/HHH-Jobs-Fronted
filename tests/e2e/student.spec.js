import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9p2H2mQAAAAASUVORK5CYII=',
  'base64'
);
const companiesApiPattern = /^https?:\/\/[^/]+\/companies(?:\?.*)?$/i;
const externalJobsApiPattern = /^https?:\/\/[^/]+\/external-jobs(?:\/[^?#]+)?(?:\?.*)?$/i;
const jobsApiPattern = /^https?:\/\/[^/]+\/jobs(?:\/[^?#]+)?(?:\?.*)?$/i;

const matchesPath = (value, path) => {
  try {
    return new URL(value).pathname === path;
  } catch {
    return false;
  }
};

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
                mobile: '9876543210',
                isEmailVerified: true
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
      companies: [
        {
          id: 'company-1',
          slug: 'local-e2e-hiring-labs',
          name: 'Local E2E Hiring Labs',
          headline: 'Verified employer on HHH Jobs',
          description: 'Hiring operations team focused on engineering roles for growing employers.',
          location: 'Lucknow, Uttar Pradesh',
          premium: true,
          portalProfile: true,
          portalJobs: 1,
          liveFeed: false,
          totalJobs: 1,
          categories: ['Engineering', 'Hiring']
        }
      ],
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
          status: 'open',
          description: 'Build product experiences for students.'
        }
      ],
      atsHistory: [],
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

    await page.route(companiesApiPattern, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          companies: state.companies,
          summary: {
            totalCompanies: state.companies.length,
            totalJobs: state.jobs.length
          }
        })
      });
    });

    await page.route('**/student/overview', async (route) => {
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
            upcomingInterviews: [
              {
                id: 'int-1',
                companyName: 'Tech Co',
                status: 'scheduled',
                scheduledAt: '2026-04-09T10:00:00.000Z'
              }
            ],
            recentNotifications: [],
            nextInterview: null
          }
        })
      });
    });

    await page.route('**/student/profile/resume-score', async (route) => {
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

    await page.route('**/student/profile/import-resume', async (route) => {
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

    await page.route('**/student/upload/resume', async (route) => {
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

    await page.route('**/student/profile', async (route) => {
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

    await page.route('**/student/saved-jobs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, savedJobs: state.savedJobs })
      });
    });

    await page.route('**/student/applications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, applications: state.applications })
      });
    });

    await page.route('**/student/company-reviews/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          summary: { count: 2, averageRating: 4.2 },
          reviews: [{ id: 'r-1', title: 'Good place', rating: 4, review: 'Supportive team' }]
        })
      });
    });

    await page.route('**/ats/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, checks: state.atsHistory })
      });
    });

    await page.route('**/ats/check/**', async (route) => {
      state.atsHistory = [
        {
          id: 'ats-1',
          job_id: 'job-1',
          score: 82,
          keyword_score: 80,
          similarity_score: 84,
          format_score: 79,
          created_at: '2026-04-09T10:00:00.000Z'
        }
      ];

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

    await page.route(externalJobsApiPattern, async (route) => {
      const url = new URL(route.request().url());

      if (url.pathname.endsWith('/external-jobs/sources')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: true, data: [] })
        });
        return;
      }

      if (url.pathname.endsWith('/external-jobs/categories')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: true, data: [] })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          data: {
            jobs: [],
            pagination: { page: 1, limit: 8, total: 0, totalPages: 1 }
          }
        })
      });
    });

    await page.route(jobsApiPattern, async (route) => {
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
            job: state.jobs[0]
          })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          jobs: state.jobs,
          pagination: { page: 1, limit: 8, total: 1, totalPages: 1 }
        })
      });
    });
  });

  test('dashboard redirects students to the companies hub', async ({ page }) => {
    await page.goto('/portal/student/dashboard');
    await expect(page).toHaveURL(/\/portal\/student\/companies$/);
    await expect(page.getByRole('heading', { name: /portal companies/i })).toBeVisible();
    await expect(page.getByText('Local E2E Hiring Labs')).toBeVisible();

    await page.getByRole('link', { name: /browse jobs/i }).first().click();
    await expect(page).toHaveURL(/\/portal\/student\/jobs$/);
    await expect(page.getByRole('heading', { name: /search and apply jobs/i })).toBeVisible();
  });

  test('profile resume import saves profile-ready data', async ({ page }) => {
    await page.goto('/portal/student/profile?section=resume');
    await expect(page.getByRole('heading', { name: 'Resume', exact: true })).toBeVisible();

    await page.getByRole('textbox', { name: /resume text/i }).fill(
      'Mock Student\nFrontend Developer\nstudent@example.com\nSkills\nReact, TypeScript'
    );
    const resumeImport = page.waitForResponse((response) => matchesPath(response.url(), '/student/profile/import-resume'));
    const importedProfileSave = page.waitForResponse(
      (response) => matchesPath(response.url(), '/student/profile') && response.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: /import from text/i }).click();
    await resumeImport;
    await importedProfileSave;

    await expect(page.getByText(/resume ready/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: /resume text/i })).toHaveValue('Imported resume text');
    await expect(page.locator('input[placeholder="Course or degree"]').first()).toHaveValue('B.Tech Computer Science');
    await expect(page.getByRole('textbox', { name: /add a recruiter-friendly profile headline/i })).toHaveValue('Frontend Developer');
  });

  test('profile supports avatar upload and education entry edits', async ({ page }) => {
    await page.goto('/portal/student/profile?section=resume');
    await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();

    const avatarUpdate = page.waitForResponse(
      (response) => matchesPath(response.url(), '/student/profile') && response.request().method() === 'PUT'
    );
    await page.getByTestId('student-avatar-input').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: tinyPng
    });
    await avatarUpdate;
    await expect(page.getByRole('button', { name: /preview profile photo/i })).toBeVisible();

    await page.getByRole('button', { name: 'Add education', exact: true }).click();
    await page.locator('input[placeholder="Course or degree"]').nth(1).fill('MBA');
    await page.locator('input[placeholder="Institute name"]').nth(1).fill('Demo Business School');
    await page.locator('input[placeholder="Start year"]').nth(1).fill('2026');
    await page.locator('input[placeholder="End year"]').nth(1).fill('2028');
    await expect(page.locator('input[placeholder="Course or degree"]').nth(1)).toHaveValue('MBA');
    await expect(page.locator('input[placeholder="Institute name"]').nth(1)).toHaveValue('Demo Business School');
  });

  test('jobs apply failure points students to resume section', async ({ page }) => {
    await page.route('**/jobs/**/apply', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: false,
          message: 'Resume is required. Upload profile resume or provide new resume content.'
        })
      });
    });

    await page.goto('/portal/student/jobs');
    await page.getByText('Frontend Developer').first().click();
    await expect(page).toHaveURL(/\/portal\/student\/jobs\/job-1$/);
    await page.getByRole('button', { name: /apply now/i }).click();

    await expect(page.getByText(/profile resume missing/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open resume section/i })).toBeVisible();
  });

  test('jobs list apply works and ATS check renders score', async ({ page }) => {
    await page.goto('/portal/student/jobs');
    await expect(page.getByRole('heading', { name: /search and apply jobs/i })).toBeVisible();
    await page.getByText('Frontend Developer').first().click();
    await expect(page).toHaveURL(/\/portal\/student\/jobs\/job-1$/);
    await page.getByRole('button', { name: /apply now/i }).click();
    await expect(page.getByText(/application submitted successfully/i)).toBeVisible();
    await expect(page.getByText(/applied/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /frontend developer/i })).toBeVisible();

    await page.goto('/portal/student/ats');
    await expect(page.getByRole('heading', { name: /build your ats test/i })).toBeVisible();
    await page.getByRole('button', { name: /run ats check/i }).click();

    await expect(page.getByText(/ats check completed successfully/i)).toBeVisible();
    await expect(page.getByText('82%').first()).toBeVisible();
    await expect(page.getByText('Redux')).toBeVisible();
  });
});
