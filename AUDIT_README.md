# HHH Jobs — Project Audit & Documentation

**Version:** 1.0 | **Audited:** 2026-03-26 | **Stack:** React 18 + Vite + Tailwind + MySQL backend

---

## What Is This Project?

HHH Jobs is a **multi-role job portal platform** — a full-featured web app where students/job seekers find jobs, HR teams post and track candidates, admins manage the platform, and back-office teams handle finance, sales, support, and compliance. Built as a single-page React application with 13 feature modules and 60+ routes.

---

## Dashboards & Portals — At a Glance

| Portal | URL Prefix | Role | Primary Users |
|---|---|---|---|
| Student Portal | `/portal/student` | `student`, `retired_employee` | Job seekers, veterans |
| HR Portal | `/portal/hr` | `hr` | Recruiters, hiring managers |
| Admin Portal | `/portal/admin` | `admin` | Platform administrators |
| Super Admin Portal | `/portal/super-admin` | `super_admin` | System owners |
| Accounts Dashboard | `/portal/accounts` | `accounts` | Finance team |
| Sales Dashboard | `/portal/sales` | `sales` | Sales team |
| Data Entry Portal | `/portal/dataentry` | `dataentry` | Data operators |
| Audit Portal | `/portal/audit` | `audit` | Compliance team |
| Support Portal | `/portal/support` | `support` | Customer support agents |
| Platform Admin | `/portal/platform` | `platform` | DevOps / platform ops |
| Retired Employee | `/portal/retired` | `retired_employee` | Senior/retired job seekers |
| Public Site | `/` | None | All visitors |

---

## Features by Module (Tabular)

### Public / Common Module

| Feature | Description |
|---|---|
| Homepage | Hero banner, featured jobs, category filters, company logos, pricing |
| Job Search | Category-based discovery, featured listings |
| ATS Landing | Applicant Tracking System info page |
| Employee Verification | Verify employee authenticity |
| Blog | Article listings + individual blog detail pages |
| Help Center | FAQs and support articles |
| Employer Home | Landing for companies wanting to hire |
| Careers | HHH company career listings |
| Contact Us | Contact form |
| Legal Pages | Privacy policy, terms, grievances, fraud alert, trust & safety |
| Sitemap | Full route index |

---

### Student Portal

| Feature | Description |
|---|---|
| Dashboard | Personalized summary — applications, alerts, interviews |
| Profile / Resume Builder | Edit profile, upload resume, build online CV |
| Job Listings | Browse all available jobs with filters |
| Job Details | Full job description + apply button |
| My Applications | Track status of all applied jobs |
| Saved Jobs | Bookmarked jobs for later |
| Job Alerts | Set up keyword/category email alerts |
| Interview Schedule | View upcoming interview slots |
| Application Analytics | Visualize application funnel & stats |
| ATS Integration | Personal ATS tools for resume optimization |
| Notifications | Real-time activity updates |
| Company Reviews | Read/write reviews for employers |

---

### HR Portal

| Feature | Description |
|---|---|
| Dashboard | Hiring activity overview — open jobs, recent applicants |
| Job Management | Create, edit, pause, close job postings |
| Applicants View | Review applicants per job, change status |
| Candidate Pool | Centralized candidate database |
| Interview Scheduling | Schedule & manage interview slots |
| Recruitment Analytics | Pipeline metrics, conversion rates |
| ATS Tools | Resume parsing, shortlisting automation |
| Notifications | Alerts for new applications |
| HR Profile | Manage HR identity and preferences |

---

### Admin Portal

| Feature | Description |
|---|---|
| Dashboard | Platform health overview, key metrics |
| User Management | View, block, approve, delete users |
| Job Moderation | Review and moderate job postings |
| Application Management | Oversee all applications platform-wide |
| Master Data | Manage categories, skills, locations, industries |
| Payment Management | Monitor payments and transactions |
| Audit Logs | View system-level audit events |
| Reports | Generate admin-level reports |
| System Settings | Configure platform-wide settings |
| System Control | Emergency controls, toggles |

---

### Super Admin Portal

| Feature | Description |
|---|---|
| Dashboard | Entire platform health, global KPIs |
| Users Management | Full user CRUD across all roles |
| Companies Management | Manage hiring companies |
| Jobs Management | Full job listing control |
| Applications Management | Global applications oversight |
| Payments Management | Complete payment records |
| Subscriptions Management | Manage plans, tiers, renewals |
| Reports & Analytics | Executive-level reporting |
| Support Tickets | View and route all support tickets |
| System Logs | Infrastructure-level logs |
| Roles & Permissions | RBAC — create/edit roles and permissions |
| System Settings | Global configuration |

---

### Accounts / Finance Dashboard

