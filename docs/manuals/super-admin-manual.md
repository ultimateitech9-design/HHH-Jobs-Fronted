# Super Admin Manual

## 1. Super Admin Ka Purpose

Super admin full platform control role hai. Ye role users, companies, campuses, jobs, applications, payments, subscriptions, reports, support tickets, logs, permissions aur system settings manage karta hai.

Super admin ka daily kaam:

- Platform health monitor karna.
- User access create/delete/status manage karna.
- Jobs aur companies ka macro review.
- Payment/subscription risk monitor karna.
- Support escalations handle karna.
- System logs aur settings review karna.
- Role permissions configure karna.

## 2. Sidebar Menus

Super admin sidebar:

- Dashboard
- Users
- Companies
- Campuses
- Jobs
- Applications
- Payments
- Subscriptions
- Reports
- Support Tickets
- System Logs
- Roles & Permissions
- System Settings

## 3. Dashboard

Click `Dashboard`.

Dashboard me platform ka command view milta hai.

Main areas:

- Platform revenue movement
- Monitor any operational dashboard
- Open support escalations
- Critical logs
- Recent jobs, users, payments, applications and tickets

Operational dashboard switch:

1. Dashboard me workspace selector buttons dikhte hain.
2. Kisi workspace button par click karo.
3. Us workspace ke records list me show honge.
4. Kisi row/record ko select karo.
5. Right/detail panel me selected record ka full detail dikhega.

Use:

- Ek jagah se platform ke alag modules inspect karna.
- Urgent support escalation ya critical log pehle dekhna.

## 4. Users

Click `Users`.

Ye user lifecycle, roles aur access status management page hai.

Create user ID:

1. Click `Create User ID`.
2. Modal open hoga.
3. `Enter full name` fill karo.
4. Email fill karo.
5. Role choose karo.
6. Password fill karo.
7. Eye icon click karoge to password show/hide hoga.
8. Company field fill karo if needed.
9. Assigned states select karo if role needs state scope.
10. Sales code fill karo ya blank chhodo for auto generation where applicable.
11. Click `Create [Role] ID`.
12. Button `Creating User...` dikhega.
13. User list refresh hogi.

Search users:

1. Search/filter fields fill karo.
2. Click `Search`.
3. Matching users dikhenge.

Delete user:

1. User row me `Delete` click karo.
2. Confirm modal khulega.
3. Click `Delete [role]`.
4. User ka portal access remove hoga.

Change user status:

1. User row me status action button click karo.
2. Confirm modal open hoga.
3. Confirm karo.
4. User status update hota hai.

## 5. Companies

Click `Companies`.

Companies management page company health, billing aur platform access monitor karta hai.

Use:

- Company status review.
- Billing state check.
- Platform access issue verify.
- Company count and health trend monitor.

Table behavior:

- Company rows desktop table/mobile cards me show hote hain.
- Large screens me columns fit horizontally.

## 6. Campuses

Click `Campuses`.

Campus management partner campuses, talent pools aur placement activity monitor karta hai.

Use:

- Campus partner health check.
- Talent pool and activity overview.
- Campus connect operations review.

## 7. Jobs

Click `Jobs`.

Jobs management publishing status, approval aur listing quality review karta hai.

Actions:

- Job status action trigger karne par confirm modal `Change job status` open hota hai.
- Click `Apply job action` to confirm.
- Click `Cancel` to close without change.

Workflow:

1. Jobs list review karo.
2. Suspicious/pending/poor quality job identify karo.
3. Status action select karo.
4. Confirm modal me action apply karo.

## 8. Applications

Click `Applications`.

Applications management hiring pipeline stages aur conversion track karta hai.

Use:

- Application volume review.
- Rejected/active pipeline count check.
- Candidate flow health monitor.

## 9. Payments

Click `Payments`.

Payments management collections, failures aur refunds monitor karta hai.

Search/filter:

- Status filter choose karo.
- Search by payment ID, invoice ID, company, item, method, status.

Action:

- Click `Mark first visible payment paid`.
- Confirm modal `Confirm payment settlement` open hoga.
- Click confirm button.
- First visible payment paid mark hoga.

Use carefully:

- Payment settlement confirm tabhi karo jab payment verified ho.

## 10. Subscriptions

Click `Subscriptions`.

Subscriptions management recurring plans, renewals aur seat usage track karta hai.

Use:

- Active/overdue subscription review.
- Renewal risk identify.
- Recurring revenue health check.

Search:

- Company, item, method, status ya subscription ID se search.

## 11. Reports

Click `Reports`.

Reports & Analytics platform revenue aur adoption health trends show karta hai.

Sections:

- Revenue Trend
- Platform Adoption

Use:

- Monthly collections understand karna.
- Platform growth track karna.
- Module-level adoption dekhna.

## 12. Support Tickets

Click `Support Tickets`.

Ye escalations aur resolution flow track karta hai.

Search supports:

- Ticket ID
- Title
- Company
- Assignee

Use:

- High impact support issues monitor karna.
- SLA/risk tickets identify karna.
- Department escalation review karna.

## 13. System Logs

Click `System Logs`.

System logs platform activity aur critical events review karne ke liye hain.

Search:

- Actor
- Action
- Module
- Details

Table behavior:

- Search box me text type karte hi logs filter hote hain.
- Details long ho sakti hain, title/tooltip me full value mil sakta hai.

Use:

- Suspicious activity investigate karna.
- Critical incidents audit karna.
- User/system changes trace karna.

## 14. Roles & Permissions

Click `Roles & Permissions`.

Ye access rights configure karne ka page hai.

Steps:

1. Role permission options review karo.
2. Required permissions enable/disable karo.
3. Click `Save permissions`.
4. Button `Saving...` dikhega.
5. Permissions save honge.

Important:

- Permissions change se users ke menus/actions affect ho sakte hain.
- Production me change se pehle role impact confirm karo.

## 15. System Settings

Click `System Settings`.

Ye platform-wide configuration aur policies control karta hai.

Settings examples:

- Maintenance Mode
- Registration
- Job Posting
- Resume Search

Steps:

1. Required setting dropdown/toggle change karo.
2. Click `Save settings`.
3. Button `Saving...` dikhega.
4. Settings apply hongi.

Important:

- Maintenance mode enable karne se public/user access affect ho sakta hai.
- Resume search disable karne se talent search capability off ho sakti hai.

## 16. Super Admin Daily Workflow

1. `Dashboard` open karo.
2. Critical logs aur support escalations review karo.
3. `Payments` aur `Subscriptions` se revenue risk dekho.
4. `Users` me pending access actions handle karo.
5. `Jobs`, `Companies`, `Campuses` ka platform health review karo.
6. `System Logs` me suspicious changes check karo.
7. `Roles & Permissions` or `System Settings` only required change ke liye use karo.

## 17. Common Confusion

- User create nahi ho raha: email duplicate ho sakta hai ya required field missing hai.
- Permission change ke baad menu missing: role permissions/access rule update hua ho sakta hai.
- Payment action risky hai: paid mark karne se finance state change hoti hai, verification ke bina mat karo.
- Maintenance mode: users ke access par immediate impact ho sakta hai.
