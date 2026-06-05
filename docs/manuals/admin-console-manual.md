# Admin Console Manual

## 1. Admin Console Ka Purpose

Admin console operational control ke liye hai. Admin users, jobs, reports, applications, master data, payments aur platform settings manage karte hain.

Admin ka daily kaam:

- Pending recruiter approvals check karna.
- Jobs approve/reject/close karna.
- Reports investigate karna.
- Applications monitor karna.
- Master data maintain karna.
- Payments aur plan purchase approve karna.
- Settings/pricing update karna.

## 2. Sidebar Menus

Admin sidebar me ye visible menus hain:

- Dashboard
- Users
- Jobs
- Reports
- Applications
- Master Data
- Payments

Routes exist for Audit, Settings, Control, External Jobs too, but current admin sidebar primary menus upar wale hain.

## 3. Dashboard

Click `Dashboard`.

Admin dashboard par quick operational summary milta hai:

- Pending recruiter approvals
- Jobs awaiting decision
- Open reports
- Admin focus for today

Use this page first:

1. Pending HR/recruiter accounts dekho.
2. Pending jobs review karo.
3. Open reports me urgent issues check karo.
4. Focus section se aaj ki priority decide karo.

## 4. Users

Click `Users`.

Ye page user identities create, search, status update aur revoke access ke liye hai.

Create new identity:

1. `Employee Name` fill karo.
2. Email fill karo.
3. Role choose karo.
4. Strong auth key/password enter karo.
5. Eye button click karoge to password show/hide hoga.
6. Company/organization field fill karo if needed.
7. Click create button.
8. New managed account list me add hoga.

Search users:

1. Search field me name, email, role, ya status type karo.
2. Click `Apply`.
3. Matching users dikhenge.

User row actions:

- Status button use karne se user active/suspended type status update hota hai.
- `Revoke Access`/delete button user ka portal access remove karta hai.

Pagination:

- `Previous` and `Next` buttons se pages move karo.

## 5. Jobs

Click `Jobs`.

Ye job moderation aur job lifecycle page hai.

Filters:

- Status: open, closed, deleted/soft deleted.
- Approval status: pending, approved, rejected.
- Search by title, company, location, or status.

Job row actions:

- Click `Set Live`: job status open/live hota hai.
- Click `Close Applications`: job closed hota hai.
- Click `Soft Delete`: job deleted/hidden state me jata hai.
- Approval dropdown me `Approved` ya `Rejected` choose karo.
- Approval note field me reason likho.
- Click `Save Clearance`: approval decision save hota hai.
- Click `Force Purge`: hard delete/purge action start hota hai. Ye risky action hai, only when duplicate/fraud/invalid record permanently remove karna ho.

Admin job workflow:

1. Pending approval filter lagao.
2. Job title, company, location, salary, description review karo.
3. Valid ho to approval `Approved` select karo.
4. Invalid ho to `Rejected` select karo and note likho.
5. Click `Save Clearance`.
6. Live karna ho to `Set Live` click karo.

## 6. Reports

Click `Reports`.

Ye abuse, listing issue, user report ya platform complaint investigation page hai.

Search:

- Reason
- ID
- Description
- Target type
- Target ID

Report row actions:

- Resolution dropdown me action choose karo, jaise review/approved/rejected.
- Internal resolution note likho.
- Click `Update`.
- Agar issue kisi team ko bhejna ho, department/action select karo.
- Click send icon/button to forward for resolution.

Workflow:

1. Open/pending reports filter karo.
2. Evidence aur details read karo.
3. Internal note me investigation result likho.
4. Report resolve/reject/forward karo.

## 7. Applications

Click `Applications`.

Ye candidate application pipeline monitor karta hai.

Filters:

- Status dropdown: applied, shortlisted, rejected and other statuses.
- Search by email, applicant ID, job ID, HR ID.

Actions:

- Resume icon/link click karoge to resume attachment new tab me open hota hai.
- Status filter change karoge to list update hoti hai.
- `Previous` and `Next` buttons page change karte hain.

Use:

- Pipeline health check karna.
- Candidate/job relation verify karna.
- Suspicious or stuck applications identify karna.

## 8. Master Data

