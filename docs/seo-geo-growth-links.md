# HHH Jobs SEO, GEO, and AI Discovery Links

## Public discovery files

- Production site: https://hhh-jobs.com/
- XML sitemap: https://hhh-jobs.com/sitemap.xml
- Robots rules: https://hhh-jobs.com/robots.txt
- AI/GEO discovery map: https://hhh-jobs.com/llms.txt
- AI pointer: https://hhh-jobs.com/ai.txt
- IndexNow key file: https://hhh-jobs.com/9e643b2a4e3245fcaef18e7a2c5479d1.txt

## Priority HHH landing pages

- Jobs: https://hhh-jobs.com/jobs
- Government jobs: https://hhh-jobs.com/govt-jobs
- Companies: https://hhh-jobs.com/companies
- ATS resume checker: https://hhh-jobs.com/ats
- Job seekers: https://hhh-jobs.com/job-seekers
- Freshers: https://hhh-jobs.com/freshers
- Recruiters: https://hhh-jobs.com/recruiters
- Campus Connect: https://hhh-jobs.com/campus-connect
- Experienced professionals: https://hhh-jobs.com/veterans
- Retired employees: https://hhh-jobs.com/retired-employee
- Services: https://hhh-jobs.com/services
- Employee verification: https://hhh-jobs.com/emp-verify

## Search engine submission links

- Google Search Console: https://search.google.com/search-console
- Google sitemap submit page: https://search.google.com/search-console/sitemaps
- Bing Webmaster Tools: https://www.bing.com/webmasters
- IndexNow documentation: https://www.indexnow.org/documentation
- IndexNow endpoint: https://api.indexnow.org/indexnow

## SEO validation links

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org validator: https://validator.schema.org/
- PageSpeed Insights: https://pagespeed.web.dev/
- Google robots and sitemap docs: https://developers.google.com/search/docs/crawling-indexing
- Schema.org JobPosting docs: https://schema.org/JobPosting
- llms.txt proposal: https://llmstxt.org/

## VPS commands after deploy

Run these after pulling frontend and backend updates on the server:

```bash
cd /opt/hhh-jobs/backend
npm run generate:sitemap
npm run seo:indexnow
```

Then submit `https://hhh-jobs.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
