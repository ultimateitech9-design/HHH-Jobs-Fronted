# Sales Dashboard Manual

Note: Normal sales users may not see `Sales Team`. Admin and super admin users can see it.

## 1. Sales Dashboard Ka Purpose

Sales dashboard ka kaam hai leads, payments, customers, packages, coupons, live chat aur reports ko ek jagah manage karna.

Sales person ka daily kaam:

- New leads check karna.
- Lead ko call/follow-up karna.
- Package/payment status dekhna.
- Customer details verify karna.
- Coupon validate karna ya coupon request bhejna.
- Sales related live chat handle karna.
- Reports se conversion aur revenue samajhna.

## 2. Login Ke Baad Navigation

1. Login karo.
2. Sidebar me `Sales Dashboard` dikhega.
3. Sidebar collapsed ho sakta hai. Mouse sidebar par le jaoge to menu expand hoga.
4. Mobile me menu open karne ke liye top header ka menu icon use karo.
5. Top right notification bell click karoge to notifications drawer khulega.
6. Top right profile/avatar click karoge to `Log out` option milega.

## 3. Sidebar Menus

### Overview

Click `Overview`.

Ye page sales ka summary dashboard hai. Yahan payment health, contacted leads, untouched leads, upcoming follow-ups, plan coverage aur recent sales activity dikhti hai.

Use this page when:

- Aaj kis lead par pehle kaam karna hai decide karna ho.
- Payment aur revenue health check karni ho.
- Recent sales activity dekhni ho.

### Payments

Click `Payments`.

Ye page client package purchases aur payment status dikhata hai.

Visible columns usually include:

- Payment ID
- Customer
- Package
- Amount
- State
- District
- Payment Method
- Record Status
- Payment
- Created

Actions:

- Click `Status` filter and choose status. List sirf selected status ke payments dikhayegi.
- Type in `Search` field. Payment ID, customer, ya package se record search hoga.
- Click `Export CSV`. Export action trigger hota hai for CSV flow.
- Click `Export PDF`. Export action trigger hota hai for PDF flow.
- Click `Previous` or `Next`. Table ka page change hoga.

Sales process:

1. Payment ka status dekho.
2. Customer aur package verify karo.
3. Payment issue ho to support/accounts ko inform karo.
4. Paid payment dikhe to customer onboarding follow-up start karo.

### Leads

Click `Leads`.

Ye sales ka main working screen hai. Yahan HR, campus aur student leads manage hote hain.

Top stats:

- Total leads
- Plan pending
- Follow-up required
- Converted or similar sales health numbers

Create onboarding request:

1. `Company / campus / student` field me client ka naam likho.
2. `Contact name` fill karo.
3. `Email` fill karo.
4. `Phone` fill karo.
5. Audience/role select karo if shown.
6. Package slug field me package slug likho, jaise `hr_growth` ya relevant plan.
7. Notes me data entry/sales follow-up context likho.
8. Click `Create Request`.
9. Button `Sending...` dikhega while saving.
10. Request create hone ke baad data entry or onboarding queue me context available hoga.

Filter leads:

- Stage filter se lead status choose karo.
- Audience filter se HR, campus, student type choose karo.
- Onboarding filter se onboarded/pending type check karo.
- Search me company, contact, email, phone, zone type karo.

Lead follow-up:

1. Lead row me `Follow-up date` choose karo.
2. `Follow-up time` choose karo.
3. Click follow-up save button.
4. System call/follow-up log save karega aur next follow-up schedule karega.
5. Agar date/time blank hai to button disabled reh sakta hai.

Pagination:

- Click `Previous` pichle page ke leads dikhata hai.
- Click `Next` next page ke leads dikhata hai.

### Lead Details

Open lead detail from lead context or direct route `/portal/sales/lead-details/:leadId`.

Is page par lead ownership, source, deal value aur commercial stage dikhta hai.

Save follow-up:

1. Follow-up form me next follow-up details update karo.
2. Notes/context fill karo.
3. Click `Save Follow-up`.
4. Button `Saving...` dikhega.
5. Saved follow-up history niche appear hogi.

### Customers

Click `Customers`.

Ye page active accounts, lifetime value, owner, plan aur payment status dikhata hai.

Use this page when:

- Existing customer ka account verify karna ho.
- Customer kis plan par hai dekhna ho.
- Lifetime value aur account status check karna ho.

