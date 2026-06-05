# Support Dashboard Manual

## 1. Support Center Ka Purpose

Support dashboard ka kaam hai customer tickets, live chat, complaints, feedback, FAQ, knowledge base aur reports manage karna.

Support person ka daily kaam:

- New tickets check karna.
- High priority tickets pehle handle karna.
- Customer ko reply bhejna.
- Ticket ko correct department me transfer karna.
- Live chat answer karna.
- Complaint aur feedback monitor karna.
- Knowledge base se standard answer dena.

## 2. Login Ke Baad Navigation

1. Login karo.
2. Sidebar me `Support Center` dikhega.
3. Sidebar me role menus available honge.
4. Top bell icon se notifications open hoti hain.
5. Top avatar/profile click karne par `Log out` option milta hai.

## 3. Sidebar Menus

### Dashboard

Click `Dashboard`.

Ye page support desk ka summary view hai.

Yahan dikhta hai:

- Immediate desk priorities
- Ticket status distribution
- Latest queue items
- Recent tickets needing visibility

Action:

- Latest queue item me `View details` click karoge to ticket detail page khulega.

Use this page first:

1. Critical/high priority issues identify karo.
2. Pending aur in-progress tickets ka load dekho.
3. Latest ticket open karke action start karo.

### Tickets

Click `Tickets`.

Ye all support tickets ka list page hai.

Filters:

- Status: Open, Pending, In Progress, Resolved, Closed, Escalated.
- Priority: Low, Medium, High, Critical.
- Category: Technical Issue, Billing, Account Access, Job Posting, Application Flow, Complaint, Feedback.
- Department: Support, Admin, Data Entry, Sales, Accounts, HR, Student, Campus Connect, Platform Ops, Audit.
- Search: Ticket ID, title, customer, owner.

Table search:

- Search ticket, customer, category, owner, priority, ya status.

Steps:

1. Filter choose karo.
2. Search text type karo if needed.
3. Matching ticket rows dikhenge.
4. Specific ticket open karne ke liye ticket detail route/context use karo.
5. Pagination me `Previous` and `Next` use karo.

### Ticket Details

Open ticket details from dashboard/tickets or route `/portal/support/ticket-details/:ticketId`.

Is page par full conversation, ticket status, customer details, transfer panel, internal notes aur reply box milta hai.

Status buttons:

- Click `Open`: ticket ko open state me rakhta hai.
- Click `Assign Review`: ticket ko pending/review state me bhejta hai.
- Click `Resolve`: customer issue resolved mark hota hai.
- Click `Close Ticket`: ticket close hota hai.

Assignee update:

1. `Support owner` field me owner name enter karo.
2. Click `Save Assignee`.
3. Ticket assigned owner update hoga.

Send ticket to another department:

1. `Send To` dropdown choose karo.
2. Department select karo, jaise Admin, Data Entry, Sales, Accounts.
3. Transfer note me reason likho, jaise `billing issue, send to Accounts`.
4. Click transfer/send button.
5. Ticket selected department queue me visible hoga.

Escalation:

1. Escalate option open karo if available.
2. Reason likho, jaise legal risk, payment risk, angry customer.
3. Confirm karo.
4. Ticket escalated status me jayega.

Internal notes:

1. `Add an internal note for the team...` field me note likho.
2. Click `Add Note`.
3. Note team ke liye save hota hai, customer reply nahi hota.

Customer reply:

1. `Reply to Ticket` box me customer ke liye answer likho.
2. Click `Send Reply`.
3. Button `Sending...` dikhega.
4. Reply conversation history me add hoga.

### Create Ticket

Click `Create Ticket`.

Use this when customer call/chat/email se issue raise karta hai aur existing ticket nahi hai.

Steps:

1. Customer/requester details fill karo.
2. Category choose karo.
3. Priority choose karo.
4. Assigned department/owner choose karo if visible.
5. Issue title likho.
6. Description me complete problem explain karo.
7. Click `Create Ticket`.
8. Button `Creating...` dikhega.
9. New ticket queue me add hoga.

### Live Chat

Click `Live Chat`.

Ye active customer chat sessions ke liye hai.

Steps:

1. Left side conversation list me customer chat select karo.
2. Customer messages read karo.
3. Reply field me answer type karo.
4. Click `Send`.
5. If issue solved, click `Resolve`.
6. If resolved/closed chat ko reopen karna hai, click `Reopen`.
7. Spam/abuse ke liye `Block` ya `24h Ban` use karo.
8. Wrong message remove karna hai to delete icon click karo, then confirm.

Important:

- Enter key send kar sakta hai depending input behavior.
- Empty reply send nahi hota.

### Client Search

Click `Client Search`.

Support me ye page customer identity verify karne ke liye use hota hai.

Steps:

1. Name, company, email, phone ya state type karo.
2. Audience filter choose karo if needed.
3. Click `Search`.
4. Results me role, phone, email, state, owner, source, status aur updated date dikhega.

Use this before:

- Account access issue solve karna.
- Billing case transfer karna.
- Customer identity confirm karna.

### FAQ

Click `FAQ`.

Yahan common support answers available hote hain.

Use:

- Billing questions ke quick answer.
- Job posting issue explanation.
- Account access standard answer.
- Platform usage guidance.

### Complaints

Click `Complaints`.

Ye customer complaints ka table hai.

Search supports:

- Complaint ID
- Customer
- Owner
- Severity
- Status

Use this page when:

- Complaint severity high hai.
- Escalation trend check karni hai.
- Customer dissatisfaction monitor karni hai.

### Feedback

Click `Feedback`.

Yahan customer feedback, rating, sentiment aur message dikhta hai.

Search supports:

- Feedback
- Customer
- Channel
- Rating
- Sentiment
- Message

Use this page:

- Customer satisfaction check karne ke liye.
- Negative feedback ko ticket/complaint me convert karne ke liye.

### Knowledge Base

Click `Knowledge Base`.

Ye support documentation aur operational guides ka area hai.

Use:

- Standard process follow karna.
- Billing guide.
- Job posting moderation checklist.
- Student profile recovery steps.

### Reports

Click `Reports`.

Reports support load by category aur resolution trend show karte hain.

Use:

- Kaunsi category me zyada load hai.
- Resolution speed kaisi hai.
- Team workload plan karna.

## 4. Daily Support Workflow

1. `Dashboard` open karo.
2. Critical/high priority latest queue items check karo.
3. `Tickets` me filters se open/high priority tickets nikalo.
4. `Ticket Details` me issue read karo.
5. Customer ko `Send Reply` karo.
6. Agar specialist department chahiye to `Send To` se transfer karo.
7. Solved case ko `Resolve` karo.
8. Fully complete case ko `Close Ticket` karo.
9. `Live Chat` continuously monitor karo.
10. End of day `Reports`, `Complaints`, aur `Feedback` review karo.

## 5. Common Confusion

- Customer reply nahi ja raha: reply box empty na ho.
- Ticket wrong team me hai: `Send To` section se correct department transfer karo.
- Customer detail unclear hai: `Client Search` use karo.
- Complaint serious hai: internal note add karo aur escalate karo.