| Feature | Description |
|---|---|
| Overview | Financial KPIs — revenue, expenses, outstanding |
| Transactions | Full transaction ledger |
| Invoices | Create, send, track invoices |
| Subscriptions | Monitor active subscriptions and renewals |
| Expenses | Log and categorize expenses |
| Payouts | Manage vendor/partner payouts |
| Refunds | Process and track refunds |
| Financial Reports | P&L, revenue trends, custom reports |
| Payment Settings | Configure payment gateways and methods |

---

### Sales Dashboard

| Feature | Description |
|---|---|
| Overview | Sales KPIs — orders, leads, revenue |
| Orders | Manage all sales orders |
| Order Details | Drill-down per order |
| Leads | Lead capture and nurturing pipeline |
| Lead Details | Full lead history |
| Customers | Customer directory |
| Customer Details | Purchase history, communication log |
| Team | Sales team member profiles and performance |
| Products | Product/plan catalog |
| Coupons | Create and manage discount codes |
| Refunds | Sales-side refund management |
| Reports | Sales analytics and trend reports |

---

### Data Entry Portal

| Feature | Description |
|---|---|
| Dashboard | Summary of entry activity |
| Add Job | Manual job listing data entry form |
| Records | All submitted records |
| Manage Entries | Edit and update existing entries |
| Drafts | Save incomplete entries |
| Pending Approval | Entries awaiting review |
| Approved Entries | Published entries |
| Rejected Entries | Entries sent back for correction |
| Notifications | Status change alerts |
| Profile | Data entry operator profile |

---

### Audit Portal

| Feature | Description |
|---|---|
| Dashboard | Audit activity summary |
| Audit Events | Chronological event log |
| Security Alerts | Flag suspicious activity |
| Audit Logs | Filterable, exportable system logs |

---

### Support Portal

| Feature | Description |
|---|---|
| Dashboard | Ticket queue and team metrics |
| Tickets | View and manage support tickets |
| Ticket Details | Full ticket thread and history |
| Create Ticket | Open new support issue |
| Live Chat | Real-time chat with users |
| FAQ | Manage and view FAQ articles |
| Complaints | Formal complaint tracking |
| Feedback | User satisfaction feedback |
| Knowledge Base | Internal articles and SOPs |
| Reports | Support metrics and SLA tracking |

---

### Platform Administration

| Feature | Description |
|---|---|
| Dashboard | Infrastructure health overview |
| Tenants | Multi-tenant management |
| Billing | Platform-level billing configuration |
| Customization | Branding, themes, white-label settings |
| Integrations | Third-party API connectors |
| Security | Security policies and controls |
| Support | Escalated platform-level support |
| Operations | Deployment and ops controls |

---

## Tech Stack Summary

| Category | Technology | Version |
|---|---|---|
| UI Framework | React | 18.2.0 |
| Build Tool | Vite | 7.3.1 |
| Routing | React Router DOM | 6.22.3 |
| State Management | Zustand | 5.0.12 |
| Styling | Tailwind CSS | 3.4.3 |
| Form Handling | React Hook Form | 7.51.5 |
| HTTP Client | Fetch API (custom wrapper) + Axios | Native + 2.0.6 |
| Notifications | React Hot Toast + SweetAlert2 | 2.6.0 + 11.11.1 |
| Icons | React Icons | 5.1.0 |
| SEO | React Helmet Async | 3.0.0 |
| Testing | Playwright (E2E) | 1.58.2 |
| Database / Backend | MySQL backend | Hosted |
| Deployment | Netlify | — |

---

---

# AUDIT REPORT

---

## 1. System Design Audit

### What the design does well

| Area | Assessment |
|---|---|
| Modular architecture | 13 self-contained feature modules — each with its own pages, components, and services. Easy to add/remove features. |
| Role-based routing | Clean separation of route files per role (`studentRoutes.jsx`, `hrRoutes.jsx`, etc.) |
| Lazy loading | Routes use React.lazy() + Suspense — reduces initial bundle size significantly |
| Single responsibility | `apiFetch` wrapper centralizes all API concerns. Auth utilities centralized in `utils/auth.js`. |
| Design system | Tailwind config defines a full design token system — role colors, shadows, z-index, fonts, breakpoints |

### Design Gaps & Recommendations

| Issue | Severity | Recommendation |
|---|---|---|
| No state management for server data | Medium | No React Query / SWR — server state re-fetched on every render, no caching, no background refresh |
| No error boundaries | High | A single component crash can kill the whole app — add React Error Boundaries at module level |
| No loading skeleton strategy | Low | Inconsistent UX during data loads across dashboards |
| No TypeScript | Medium | 335 files with no type safety — prop bugs are silent. Migrate core utilities first. |
| Deleted user tracking via localStorage array | High | `hhh_jobs_deleted_user_ids` in localStorage will break at scale and is not authoritative — move to backend check |
| Chatbot knowledge hardcoded in file | Low | `chatbotKnowledge.js` is static — should be fetched from CMS or backend for dynamic updates |
| Retired routes file exists but unclear purpose | Low | `retiredRoutes.jsx` needs documentation — is it deprecated? |