Table fields include:

- Customer ID
- Name
- Contact
- Email
- Audience
- State
- District
- Plan
- Lifetime Value
- Status
- Created

Click `Previous` or `Next` to move pages.

### Customer Details

Open customer details from customer context or direct route `/portal/sales/customer-details/:customerId`.

Yahan customer ka account value, status, ownership, payment context aur created date dikhti hai.

Use this before:

- Renewal discussion.
- Upsell discussion.
- Payment confusion solve karna.

### Client Search

Click `Client Search`.

Ye common search page hai. Sales isse leads, customers aur registered clients search kar sakta hai.

Steps:

1. Search field me client, company, email ya phone likho.
2. Audience filter choose karo if needed.
3. State filter choose karo if needed.
4. Click `Search`.
5. Results me client, record type, audience, phone, email, state, owner, source, status aur updated date dikhega.

Rule:

- At least 2 characters type karo, ya role/state filter select karo. Warna search nahi chalega.

### Sales Team

Click `Sales Team`.

Note: Ye menu normal sales user ko hide ho sakta hai. Admin/super admin type manager users ko dikhega.

Ye page team output, territories, revenue contribution aur response quality dikhata hai.

Table fields include:

- Agent
- Email
- Assigned
- Open Leads
- Deals Closed
- Revenue
- Lead Response %
- Status

Use this page for:

- Team performance review.
- Kis agent ke paas open leads zyada hain dekhna.
- Revenue contribution compare karna.

### Packages

Click `Packages`.

Ye page packages/plans ke sales performance ko show karta hai.

Table fields include:

- Package
- Category
- Units Sold
- Revenue
- Status

Use this when:

- Customer ko plan recommend karna ho.
- Kaunsa package zyada sell ho raha hai dekhna ho.
- Low performing packages identify karne ho.

### Coupons

Click `Coupons`.

Is page par coupon validation aur custom coupon request dono hote hain.

Validate coupon:

1. `Coupon code` field me coupon code type karo.
2. Audience/plan details select ya fill karo if visible.
3. `Client amount` enter karo.
4. Click `Validate Coupon`.
5. System eligibility aur discount result show karega.

Request custom coupon:

1. `Client name` fill karo. Ye required hai.
2. Client email fill karo.
3. Client phone fill karo.
4. Audience/plan select karo if visible.
5. `Expected value` fill karo.
6. `Requested discount` fill karo.
7. `Client context` me reason likho.
8. Click `Send Request`.
9. Request admin/commercial review list me save hogi.

Coupon request table:

- Request ID
- Client
- Requested discount
- Status
- Created date

### Live Chat

Click `Live Chat`.

Ye sales-transferred chats ke liye hai. Support agar sales query transfer kare to yahan appear hogi.

Steps:

1. Left list se chat choose karo.
2. Customer messages read karo.
3. Reply box me answer type karo.
4. Click `Send`.
5. Agar issue solve ho gaya hai, click `Resolve`.
6. Agar customer dobara reply kare ya case reopen ho, click `Reopen`.
7. Abuse/spam case me `Block`, `24h Ban`, ya `Unblock` actions use ho sakte hain.
8. Wrong message delete karna ho to message ka delete icon click karo, then confirm karo.

### Reports

Click `Reports`.

Ye page source performance, conversion stage aur monthly revenue direction show karta hai.

Use reports to understand:

- Kis source se leads aa rahe hain.
- Zone/owner performance kaisa hai.
- Paid payments aur revenue summary kya hai.

## 4. Daily Sales Workflow

1. `Overview` open karo aur priorities dekho.
2. `Leads` me untouched aur upcoming follow-up leads filter karo.
3. Lead ko call karo.
4. Follow-up date/time save karo.
5. Interested client ke liye `Create Request` bhejo.
6. `Coupons` me coupon validate ya request karo.
7. `Payments` me payment status confirm karo.
8. Paid client ko onboarding ke liye coordinate karo.
9. End of day `Reports` aur `Sales Team` se progress review karo.

## 5. Common Confusion

- `Sales Team` missing hai: normal sales user ke liye hide ho sakta hai.
- Search result nahi aa raha: at least 2 characters enter karo ya filter choose karo.
- Follow-up button disabled hai: date aur time dono select karo.
- Payment customer mismatch lag raha hai: `Client Search` se customer verify karo, then accounts/support ko escalate karo.
