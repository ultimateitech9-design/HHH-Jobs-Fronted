# Frontend ↔ Backend API Map

This document maps active frontend modules to backend APIs and marks integration status.

## Base Configuration

- Frontend API base: `src/utils/api.js`
- Env key: `VITE_API_BASE_URL`
- Default base URL: `http://localhost:5500`
- Auth: `Authorization: Bearer <token>` injected by `apiFetch`

## Module Routing (Frontend)

- Router source: `src/app/router.jsx`
- Main active areas:
  - `/portal/admin/*`
  - `/portal/hr/*`
  - `/portal/student/*`
  - `/portal/audit/*`
  - `/portal/platform/*`

## Auth Module

Frontend pages:
- `src/modules/auth/pages/LoginPage.jsx`
- `src/modules/auth/pages/SignupPage.jsx`
- `src/modules/auth/pages/OtpVerificationPage.jsx`
- `src/modules/auth/pages/ForgotPasswordPage.jsx`

Backend endpoints:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`
- `GET /auth/redirect`

Status: Connected

## Student Module

Frontend service:
- `src/modules/student/services/studentApi.js`

Backend endpoints:
- Profile: `GET /student/profile`, `PUT /student/profile`
- Jobs: `GET /jobs`, `GET /jobs/:id`, `POST /jobs/:id/apply`
- Applications: `GET /student/applications`
- Saved jobs: `GET/POST/DELETE /student/saved-jobs/:jobId`
- Alerts: `GET/POST/PATCH/DELETE /student/alerts`
- Interviews: `GET /student/interviews`
- Analytics: `GET /student/analytics`
- ATS: `POST /ats/check/:jobId`, `GET /ats/history`
- Reviews: `GET /student/company-reviews/:companyName`, `POST /student/company-reviews`
- Notifications: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

Status: Connected

## HR Module

Frontend service:
- `src/modules/hr/services/hrApi.js`

Backend endpoints:
- Profile: `GET /hr/profile`, `PUT /hr/profile`
- Jobs: `GET /hr/jobs`, `POST /hr/jobs`, `PATCH /hr/jobs/:id`, `DELETE /hr/jobs/:id`, `PATCH /hr/jobs/:id/close`
- Applicants: `GET /hr/jobs/:id/applicants`
- Application status: `PATCH /hr/applications/:id/status`
- Candidate search: `GET /hr/candidates/search`
- Interviews: `GET/POST /hr/interviews`, `PATCH /hr/interviews/:id`
- Analytics: `GET /hr/analytics`
- Notifications: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

Pricing endpoints now mapped in HR UI:
- `GET /pricing/plans`
- `POST /pricing/quote`
- `POST /pricing/checkout`
- `GET /pricing/credits`
- `GET /pricing/purchases`

Frontend pages updated:
- `src/modules/hr/pages/HrJobsPage.jsx` (plan select, quote, checkout, credits)
- `src/modules/hr/pages/HrDashboardPage.jsx` (credits KPI)

Status: Connected

## Admin Module

Frontend service:
- `src/modules/admin/services/adminApi.js`

Backend endpoints:
- Analytics: `GET /admin/analytics`
- Users/HR: `GET /admin/users`, `PATCH /admin/users/:id/status`, `PATCH /admin/hr/:id/approve`
- Jobs: `GET /admin/jobs`, `PATCH /admin/jobs/:id/status`, `PATCH /admin/jobs/:id/approval`, `DELETE /admin/jobs/:id`
- Reports: `GET /admin/reports`, `PATCH /admin/reports/:id`
- Applications: `GET /admin/applications`
- Master data: categories, locations, states, districts, tehsils, villages, pincodes, industries, skills (`/admin/*` CRUD)
- Audit logs: `GET /admin/audit-logs`
- Legacy job payments: `GET /admin/payments`, `PATCH /admin/payments/:id`

Pricing admin endpoints now mapped:
- `GET /pricing/admin/plans`
- `PATCH /pricing/plans/:slug`
- `GET /pricing/purchases`
- `PATCH /pricing/purchases/:id/status`
- `POST /pricing/credits/grant`

Frontend pages updated:
- `src/modules/admin/pages/AdminSettingsPage.jsx` (plan configuration editor)
- `src/modules/admin/pages/AdminPaymentsPage.jsx` (purchase reconciliation section)

Status: Connected (except non-pricing settings are still local demo state)

## Audit Module

Frontend service:
- `src/modules/audit/services/auditApi.js`

Backend endpoint used:
- `GET /admin/audit-logs`

Status: Connected

## AI Chatbot

Frontend:
- `src/components/AiChatbot.jsx`

Backend endpoint:
- `POST /ai/chatbot`

Status: Connected

## Platform Module

Frontend service:
- `src/modules/platform/services/platformApi.js`

Backend endpoints:
- Overview: `GET /platform/overview`
- Tenants: `GET/POST /platform/tenants`, `PATCH/DELETE /platform/tenants/:id`
- Plans: `GET/POST /platform/plans`
- Invoices: `GET /platform/invoices`, `PATCH /platform/invoices/:id/status`
- Integrations: `GET /platform/integrations`, `PATCH /platform/integrations/:id`, `POST /platform/integrations/:id/sync`
- Support: `GET /platform/support-tickets`, `PATCH /platform/support-tickets/:id`
- Security: `GET /platform/security-checks`, `PATCH /platform/security-checks/:id`
- Customization: `GET/PUT /platform/customization/:tenantId`

Status: Connected with frontend fallback data when the live backend is unavailable

## Notes

- Active frontend services are module-based under `src/modules/**/services/*Api.js`.
- Some legacy components in `src/components/*` are not part of active router flow.
- Pricing backend schema and logic are defined in server migration and services:
  - `job-portal-server/supabase/migrations/005_job_pricing_engine.sql`
  - `job-portal-server/src/routes/pricing.js`
  - `job-portal-server/src/services/pricing.js`