Click `Master Data`.

Ye lookup, geography aur taxonomy management ke liye hai.

Sections:

- Categories
- Locations
- States
- Districts / Tehsils / Villages
- Pincode Mapping
- Industries and Skills

Add category:

1. `Category name` type karo.
2. Click `Add`.
3. Category create hogi.

Existing category actions:

- Click `Disable`: category inactive hoti hai.
- Click `Enable`: category active hoti hai.
- Click `Delete`: category remove hoti hai.

Add location:

1. `Location name` type karo.
2. Click `Add`.

Add state:

1. `State name` type karo.
2. `Code` fill karo.
3. Click `Add`.

Add district:

1. District name fill karo.
2. State select karo.
3. Click `Add District`.

Add tehsil:

1. Tehsil name fill karo.
2. Parent district select karo.
3. Click `Add Tehsil`.

Add village:

1. Village name fill karo.
2. Parent tehsil select karo.
3. Optional pincode fill karo.
4. Click `Add Village`.

Add pincode:

1. Pincode fill karo.
2. Geography mapping select karo.
3. Click `Add Pincode`.

Add industry/sector/skill:

- Industry name fill karo and click `Add Industry`.
- Sector name fill karo and click `Add Sector`.
- Skill name fill karo and click `Add Skill`.

Important:

- Master data changes affect job forms, filters, locations, categories and search quality.
- Delete only when sure record is wrong or duplicate.

## 9. Payments

Click `Payments`.

Admin payments page handles transactions, role plans, coupons, commercial purchases and manual ledger updates.

Role plan setup:

1. Plan card me price, posting limit, trial days, validity, etc update karo.
2. Click `Save Plan`.
3. Button `Saving...` dikhega.
4. Plan checkout/pricing logic update hota hai.

Create coupon:

1. `Coupon code` fill karo.
2. Discount type choose karo.
3. Discount value fill karo.
4. Max uses fill karo.
5. Audience roles fill karo, example `hr,campus_connect,student`.
6. Plan slugs fill karo, example `hr_growth,student_plus`.
7. Click `Create Coupon`.
8. Coupon sales/support validation ke liye available hoga.

Commercial purchase actions:

- Click `Approve`: purchase paid/approved mark hota hai.
- Click pending action: purchase pending state me set hota hai.

Recruiter plan purchase actions:

- Click approve/paid action: recruiter plan activate hota hai.
- Click `Process Refund`: refund state/process start hota hai.

Transaction search:

1. Search field me payment ID, HR ID, job ID, reference type karo.
2. Matching transaction cards/list appear hote hain.

View / Rec:

1. Payment row me `View / Rec` click karo.
2. `Override Transaction` modal khulega.
3. Provider, status, reference ID, amount, note update karo.
4. Click `Confirm Ledger Update`.
5. Manual transaction override save hota hai.
6. `Cancel` click karoge to modal close hoga without saving.

## 10. Audit Logs

Route: `/portal/admin/audit`

Use when admin action trace karna ho.

Steps:

1. User ID filter fill karo if known.
2. Action fill karo, example `job_approved`.
3. Entity type fill karo, example `job`, `user`, `report`.
4. Limit choose karo.
5. Click `Apply`.
6. Logs table update hoga.
7. Click `Reset` to clear filters.
8. `Previous` and `Next` buttons se log pages move hote hain.

## 11. Settings

Route: `/portal/admin/settings`

Use for roles, security, OTP and job posting plan controls.

Platform settings:

1. Required settings update karo.
2. Click `Save Settings`.
3. Button `Saving...` dikhega.

Job posting plans:

1. Plan card me price, limits, validity, and boost option update karo.
2. `Boost on Search` yes/no choose karo.
3. Click `Save Plan`.
4. Plan settings save hoti hain.

## 12. Admin Daily Workflow

1. `Dashboard` open karo.
2. Pending recruiters and pending jobs check karo.
3. `Jobs` me moderation complete karo.
4. `Reports` me abuse/complaint investigations close karo.
5. `Payments` me pending plan purchases approve karo.
6. `Applications` me stuck pipeline inspect karo.
7. Master data only need basis par update karo.
8. End of day audit or reports check karo.
