# HHH Jobs Frontend

HHH Jobs Frontend is a multi-role React application for a job marketplace and internal operations platform. It combines a public website, authentication flows, and role-based dashboards for students, HR, admin, super admin, support, sales, accounts, audit, platform operations, and data entry teams.

## Project Summary

| Area | Details |
|---|---|
| App type | Single-page application (SPA) |
| Core stack | React 18, Vite, React Router, Tailwind CSS, Zustand |
| Entry shell | `src/app/AppShell.jsx` |
| Routing | `src/routes/index.jsx` with lazy-loaded role modules |
| Auth model | Bearer token session with route guards and role guards |
| API access | `src/utils/api.js` via `VITE_API_BASE_URL` |
| Deployment target | Netlify SPA build (`netlify.toml`) |
| Test coverage in repo | Playwright E2E smoke tests for login and major dashboards |

## Quick Start

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Start dev server | `npm run dev` |
| Build production bundle | `npm run build` |
| Run E2E tests | `npm run test:e2e` |
| Open Playwright report | `npm run test:e2e:report` |

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL for the backend REST API |
| `VITE_DEPLOYED_API_BASE_URL` | Optional deployed backend fallback URL |
| `VITE_GETSTREAM_API_KEY` | Optional GetStream key for realtime/video features |

## Dashboards And Features

| Dashboard / Area | Route Prefix | Role Access | Main Features | Integration Notes |
|---|---|---|---|---|
| Public website | `/` | Public | Home page, ATS landing, services, employee verification, retired employee page, blog, careers, contact, help, legal and trust pages | Mostly frontend content with selected API-backed flows |
| Login and auth | `/login`, `/sign-up`, `/verify-otp`, `/forgot-password`, `/oauth/callback` | Public | Email/password login, signup, OTP verification, forgot password, Google and LinkedIn redirect login | Backend auth is supported; local managed/demo fallbacks also exist in frontend utilities |
| Management portal selector | `/management` | Internal entry point | Launch links for admin, super admin, support, sales, data entry, and accounts portal login | Frontend-only routing helper |
| Student dashboard | `/portal/student` | `student`, `retired_employee` | Dashboard, profile and resume builder, jobs list, job details, applications, saved jobs, alerts, interviews, analytics, ATS history/checks, notifications, company reviews | API-backed through `src/modules/student/services/studentApi.js` |
| Retired employee jobs flow | `/portal/retired` | `retired_employee` | Dedicated retired employee route for jobs and job details | Reuses student job experience |
| HR dashboard | `/portal/hr` | `hr` | Dashboard, HR profile, jobs CRUD, applicants per job, candidate search, interviews, analytics, ATS tools, notifications, pricing, quote, checkout, credits | API-backed through `src/modules/hr/services/hrApi.js` |
| Admin dashboard | `/portal/admin` | `admin` | Dashboard, users, jobs moderation, reports, applications, master data, payments, audit logs, settings, control center | Mixed live API integration plus some frontend-managed behavior |
| Super admin dashboard | `/portal/super-admin` | `super_admin` | Dashboard, users, companies, jobs, applications, payments, subscriptions, reports, support tickets, system logs, roles and permissions, system settings | API-backed through `src/modules/super-admin/services/*` |
| Data entry dashboard | `/portal/dataentry` | `dataentry` | Dashboard, add job, records, manage entries, drafts, pending, approved, rejected, notifications, profile | API-backed through `src/modules/dataentry/services/dataentryApi.js` |
| Accounts dashboard | `/portal/accounts` | `accounts` | Overview, transactions, invoices, subscriptions, expenses, payouts, refunds, reports, payment settings | API-backed through `src/modules/accounts-dashboard/services/*` |
| Sales dashboard | `/portal/sales` | `sales` | Overview, orders, order details, leads, lead details, customers, customer details, team, products, coupons, refunds, reports | API-backed through `src/modules/sales-dashboard/services/*` |
| Support dashboard | `/portal/support` | `support` | Dashboard, tickets, ticket details, create ticket, live chat, FAQ, complaints, feedback, knowledge base, reports | API-backed through `src/modules/support/services/*` |
| Audit dashboard | `/portal/audit` | `audit` | Dashboard, audit events, alerts, logs | API-backed through `src/modules/audit/services/auditApi.js` |
| Platform operations dashboard | `/portal/platform` | `platform` | Dashboard, tenants, billing, customization, integrations, security, support, operations | Frontend service layer exists; full backend support depends on server implementation |