---

## 2. System Architecture Audit

### Architecture Overview

```
Browser
  └─ React SPA (Vite build, hosted on Netlify)
        ├─ React Router (60+ client-side routes)
        ├─ Zustand (auth state only)
        ├─ apiFetch wrapper → Backend REST API (http://localhost:5500 or production URL)
        └─ MySQL backend (direct JS client for DB / auth)
```

### Architecture Assessment

| Component | Status | Notes |
|---|---|---|
| Frontend | Good | Clean SPA with lazy-loaded routes |
| Backend API | Unknown | Only base URL configured — no backend code in this repo |
| Database | MySQL backend | Fully managed Postgres + auth + storage |
| CDN / Hosting | Netlify | SPA redirect rules via `netlify.toml` needed |
| AI Chatbot | Partial | XAI API key expected server-side — may be proxy endpoint |

### Architecture Risks

| Risk | Severity | Detail |
|---|---|---|
| No backend code in repository | Critical | The backend is a black box — API contracts not documented, no shared types |
| Direct MySQL backend key in frontend | High | Anon key is public, but any misconfigured RLS policies expose data |
| Single API base URL | Medium | No failover, no regional endpoints, no retry logic on network failure |
| No CDN strategy for assets | Low | Static images served from Netlify — no image optimization pipeline |
| No WebSocket / real-time for live chat | Medium | "Live chat" feature has UI but unclear if backed by WebSocket or polling |
| Monolithic CSS file (132KB globals.css) | Medium | Should be split — large CSS slows paint on slow connections |

---

## 3. System Administrator Audit

### Available Admin Controls

| Control | Location | Capability |
|---|---|---|
| User Management | Admin Portal → Users | Block, approve, delete users |
| Job Moderation | Admin Portal → Jobs | Review and moderate listings |
| Master Data | Admin Portal → Master Data | Categories, skills, locations, industries |
| System Settings | Admin Portal → Settings | Platform config |
| System Control | Admin Portal → Control | Emergency toggles |
| RBAC | Super Admin → Roles & Permissions | Create and edit roles/permissions |
| System Logs | Super Admin → System Logs | Infrastructure-level logs |
| Tenant Management | Platform Portal → Tenants | Multi-tenant config |

### Sysadmin Gaps

| Gap | Severity | Recommendation |
|---|---|---|
| No CI/CD pipeline visible | High | No GitHub Actions or build pipeline in repo — deployments are manual (Netlify Git push only) |
| No environment promotion strategy | High | `.env` has production MySQL backend URL mixed with localhost API — should have dev/staging/prod `.env` files |
| No health check endpoint | Medium | No `/health` or `/status` route — can't monitor API uptime from frontend perspective |
| No feature flags system | Medium | Controlled rollouts not possible — changes go live for all users at once |
| Playwright config targets localhost:4173 | Low | E2E tests don't run against staging/production URL — risks regressions going undetected |
| No backup/disaster recovery docs | High | No documentation on data backup strategy or rollback procedure |
| Single build command, no staging deploy | Medium | `npm run build` goes directly to production — no staging validation step |

---

## 4. System Security Audit

### Security Controls in Place

| Control | Implementation | Status |
|---|---|---|
| Authentication | Bearer token in localStorage + Zustand | Functional |
| Route Protection | ProtectedRoute + RoleProtectedRoute components | Good |
| Role Enforcement | RoleProtectedRoute checks role array | Good |
| Auto-logout on 401 | apiFetch clears session on 401 response | Good |
| Cross-tab sync | localStorage event listener | Good |
| XSS prevention | React JSX escaping (built-in) | Good |
| CSRF mitigation | Token-based auth (implicit protection) | Adequate |
| Forbidden page | /forbidden redirect for unauthorized access | Good |

### Security Vulnerabilities & Risks

| Vulnerability | Severity | Detail | Recommendation |
|---|---|---|---|
| Token stored in localStorage | High | XSS attack can steal the auth token from localStorage | Move to HttpOnly cookies managed by backend |
| MySQL backend credentials exposed | High | `VITE_API_BASE_URL` and `VITE_API_BASE_URL` are bundled into the JS build and visible to anyone | Ensure backend authorization policies are airtight; move all sensitive queries to backend |
| No token expiry handling | High | No refresh token logic — tokens may be expired but still used | Implement token refresh or short TTL with re-auth |
| prop-types disabled in ESLint | Medium | `react/prop-types` rule is off — wrong data shapes silently passed to components | Enable prop-types or migrate to TypeScript |
| No rate limiting on frontend | Medium | Login form has no throttle/lockout mechanism on the UI side | Add lockout after N failed attempts; enforce on backend |
| No Content Security Policy header | Medium | No CSP configured in netlify.toml or index.html | Add strict CSP headers in netlify.toml `[[headers]]` |
| Sensitive info in .env committed | High | `.env` (not just `.env.example`) should never be committed to git | Verify `.gitignore` excludes `.env`; rotate exposed keys |
| No input sanitization for rich text | Medium | If any fields accept rich text or markdown, sanitize before render | Use DOMPurify for any HTML rendering |
| No audit of chatbot input | Low | User input to AI chatbot is unvalidated on frontend | Validate/truncate input length before sending to API |
| ESLint `no-unused-vars` disabled | Low | Dead code and unused variables are invisible | Enable with warning level to expose unused imports |

