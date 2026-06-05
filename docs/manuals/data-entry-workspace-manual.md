# Data Entry Workspace Manual

## 1. Data Entry Workspace Ka Purpose

Data entry workspace job posts create karne, drafts manage karne, pending approval queue track karne, approved/rejected entries dekhne aur operator profile maintain karne ke liye hai.

Data entry ka daily kaam:

- New job post create karna.
- Draft save/update karna.
- Rejected jobs correct karna.
- Pending approval status track karna.
- Approved jobs confirm karna.
- HR/student user ID create karna when needed.
- Live chat transferred queries handle karna.

## 2. Sidebar Menus

Data Entry sidebar:

- Dashboard
- Post Job
- Data Records
- Manage Jobs
- Draft Jobs
- Pending Approval
- Approved Jobs
- Rejected Jobs
- Live Chat
- Notifications
- Profile

## 3. Dashboard

Click `Dashboard`.

Dashboard me operator output aur summary dikhti hai:

- Candidates Added
- Companies Added
- HR Contacts Added
- Profile Created
- Details Updated
- Job Openings Added

Create User ID:

1. Click `Create User ID`.
2. Modal open hoga.
3. Full name fill karo.
4. Email fill karo.
5. Password fill karo.
6. Eye button se password show/hide kar sakte ho.
7. Role choose karo, usually HR or Student.
8. Company/organization field fill karo if needed.
9. Click `Create HR ID` or `Create Student ID`.
10. Button `Creating User...` dikhega.
11. Created user ka ID available ho jayega.

Use:

- HR ko onboarding karna ho.
- Student account create karna ho.
- Operator daily productivity check karni ho.

## 4. Post Job

Click `Post Job`.

Route: `/portal/dataentry/add-job`

Ye job record create karne ka main form hai.

Important fields:

- Registered company
- Job title
- Job category/sector
- State
- District/city
- Pincode
- Salary details
- Employment type
- Experience
- Skills
- Description
- Contact or application details

Create job:

1. Registered company select karo.
2. Job title fill karo.
3. Location fields fill karo.
4. Pincode fill karo.
5. Salary and employment details fill karo.
6. Skills field me comma separated skills likho, example `Sales, CRM, Field Work`.
7. Job description fill karo.
8. Required fields complete karo.
9. Click `Post Job`.
10. Button `Posting...` dikhega.
11. Job entry create hogi and approval workflow me jayegi.

Reset form:

1. Click `Reset`.
2. Form default values me wapas aa jayega.

Edit job:

1. `Manage Jobs`, `Draft Jobs`, `Pending Approval`, `Approved Jobs`, ya `Rejected Jobs` se row me `Edit` click karo.
2. Same form `Edit Job Entry` mode me open hoga.
3. Existing details update karo.
4. Click `Update Job Post`.
5. Button `Updating...` dikhega.
6. Entry update hogi.

## 5. Data Records

Click `Data Records`.

Ye data entry team ke liye portal records overview hai.

Sections:

- Portal Jobs
- Portal Candidates
- Portal Companies
- Record Status Queues
- Portal Alerts

Use:

- Existing jobs dekhna.
- Candidate records check karna.
- Company records validate karna.
- Draft, pending, approved, rejected count check karna.
- Recent alerts read karna.

## 6. Manage Jobs

Click `Manage Jobs`.

Ye all entries manage karne ka page hai.

Filters:

- Status: draft, pending, approved, rejected.
- Search: Entry ID, title, company, candidate.

Actions:

1. Status filter choose karo.
2. Search field me ID/title/company/candidate type karo.
3. Click `Apply`.
4. Matching entries list me dikhengi.
5. Click `Reset` to clear filters.
6. Row me `Edit` click karoge to edit form khulega.

## 7. Draft Jobs

Click `Draft Jobs`.

Ye entries saved by operator before review show karta hai.

Use:

- Incomplete jobs complete karna.
- Draft ko edit karke submit/update karna.

Action:

- Row me `Edit` click karo, details complete karo, then submit/update.

## 8. Pending Approval

Click `Pending Approval`.

Ye jobs QA/admin approval ke wait me hoti hain.

Use:

- Kaunsi jobs review queue me hain track karna.
- Admin se status follow-up karna.
- Pending entries me obvious mistake mile to edit/update karna where allowed.

## 9. Approved Jobs

Click `Approved Jobs`.

Ye jobs QA/admin se approved hain.

Use:

- Confirm karna ki job live usage ke liye clear hai.
- Approved job details verify karna.

## 10. Rejected Jobs

Click `Rejected Jobs`.

Ye jobs validation gaps, duplicates ya incomplete employer details ke karan reject hui hoti hain.

Workflow:

1. Rejected job open/list me find karo.
2. Reason/context samjho.
3. Row me `Edit` click karo.
4. Missing/wrong fields correct karo.
5. Click `Update Job Post`.
6. Updated entry phir review flow me ja sakti hai.

## 11. Live Chat

Click `Live Chat`.

Ye data entry department ko transferred customer chats ke liye hai.

Use:

- Job posting data issue.
- Record correction query.
- Publishing status query.
- Data-related support transfer.

Steps:

1. Chat select karo.
2. Customer issue read karo.
3. Reply type karo.
4. Click `Send`.
5. Issue solve ho to `Resolve`.
6. Closed chat reopen karna ho to `Reopen`.

## 12. Notifications

Click `Notifications`.

Ye queue alerts, duplicate warnings, approval updates aur processing events show karta hai.

Actions:

- Unread notification me `Mark read` click karo.
- Notification read state me chali jayegi.

Use:

- Rejected entry alert.
- Approval status update.
- Duplicate warning.
- Queue activity.

## 13. Profile

Click `Profile`.

Profile me operator identity, shift details, output targets aur working notes manage hote hain.

Fields:

- Email read-only hai. Login account se managed hai.
- Mobile number fill/update kar sakte ho.
- Shift/target/notes fields update ho sakte hain.

Save profile:

1. Fields update karo.
2. Mobile number valid rakho.
3. Click `Save Profile`.
4. Button `Saving...` dikhega.
5. Profile update hogi.

## 14. Data Entry Daily Workflow

1. `Dashboard` open karo and target/output dekho.
2. `Notifications` check karo.
3. `Rejected Jobs` me corrections handle karo.
4. `Draft Jobs` me incomplete jobs complete karo.
5. `Post Job` se new job create karo.
6. `Manage Jobs` se status/filter check karo.
7. `Pending Approval` me review queue track karo.
8. End of day `Data Records` se count verify karo.

## 15. Common Confusion

- `Post Job` submit nahi ho raha: required fields missing ho sakte hain.
- Company dropdown blank: registered companies load hone ka wait karo.
- Pincode invalid: numeric pincode format use karo.
- Rejected job correct karni hai: row ke `Edit` link se open karo.
- Email profile me edit nahi ho raha: email login account se managed hai.