## Frontend Structure

| Folder | Responsibility |
|---|---|
| `src/app` | App shell and router export |
| `src/routes` | Route groups split by role and area |
| `src/modules` | Feature modules with pages, services, components, hooks, data |
| `src/components` | Shared top-level UI and route guards |
| `src/core/auth` | Global auth store |
| `src/shared` | Reusable layout, tables, cards, UI helpers |
| `src/utils` | Auth helpers, API wrapper, chatbot knowledge, local demo utilities |
| `tests/e2e` | Playwright smoke tests |
| `docs` | Supporting technical documentation |

## System Design Audit

| Topic | Audit Note |
|---|---|
| Module design | Good separation by business domain; most features live under `src/modules/<module>` with local pages and services |
| UI composition | Shared shell, shared components, and route-level lazy loading keep the app organized |
| State strategy | Simple and workable; Zustand is used mainly for auth, while feature data is fetched per page |
| Design risk | There is no shared server-state cache layer such as React Query, so repeated fetch logic and refresh behavior are handled ad hoc |
| Demo behavior | Managed users and local signup fallback make demos easier, but they should be treated as non-production behavior |

## System Architecture Audit

| Layer | Current Implementation |
|---|---|
| Client | React SPA rendered from `src/main.jsx` |
| Navigation | React Router with suspense-wrapped lazy routes |
| Session | Token and user persisted in browser storage and mirrored into Zustand |
| Data access | `apiFetch` normalizes base URL, injects bearer token, and clears session on `401` |
| Backend dependency | This frontend expects a separate REST backend configured through `VITE_API_BASE_URL` |
| QA path | Playwright runs smoke tests against a local Vite server on `http://127.0.0.1:4173` |

## System Administrator Audit

| Area | Current Coverage |
|---|---|
| Administrative workspaces | Admin, super admin, platform, accounts, support, sales, and data entry portals are all exposed through dedicated route groups |
| Operations controls | Super admin has system logs, roles and permissions, and system settings screens; platform portal covers tenants and operations |
| Deployment config | Netlify build and SPA redirects are configured in `netlify.toml` |
| Operational gap | No CI/CD workflow or environment promotion setup is documented in this repo |
| Operational gap | No explicit frontend health dashboard, release gating, or feature flag layer is visible here |

## System Security Audit

| Control / Risk | Current State |
|---|---|
| Route protection | `ProtectedRoute` and `RoleProtectedRoute` enforce authentication and role access |
| Session recovery | `apiFetch` clears auth state on `401`, and auth state is synced across tabs |
| Social auth | OAuth redirect entry points are present for Google and LinkedIn |
| Security risk | Tokens are stored in `localStorage`, so any XSS issue would expose the session |
| Security risk | Demo auth data and managed accounts are browser-stored; production use should depend on backend-authenticated sessions only |
| Security risk | `netlify.toml` currently defines redirects only; no CSP or security headers are configured in this frontend repo |

## Data Administrator Audit

| Area | Current Coverage |
|---|---|
| Master data | Admin screens manage categories, locations, states, districts, tehsils, villages, pincodes, industries, and skills |
| Operational data | Jobs, applications, payments, subscriptions, tickets, leads, and companies are represented in role-based dashboards |
| Audit data | Audit and admin modules expose logs, alerts, reports, and compliance-style review flows |
| Data workflow | Data entry module supports draft, pending, approved, and rejected entry states |
| Data risk | Some deletion and managed-user tracking logic exists in browser storage, which is not authoritative data governance |

## Audit Summary

| Domain | Status | Short Conclusion |
|---|---|---|
| System design | Good | Modular and maintainable for a large role-based SPA |
| System architecture | Good with dependency risk | Clear frontend layering, but strongly dependent on external backend contracts |
| System administrator | Moderate | Good admin surface area, limited repo-level ops automation |
| System security | Moderate risk | Route security is present, but browser-stored tokens and demo auth paths need stricter production handling |
| Data administration | Moderate | Strong business coverage, but authoritative deletion and governance must live on the backend |

## Notes For Handover

| Note | Details |
|---|---|
| Backend coupling | API contracts matter for almost every portal; keep frontend and backend docs aligned |
| Demo utilities | `src/utils/managedUsers.js` and `src/utils/localAuthFallback.js` should be reviewed before production deployment |
| Existing docs | `docs/frontend-backend-map.md` is the best starting point for endpoint mapping |
| Test baseline | Current Playwright smoke tests cover admin, HR, and student login/dashboard flows |