---

## 5. Data Administrator Audit

### Data Entities Managed

| Entity | Managed Via | Operations |
|---|---|---|
| Users | Admin → Users, Super Admin → Users | Create, Read, Update, Block, Delete |
| Jobs | Admin → Jobs, HR → Jobs, DataEntry → Add Job | Create, Read, Update, Delete, Moderate |
| Applications | Admin, Super Admin | Read, Status Update |
| Invoices | Accounts → Invoices | Create, Read, Update, Send |
| Transactions | Accounts → Transactions | Read, Export |
| Subscriptions | Accounts, Super Admin | Read, Cancel, Renew |
| Support Tickets | Support Portal, Super Admin | Create, Read, Update, Close |
| Audit Logs | Audit Portal, Admin | Read, Export |
| Companies | Super Admin → Companies | Create, Read, Update, Delete |
| Leads | Sales → Leads | Create, Read, Update, Convert |
| Coupons | Sales → Coupons | Create, Read, Update, Deactivate |
| Master Data | Admin → Master Data | Create, Read, Update, Delete |

### Data Administration Assessment

| Area | Status | Notes |
|---|---|---|
| Data entry workflow | Good | Full approval workflow — draft → pending → approved/rejected |
| Audit trail | Good | Dedicated audit module with event logging and alerts |
| Financial data separation | Good | Accounts module is role-restricted and separate from operational data |
| Data export | Partial | Reports exist but no universal CSV/Excel export across all modules visible |
| Data retention policy | Not found | No UI or configuration for data retention / auto-deletion policies |
| GDPR / Data deletion | Risk | User deletion tracked in localStorage — not a compliant data erasure mechanism |
| Data validation | Partial | React Hook Form validates on frontend only; backend validation unknown |
| Soft delete vs hard delete | Unknown | Admin has delete buttons but delete behavior (soft vs hard) not visible from frontend |

### Data Risks

| Risk | Severity | Recommendation |
|---|---|---|
| No data retention / archiving strategy visible | High | Define and implement data lifecycle policies — especially for PII (user profiles, resumes) |
| PII stored in MySQL backend with anon key accessible | High | Verify all PII tables have Row Level Security (RLS) policies in MySQL backend |
| Resume files (if uploaded) storage location unknown | Medium | Confirm backend upload storage bucket permissions are private, not public |
| Deleted user IDs in localStorage only | High | Deleted user status must be backend-authoritative — not a frontend array |
| No data backup visible in frontend config | Medium | Ensure MySQL backups is enabled on the project |
| Multi-tenant data isolation unclear | High | Platform portal manages tenants but frontend doesn't show how data is isolated between tenants |

---

## Overall Audit Summary

| Audit Domain | Rating | Key Concern |
|---|---|---|
| System Design | 7/10 | No server state caching, no error boundaries, no TypeScript |
| System Architecture | 6/10 | Backend is a black box, MySQL backend keys exposed, no failover |
| System Administration | 5/10 | No CI/CD, no staging env, no feature flags, manual deployments |
| System Security | 5/10 | Token in localStorage, no CSP, no token refresh, RLS unverified |
| Data Administration | 6/10 | Good audit trail but no data retention, GDPR compliance unclear |

---

## Priority Action Items

| Priority | Action |
|---|---|
| P0 | Audit backend authorization policies — ensure no unauthorized data access via anon key |
| P0 | Move auth tokens to HttpOnly cookies — eliminate localStorage XSS risk |
| P0 | Remove `.env` from git history if committed — rotate MySQL backend keys immediately |
| P1 | Add Content Security Policy headers in `netlify.toml` |
| P1 | Implement token refresh / expiry handling |
| P1 | Add React Error Boundaries at module level |
| P1 | Set up CI/CD pipeline (GitHub Actions → Netlify) with staging environment |
| P2 | Migrate server state to React Query or SWR for caching and background sync |
| P2 | Enable TypeScript on core utilities and auth module |
| P2 | Define data retention policy and implement GDPR-compliant user deletion |
| P3 | Add unit tests alongside E2E tests |
| P3 | Split globals.css (132KB) into module-level stylesheets |
