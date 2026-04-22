import { BLOG_BASE_URL } from '../../../shared/utils/externalLinks.js';

export const FOOTER_LINK_COLUMNS = [
  {
    title: '',
    links: [
      { label: 'About us', to: '/about-us', key: 'about-us' },
      { label: 'Contact us', to: '/contact-us', key: 'contact-us' },
      { label: 'Careers', to: '/careers', key: 'careers' },
      { label: 'Employer home', to: '/employer-home', key: 'employer-home' },
      { label: 'Sitemap', to: '/sitemap', key: 'sitemap' },
      { label: 'Blogs', to: BLOG_BASE_URL, key: 'blog' }
    ]
  },
  {
    title: '',
    links: [
      { label: 'Help center', to: '/help-center', key: 'help-center' },
      { label: 'Summons/Notices', to: '/summons-notices', key: 'summons-notices' },
      { label: 'Grievances', to: '/grievances', key: 'grievances' },
      { label: 'Report issue', to: '/report-issue', key: 'report-issue' },
      { label: 'Credits', to: '/credits', key: 'credits' },
      { label: 'Employee Verification', to: '/emp-verify', key: 'employee-verification' }
    ]
  },
  {
    title: '',
    links: [
      { label: 'Privacy policy', to: '/privacy-policy', key: 'privacy-policy' },
      { label: 'Terms & conditions', to: '/terms-and-conditions', key: 'terms-and-conditions' },
      { label: 'Fraud alert', to: '/fraud-alert', key: 'fraud-alert' },
      { label: 'Trust & safety', to: '/trust-and-safety', key: 'trust-and-safety' },
      { label: 'Retired Employee', to: '/retired-employee', key: 'retired-employee' }
    ]
  }
];

export const BLOG_ARTICLE_PAGE_KEY_BY_SLUG = {
  'ats-friendly-resume-blueprint-2026': 'blog-ats-friendly-resume-blueprint-2026',
  'projects-that-recruiters-notice': 'blog-projects-that-recruiters-notice',
  'interview-preparation-in-14-days': 'blog-interview-preparation-in-14-days',
  'hr-expectations-from-freshers-2026': 'blog-hr-expectations-from-freshers-2026',
  'common-application-mistakes': 'blog-common-application-mistakes'
};

export const FOOTER_PAGE_CONTENT = {
  blog: {
    title: 'HHH Job Blog',
    eyebrow: 'Insights',
    summary:
      'Practical guidance for candidates, recruiters, and employers who want stronger hiring outcomes, clearer communication, and better preparation.',
    sections: [
      {
        heading: 'Build a Resume That Clears ATS and Impresses Recruiters',
        tag: 'Resume',
        readTime: '6 min read',
        image: '/images/blog/ats-resume-cover.svg',
        imageAlt: 'Resume and ATS optimization visual',
        to: '/blog/ats-friendly-resume-blueprint-2026',
        body:
          'A strong resume does more than match keywords. It presents role-fit, evidence, and readability in a format that works for both screening systems and human reviewers.',
        items: [
          'Use a clean structure with summary, skills, experience, projects, and education',
          'Place role-relevant keywords inside evidence-based bullets',
          'Show measurable outcomes wherever possible',
          'Submit a polished PDF with a professional file name'
        ]
      },
      {
        heading: 'Projects That Prove Capability, Not Just Curiosity',
        tag: 'Projects',
        readTime: '5 min read',
        image: '/images/blog/projects-cover.svg',
        imageAlt: 'Project showcase and portfolio visual',
        to: '/blog/projects-that-recruiters-notice',
        body:
          'A strong project tells a complete story: the problem, your role, the decisions you made, and the result that followed.',
        items: [
          'Explain the problem before the tech stack',
          'Show your exact contribution and ownership',
          'Describe important architectural or product choices',
          'Close with adoption, efficiency, or business impact'
        ]
      },
      {
        heading: 'A 14-Day Interview Reset for Serious Candidates',
        tag: 'Interviews',
        readTime: '7 min read',
        image: '/images/blog/interview-cover.svg',
        imageAlt: 'Interview planning board visual',
        to: '/blog/interview-preparation-in-14-days',
        body:
          'Two focused weeks can dramatically improve interview performance when preparation is structured around clarity, recall, and confidence under pressure.',
        items: [
          'Rebuild fundamentals before revisiting advanced topics',
          'Practice project storytelling until it sounds natural',
          'Use timed mock sessions to reduce pressure-driven mistakes',
          'Track weak areas daily and improve them before the final round'
        ]
      },
      {
        heading: 'What Hiring Teams Expect from Freshers in 2026',
        tag: 'Hiring',
        readTime: '4 min read',
        image: '/images/blog/hr-expectations-cover.svg',
        imageAlt: 'Hiring checklist and recruiter workflow visual',
        to: '/blog/hr-expectations-from-freshers-2026',
        body:
          'Freshers are increasingly assessed on communication, learning agility, reliability, and the ability to turn academic learning into practical action.',
        items: [
          'Show professional communication in interviews and follow-ups',
          'Bring proof of learning through projects or internships',
          'Demonstrate ownership, not just participation',
          'Stay punctual, clear, and respectful throughout the process'
        ]
      },
      {
        heading: 'Application Mistakes That Quietly Cost Candidates Interviews',
        tag: 'Applications',
        readTime: '5 min read',
        image: '/images/blog/application-mistakes-cover.svg',
        imageAlt: 'Job application quality and review visual',
        to: '/blog/common-application-mistakes',
        body:
          'Many applications fail long before interviews begin because the profile is incomplete, the resume is generic, or the follow-up is weak.',
        items: [
          'Apply with a current profile and updated resume',
          'Tailor the top section of the resume to the role',
          'Track applications so follow-ups stay timely',
          'Maintain communication after every important hiring step'
        ]
      }
    ]
  },
  'blog-ats-friendly-resume-blueprint-2026': {
    title: 'ATS-Friendly Resume Blueprint (2026)',
    eyebrow: 'Resume',
    summary:
      'A practical framework for writing a resume that performs well in ATS screening while still sounding credible and human.',
    sections: [
      {
        heading: 'Start with role clarity before you write',
        image: '/images/blog/ats-resume-cover.svg',
        imageAlt: 'ATS optimization cover',
        body:
          'Most resumes underperform because they are written for every role at once. Decide the target role first, then align the language, evidence, and order of information around that goal.',
        items: [
          'Match the headline, summary, and skills to one clear job family',
          'Keep chronology and section order easy to scan',
          'Remove content that is unrelated to the role you are pursuing'
        ]
      },
      {
        heading: 'Write bullets that carry proof',
        body:
          'Recruiters and screening systems both respond well to specific, evidence-led bullets. Strong writing shows what you did, where you did it, and what changed because of your work.',
        items: [
          'Use the pattern Action + Context + Outcome',
          'Include numbers, scale, quality gains, or time savings when available',
          'Prefer direct language over vague phrases such as responsible for'
        ]
      },
      {
        heading: 'Protect readability before every submission',
        body:
          'Before sending the final resume, check formatting, file quality, and keyword placement. A well-structured first half of the document often determines whether the rest is read carefully.'
      }
    ]
  },
  'blog-projects-that-recruiters-notice': {
    title: 'How to Build Projects That Recruiters Notice',
    eyebrow: 'Projects',
    summary:
      'Turn project work into credible hiring proof through sharp positioning, visible ownership, and measurable results.',
    sections: [
      {
        heading: 'Lead with the problem, not the stack',
        image: '/images/blog/projects-cover.svg',
        imageAlt: 'Project hiring proof visual',
        body:
          'A recruiter usually decides within seconds whether a project is memorable. The strongest projects explain why they were built before they explain how they were built.',
        items: [
          'Clarify the audience or business need',
          'Explain the challenge your solution addressed',
          'Show why the result matters in real terms'
        ]
      },
      {
        heading: 'Show real ownership',
        body:
          'Ownership is what separates a serious project from a decorative one. Employers want to know the decisions you drove, the trade-offs you handled, and the problems you solved yourself.',
        items: [
          'State your role clearly if the project was collaborative',
          'Mention architectural or product choices you made',
          'Describe the improvements you introduced over time'
        ]
      },
      {
        heading: 'Package the project professionally',
        body:
          'A polished README, clear screenshots, meaningful metrics, and a stable live link often create more trust than adding several weak projects to a portfolio.'
      }
    ]
  },
  'blog-interview-preparation-in-14-days': {
    title: 'Interview Preparation in 14 Days',
    eyebrow: 'Interviews',
    summary:
      'A disciplined two-week preparation plan to improve technical answers, project discussions, and interview confidence.',
    sections: [
      {
        heading: 'Week 1: Rebuild clarity and depth',
        image: '/images/blog/interview-cover.svg',
        imageAlt: 'Interview plan board',
        body:
          'The first week should strengthen fundamentals, sharpen role relevance, and improve how you explain your own work. Clarity matters more than volume.',
        items: [
          'Revise the concepts most likely to appear in your target role',
          'Prepare short and long versions of your project stories',
          'Record practice answers and correct unclear explanations'
        ]
      },
      {
        heading: 'Week 2: Train for decision pressure',
        body:
          'The second week should simulate real interview conditions. Timed practice improves composure, sequencing, and the ability to think clearly while being observed.',
        items: [
          'Run technical, HR, and behavioural mock rounds under time limits',
          'Review each session immediately after it ends',
          'Repeat difficult topics until your explanation becomes natural'
        ]
      },
      {
        heading: 'Interview day should feel familiar',
        body:
          'Carry a one-page preparation sheet with achievements, project metrics, strengths, and thoughtful questions. Good preparation makes the final conversation feel controlled rather than uncertain.'
      }
    ]
  },
  'blog-hr-expectations-from-freshers-2026': {
    title: 'What HR Teams Expect from Freshers in 2026',
    eyebrow: 'Hiring',
    summary:
      'Understand what hiring teams now value beyond marks, certificates, and generic enthusiasm.',
    sections: [
      {
        heading: 'Freshers are judged on readiness, not only potential',
        image: '/images/blog/hr-expectations-cover.svg',
        imageAlt: 'Recruiter expectation visual',
        body:
          'Hiring teams want signs that a fresher can learn quickly, communicate well, and behave professionally from the first week onward.',
        items: [
          'Clear communication in conversation and writing',
          'Evidence of ownership in projects or internships',
          'Consistency in preparation, punctuality, and follow-up'
        ]
      },
      {
        heading: 'What weakens an otherwise good profile',
        body:
          'A fresher can lose momentum quickly when the profile looks generic, the project work is not explained well, or the interview answers sound unstructured.',
        items: [
          'No clear role preference or career direction',
          'Weak evidence of practical work beyond academics',
          'Inconsistent answers about contribution and learning'
        ]
      },
      {
        heading: 'How freshers stand out today',
        body:
          'Freshers stand out by showing focused preparation, practical curiosity, and the ability to learn from feedback quickly. Employers remember candidates who sound prepared, grounded, and genuinely employable.'
      }
    ]
  },
  'blog-common-application-mistakes': {
    title: 'Common Application Mistakes and How to Avoid Them',
    eyebrow: 'Applications',
    summary:
      'Correct the avoidable mistakes that reduce shortlist rates, weaken credibility, and slow down responses.',
    sections: [
      {
        heading: 'Application quality begins before you click apply',
        image: '/images/blog/application-mistakes-cover.svg',
        imageAlt: 'Application quality checks visual',
        body:
          'Candidates often focus on volume instead of quality. Incomplete profiles, vague resumes, and inconsistent contact details undermine strong opportunities before they even reach review.',
        items: [
          'Keep profile information current and accurate',
          'Tailor the opening section of the resume to the role',
          'Review every submission before sending it'
        ]
      },
      {
        heading: 'Poor communication creates silent rejection',
        body:
          'Many good candidates lose trust because replies are late, messages are vague, or follow-up never happens after an interview or screening call.',
        items: [
          'Reply promptly and professionally to recruiter messages',
          'Use concise, respectful follow-ups that add context',
          'Close important conversations with clarity and courtesy'
        ]
      },
      {
        heading: 'A one-week reset can change response quality',
        body:
          'Audit active applications, refine your best resume versions, and improve the quality of every new submission. Consistent application hygiene often produces stronger outcomes than sending more applications.'
      }
    ]
  },
  'about-us': {
    title: 'About HHH Jobs',
    eyebrow: 'Company',
    summary:
      'HHH Jobs exists to make hiring more credible, more responsive, and more useful for both employers and professionals.',
    sections: [
      {
        heading: 'What HHH Jobs stands for',
        body:
          'HHH Jobs is built around a simple idea: people make better hiring decisions when information is clear, communication is timely, and the process feels dependable from the first click to the final decision.'
      },
      {
        heading: 'What users should expect',
        body:
          'Every part of the experience is designed to support serious hiring and serious career movement:',
        items: [
          'Well-structured job information that helps users decide quickly',
          'Clearer interactions between employers and applicants',
          'Public support and policy pages that explain how the platform works',
          'A stronger emphasis on trust, safety, and professional conduct'
        ]
      }
    ]
  },
  'contact-us': {
    title: 'Contact Us',
    eyebrow: 'Support',
    summary:
      'Reach the right HHH Jobs team for support, partnerships, hiring assistance, or general enquiries.',
    sections: [
      {
        heading: 'Support Requests',
        body:
          'Use the support route for account access issues, application problems, platform errors, or any urgent help related to using HHH Jobs.'
      },
      {
        heading: 'Business & Partnerships',
        body:
          'Regional employer onboarding, partnership discussions, and commercial conversations are handled through our business contact paths.'
      },
      {
        heading: 'General Information',
        body:
          'Use the general contact path for platform questions, company information, or non-urgent communication that does not require support intervention.'
      },
      {
        heading: 'Careers & HR',
        body:
          'If your message is related to careers with HHH Jobs, use the HR route so your enquiry reaches the appropriate team without delay.'
      }
    ]
  },
  careers: {
    title: 'Careers at HHH Jobs',
    eyebrow: 'Careers',
    summary:
      'Join a team committed to building a more credible, more responsive, and more human hiring experience.',
    sections: [
      {
        heading: 'Work that has visible impact',
        body:
          'At HHH Jobs, every role contributes to how employers discover talent and how professionals experience opportunity. We care about work that improves outcomes, not activity that only fills time.'
      },
      {
        heading: 'Why work with us',
        body:
          'We value thoughtful execution, mutual respect, and meaningful contribution. Strong teams are built through high standards, honest collaboration, and room to grow.',
        items: [
          'Purpose-led work connected to real hiring and career outcomes',
          'Opportunities to grow through responsibility and cross-functional learning',
          'A culture that values clear communication and accountability',
          'The chance to improve a product people use for decisions that matter'
        ]
      },
      {
        heading: 'Who thrives here',
        body:
          'We look for professionals who combine competence with judgement. Curiosity matters, but so do discipline, professionalism, and care for the end user.',
        items: [
          'Problem-solvers who can simplify complex situations',
          'Professionals who communicate clearly and act responsibly',
          'People who can improve systems, not just operate inside them',
          'Team members who respect quality, trust, and consistency'
        ]
      },
      {
        heading: 'Career growth at HHH Jobs',
        body:
          'A strong career here comes from doing work well, learning quickly, and improving how the platform serves its users. We value people who raise the standard over time.'
      },
      {
        heading: 'How to explore opportunities',
        body:
          'If our mission and way of working resonate with you, explore current openings and apply for the role where your capability can create the strongest contribution.'
      }
    ]
  },
  'employer-home': {
    title: 'Employer Home',
    eyebrow: 'For Employers',
    summary:
      'A clearer, more dependable hiring environment for employers who value quality, speed, and accountability.',
    sections: [
      {
        heading: 'Hire with more confidence',
        body:
          'HHH Jobs helps employers present roles more clearly, review talent more efficiently, and maintain a more credible hiring experience from posting to final interaction.'
      },
      {
        heading: 'Who we support',
        body:
          'Whether you are building your first team, expanding a specialist function, or strengthening a mature operation, the platform is designed to support structured and professional hiring.'
      },
      {
        heading: 'What employers gain',
        body:
          'The employer experience is built around decision quality and operational ease:',
        items: [
          'Structured job pages that communicate role expectations clearly',
          'Faster access to relevant applicants and hiring conversations',
          'A more organised way to review fit, skills, and readiness',
          'Supportive public and policy pages that strengthen employer trust'
        ]
      },
      {
        heading: 'Why employers choose HHH Jobs',
        body:
          'Employers choose HHH Jobs when they want hiring that feels cleaner and more credible:',
        items: [
          'Clarity in job information and candidate communication',
          'Speed without sacrificing professionalism or process quality',
          'Trust built through stronger standards and visible support'
        ]
      },
      {
        heading: 'The real objective',
        body:
          'The goal is not only to generate applications. The goal is to help employers reach better-fit people and move hiring decisions forward with less friction and more confidence.'
      }
    ]
  },
  sitemap: {
    title: 'Sitemap',
    eyebrow: 'Navigation',
    summary:
      'A practical guide to the main public pages, hiring destinations, candidate journeys, and policy resources across HHH Jobs.',
    sections: [
      {
        heading: 'Core public pages',
        body:
          'The public experience includes homepage discovery, account access, company information, support pages, legal pages, and editorial resources.'
      },
      {
        heading: 'Candidate and employer journeys',
        body:
          'Job seekers can move into search, profile, application, and guidance pages. Employers can move into company visibility, service information, hiring support, and protected account areas.',
        items: [
          'Candidates: jobs, applications, profile improvement, and hiring guidance',
          'Employers: recruiter journeys, companies, services, and employer support',
          'Experienced professionals: dedicated discovery routes and tailored positioning'
        ]
      },
      {
        heading: 'Support and trust resources',
        body:
          'Support pages help users raise concerns, find guidance, understand policies, and navigate the platform with greater confidence.'
      },
      {
        heading: 'Why this page matters',
        body:
          'Use the sitemap when you want a fast overview of the site structure, need to compare content areas, or want to move quickly between discovery, support, and policy pages.'
      }
    ]
  },
  credits: {
    title: 'Credits',
    eyebrow: 'Acknowledgements',
    summary:
      'HHH Jobs is shaped by product thinking, editorial discipline, partner trust, and the feedback of people who use the platform every day.',
    sections: [
      {
        heading: 'Platform stewardship',
        body:
          'This page recognises the collective effort behind HHH Jobs. A credible hiring platform depends on clear thinking, careful execution, and the people who uphold standards across every part of the experience.'
      },
      {
        heading: 'Content and editorial quality',
        body:
          'Strong public content helps users move with confidence. We value the editorial effort that turns hiring topics, policy information, and support guidance into pages that are easy to understand and useful to act on.',
        items: [
          'Audience-first writing that explains without overwhelming',
          'Clear structure that helps users find answers quickly',
          'A tone that respects both employers and job seekers'
        ]
      },
      {
        heading: 'Design and experience standards',
        body:
          'We also recognise the discipline required to create pages, interactions, and layouts that feel professional, accessible, and easy to trust. Good design reduces confusion and improves decisions.'
      },
      {
        heading: 'Employer and candidate insight',
        body:
          'Real-world feedback from employers, candidates, and experienced professionals plays an important role in shaping the platform. Their perspective helps us understand what needs to be clearer, faster, and more valuable.',
        items: [
          'Hiring-side feedback on role clarity and candidate quality',
          'Candidate-side feedback on trust, usability, and communication',
          'Professional input that improves relevance across pages and flows'
        ]
      },
      {
        heading: 'Partners and support functions',
        body:
          'The platform also benefits from operational support, business partnerships, and responsible coordination that keep the experience responsive and dependable.'
      },
      {
        heading: 'A continuing commitment',
        body:
          'HHH Jobs continues to evolve through thoughtful improvement. We remain committed to raising the standard of the platform in ways that serve people, not just systems.'
      }
    ]
  },
  'help-center': {
    title: 'Help Center',
    eyebrow: 'Support',
    summary:
      'Find clear answers, practical guidance, and the right support path for using HHH Jobs with confidence.',
    sections: [
      {
        heading: 'Start with the right support path',
        body:
          'The Help Center is designed to reduce uncertainty. Whether you are applying for jobs, managing hiring activity, or resolving an account issue, start here to find the right route quickly.'
      },
      {
        heading: 'Help for job seekers',
        body:
          'Candidates can use this area to understand job search steps, profile quality, application progress, account access, and other practical questions that affect day-to-day use.',
        items: [
          'Creating and managing a complete profile',
          'Understanding applications, updates, and next steps',
          'Navigating access, password, and account support'
        ]
      },
      {
        heading: 'Help for employers',
        body:
          'Employers can use the Help Center to understand posting workflows, candidate review, support routes, and the best page for resolving operational questions.',
        items: [
          'Posting and managing hiring requirements',
          'Understanding employer support and service routes',
          'Resolving platform questions that affect hiring activity'
        ]
      },
      {
        heading: 'When to use another page',
        body:
          'Some concerns are better handled through a specialised page. Use Report Issue for platform or listing problems, Grievances for formal complaints, and Contact Us when you need direct assistance.'
      },
      {
        heading: 'What helps support respond faster',
        body:
          'When contacting support, include the page you were using, the action you took, and any relevant screenshots or account details. Clear context helps our team respond more accurately.'
      },
      {
        heading: 'Our support promise',
        body:
          'We aim to make support practical, respectful, and easy to follow. The Help Center exists to keep users informed, reduce unnecessary friction, and guide each person to the right next step.'
      }
    ]
  },
  'summons-notices': {
    title: 'Summons / Notices',
    eyebrow: 'Legal',
    summary:
      'This page is reserved for official legal, regulatory, or policy communications that users may need to review carefully.',
    sections: [
      {
        heading: 'Purpose of this page',
        body:
          'HHH Jobs uses this page as a formal public record for notices that are significant to platform operations, legal compliance, policy changes, or user obligations.'
      },
      {
        heading: 'What are summons and notices',
        body:
          'A summons is generally a formal communication issued in a legal, regulatory, or administrative context that may require a response. A notice is broader and usually communicates updates, obligations, deadlines, or policy changes that users should be aware of.',
      },
      {
        heading: 'What may appear here',
        body:
          'When necessary, this page may include important communications such as:',
        items: [
          'Policy notices that materially affect platform use',
          'Regulatory or legal communications relevant to users',
          'Compliance-related announcements linked to account or service obligations',
          'Formal updates concerning data, conduct, or service terms'
        ]
      },
      {
        heading: 'How to read these communications',
        body:
          'Each published communication should be reviewed for its date, scope, and any actions required. If a notice relates to your account or activity, read it in full before taking any next step.',
        items: [
          'Check whether the notice applies to all users or only a specific category',
          'Review any dates, deadlines, or required responses carefully',
          'Use the contact route provided if clarification is needed'
        ]
      },
      {
        heading: 'Questions and clarification',
        body:
          'If you need help understanding a specific notice, contact HHH Jobs support through the appropriate route so the matter can be reviewed and clarified responsibly.'
      }
    ]
  },
  grievances: {
    title: 'Grievances',
    eyebrow: 'Resolution',
    summary:
      'HHH Jobs provides a formal route for concerns that require fair review, clear documentation, and responsible resolution.',
    sections: [
      {
        heading: 'When to use the grievance route',
        body:
          'Use the grievance process when a concern is serious enough to require structured review, documented follow-up, and a formal response rather than a simple support answer.'
      },
      {
        heading: 'What counts as a grievance',
        body:
          'A grievance may relate to platform conduct, listing concerns, account handling, service quality, or another issue that has materially affected your experience. This may include:',
        items: [
          'Concerns about job postings, applications, or communication',
          'Questions regarding conduct, fairness, or platform standards',
          'Issues involving policy interpretation, account handling, or service experience',
          'Safety-related concerns that require a formal record and review'
        ]
      },
      {
        heading: 'How grievances are reviewed',
        body:
          'Every grievance is reviewed through a process built around fairness, documentation, and accountability:',
        items: [
          'Submission of the concern with complete background information',
          'Acknowledgement and initial triage by the relevant team',
          'Review of facts, records, and any supporting material',
          'Clear response outlining findings, action, or next steps',
          'Further follow-up when additional clarification is required'
        ]
      },
      {
        heading: 'What helps us resolve matters well',
        body:
          'The strongest grievance submissions are factual, specific, and well documented. Helpful details include dates, screenshots, account identifiers, and a concise explanation of the concern and expected resolution.'
      },
      {
        heading: 'Our commitment to fairness',
        body:
          'HHH Jobs takes grievances seriously because trust is central to platform credibility. The aim is to review concerns with care, respond respectfully, and improve the experience where improvement is needed.'
      },
      {
        heading: 'Need to submit a grievance?',
        body:
          'If your concern requires formal review, use the grievance route with complete details so the matter can be assessed accurately and without unnecessary delay.'
      }
    ]
  },
  'report-issue': {
    title: 'Report an Issue',
    eyebrow: 'Issue Reporting',
    summary:
      'Use this page to report technical issues, suspicious activity, or platform problems that require review and action.',
    sections: [
      {
        heading: 'What should be reported here',
        body:
          'This route is best for platform errors, broken workflows, misleading listings, suspicious activity, or anything else that affects safe and reliable use of HHH Jobs.'
      },
      {
        heading: 'Common report types',
        body:
          'You can use this page for problems such as:',
        items: [
          'Login, application, posting, or navigation failures',
          'Suspicious listings, misleading content, or unsafe behaviour',
          'Broken links, incorrect information, or visual defects that affect usability',
          'Policy concerns that need investigation but are not yet a formal grievance'
        ]
      },
      {
        heading: 'How the review process works',
        body:
          'Most issue reviews follow a simple path from submission to acknowledgement, investigation, and follow-up. The more precise the report, the easier it is to review efficiently.',
        items: [
          'Submit the issue with clear context',
          'Receive acknowledgement and initial review',
          'Allow time for investigation or clarification if needed',
          'Receive an update or resolution path from the team'
        ]
      },
      {
        heading: 'What helps us investigate faster',
        body:
          'Helpful reports usually include the page name, the action taken, what went wrong, and any visual proof that can help confirm the issue quickly.',
        items: [
          'Mention whether the issue affects candidates, employers, or both',
          'Add screenshots when the problem is visual or workflow-related',
          'Share listing links, usernames, or timestamps where relevant',
          'State whether the issue is urgent, repeated, or safety-related'
        ]
      },
      {
        heading: 'When to use another route',
        body:
          'If the matter is a formal complaint, use the Grievances page. If you need general support or guidance, use Contact Us or the Help Center for the fastest route.'
      }
    ]
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    eyebrow: 'Policy',
    summary:
      'This Privacy Policy explains how HHH Jobs collects, uses, protects, and manages personal information in connection with its services.',
    sections: [
      {
        heading: '1. Scope and effective date',
        body:
          'Effective Date: March 2, 2026. This policy applies to information collected through HHH Jobs when users browse the platform, create accounts, apply for opportunities, manage hiring activity, or contact the team.'
      },
      {
        heading: '2. Information we collect',
        body:
          'We may collect information that users provide directly, along with technical and usage information needed to operate, secure, and improve the platform. This may include:',
        items: [
          'Name, email address, phone number, and profile details',
          'Professional, employment, or business information relevant to the service',
          'Account credentials and communication records',
          'Device, browser, IP, usage, and interaction data'
        ]
      },
      {
        heading: '3. How information is used',
        body:
          'Information may be used to create and manage accounts, support hiring and application workflows, communicate service updates, maintain security, respond to support requests, and improve platform quality. We aim to collect and use only what is reasonably necessary for these purposes.'
      },
      {
        heading: '4. When information may be shared',
        body:
          'HHH Jobs may share information with service providers and operational partners that help deliver the platform, with employers or candidates where that sharing is necessary for service use, and with lawful authorities where disclosure is required. HHH Jobs does not sell personal data for commercial resale.'
      },
      {
        heading: '5. Cookies and similar technologies',
        body:
          'Cookies and similar technologies may be used to support account sessions, remember preferences, understand usage, and improve performance. Users may manage cookie behaviour through browser settings, subject to the impact on site functionality.'
      },
      {
        heading: '6. Security and retention',
        body:
          'HHH Jobs uses reasonable administrative, technical, and organisational safeguards to protect personal information against unauthorised access, loss, misuse, or disclosure. Information may be retained for as long as it is needed for service delivery, compliance, security, or legitimate operational purposes.'
      },
      {
        heading: '7. Your rights and choices',
        body:
          'Depending on applicable law and the nature of your relationship with the platform, you may have rights regarding your personal information, such as:',
        items: [
          'Accessing, correcting, or requesting deletion of certain information',
          'Managing communication preferences',
          'Requesting more information about how data is used'
        ]
      },
      {
        heading: '8. Policy updates and contact',
        body:
          'This policy may be updated from time to time to reflect changes in law, technology, operations, or platform features. Updated versions will be posted on this page with the revised effective date. If you have questions about this policy or need to raise a data-related request, please use the contact or support routes listed on HHH Jobs.'
      }
    ]
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    eyebrow: 'Policy',
    summary:
      'These Terms and Conditions govern access to and use of HHH Jobs, including its public pages, accounts, services, and related interactions.',
    sections: [
      {
        heading: '1. Acceptance of terms',
        body:
          'Effective Date: March 2, 2026. By accessing or using HHH Jobs, users agree to these Terms and Conditions. If you do not agree, you should not use the platform or its services.'
      },
      {
        heading: '2. Eligibility and account information',
        body:
          'Users must meet the applicable age and eligibility requirements for account creation and use. By registering, you confirm that the information you provide is accurate, current, and complete.'
      },
      {
        heading: '3. Account security',
        body:
          'Users are responsible for maintaining the confidentiality of their credentials and for activity that occurs under their account. You should notify HHH Jobs promptly if you believe your account has been compromised.',
        items: [
          'Provide truthful and current registration details',
          'Protect account credentials from unauthorised use',
          'Inform HHH Jobs promptly of suspected misuse'
        ]
      },
      {
        heading: '4. Listings, applications, and platform role',
        body:
          'Employers must provide lawful, accurate, and non-misleading job information. Candidates must provide truthful and relevant application details. HHH Jobs operates as a platform that supports connections between parties but does not guarantee hiring outcomes, placements, or suitability.'
      },
      {
        heading: '5. Acceptable conduct',
        body:
          'Users must engage with the platform and one another respectfully and lawfully. The following standards apply to all interactions:',
        items: [
          'Communicate respectfully with other users',
          'Avoid harassment, abuse, discrimination, or deception',
          'Do not upload unlawful, harmful, or misleading content',
          'Comply with all applicable laws'
        ]
      },
      {
        heading: '6. Content ownership and permitted use',
        body:
          'Unless otherwise stated, platform content, branding, copy, graphics, and software are owned by HHH Jobs or its licensors. Users may access and use this content only as necessary for lawful use of the platform and may not reproduce or distribute it without permission.'
      },
      {
        heading: '7. Service availability and limitation of liability',
        body:
          'HHH Jobs aims to provide a reliable platform but does not guarantee uninterrupted, error-free, or outcome-assured service. To the extent permitted by law, liability is limited in relation to matters such as:',
        items: [
          'Employment or recruitment outcomes',
          'Accuracy of third-party content or conduct',
          'Losses arising from platform use, interruption, or reliance'
        ]
      },
      {
        heading: '8. Suspension or termination',
        body:
          'HHH Jobs may suspend or terminate access where necessary to protect users, enforce policy, or comply with legal obligations, including situations such as:',
        items: [
          'Violation of these terms',
          'Suspected fraudulent or harmful activity',
          'Requirements arising from law, compliance, or safety'
        ]
      },
      {
        heading: '9. Changes to these terms',
        body:
          'These Terms and Conditions may be updated from time to time. Revised terms will be posted on this page with an updated effective date, and continued use after that point indicates acceptance of the revised version.'
      },
      {
        heading: '10. Governing law and contact',
        body:
          'These terms are governed by the laws applicable to the jurisdiction in which HHH Jobs operates, subject to any mandatory legal requirements. Questions about these terms may be directed through the appropriate HHH Jobs contact route.'
      }
    ]
  },
  'fraud-alert': {
    title: 'Fraud Alert',
    eyebrow: 'Safety',
    summary:
      'Stay alert to scams, misleading offers, and suspicious communication that can appear in online hiring environments.',
    sections: [
      {
        heading: 'Why this page matters',
        body:
          'Most activity on HHH Jobs is genuine and professional, but online hiring always requires vigilance. This page helps users recognise common warning signs and respond with care.'
      },
      {
        heading: 'What fraud can look like',
        body:
          'Fraud in hiring environments usually involves deception intended to obtain money, sensitive information, or trust under false pretences. Common examples include:',
        items: [
          'Fake job offers requesting fees, deposits, or payments',
          'Requests for sensitive financial or identity details too early in the process',
          'Impersonation of recruiters, companies, or support teams',
          'Unrealistic offers designed to pressure quick decisions'
        ]
      },
      {
        heading: 'Warning signs to notice early',
        body:
          'The following patterns often signal elevated risk:',
        items: [
          'Any request for money, gift cards, or paid access to secure a role',
          'Pressure to share bank details, passwords, or identity data without a valid process',
          'Messages sent through suspicious channels with vague or rushed language',
          'Job offers that promise unusually high rewards with very little scrutiny'
        ]
      },
      {
        heading: 'How HHH Jobs helps reduce risk',
        body:
          'HHH Jobs works to reduce fraud through a mix of review practices, policy enforcement, and user reporting tools:',
        items: [
          'Monitoring for suspicious listings and account activity',
          'Verification measures where appropriate',
          'Clear reporting routes for suspicious behaviour',
          'Support follow-up when credible concerns are raised'
        ]
      },
      {
        heading: 'What to do if something feels wrong',
        body:
          'If you believe a listing, message, or account may be fraudulent, act carefully and avoid further engagement until the matter is reviewed.',
        items: [
          'Do not respond further to suspicious communication',
          'Report the concern through HHH Jobs as soon as possible',
          'Preserve screenshots, links, names, and relevant context',
          'Avoid sharing money or sensitive information until legitimacy is confirmed'
        ]
      },
      {
        heading: 'Safe application habits',
        body:
          'Good caution protects both candidates and employers. Read listings carefully, verify communication, question unusual urgency, and use official support routes whenever something appears inconsistent or unsafe.'
      }
    ]
  },
  'trust-and-safety': {
    title: 'Trust & Safety',
    eyebrow: 'Safety',
    summary:
      'Trust and safety are essential to a hiring platform where people share information, evaluate opportunity, and make consequential decisions.',
    sections: [
      {
        heading: 'Our trust standard',
        body:
          'HHH Jobs is designed to support a professional environment where listings, communication, and account behaviour are held to clear standards of credibility and respect.'
      },
      {
        heading: 'How we protect the platform',
        body:
          'Trust is supported through policy, review, reporting, and operational oversight. The aim is to reduce misuse, respond to concerns responsibly, and maintain a more dependable experience for all users.',
        items: [
          'Review practices that help reduce misleading or unsafe activity',
          'Policies that define acceptable behaviour and content quality',
          'Support and reporting routes for concerns that need attention',
          'Responsible handling of account and usage information'
        ]
      },
      {
        heading: 'Respectful conduct matters',
        body:
          'Candidates, employers, and all other users are expected to communicate professionally and act in good faith. Trust breaks down quickly when information is misleading or conduct is disrespectful.'
      },
      {
        heading: 'Reporting and enforcement',
        body:
          'When concerns are reported, HHH Jobs may review records, request clarification, limit access, remove content, or take other action that is appropriate to the issue and consistent with platform policy.'
      },
      {
        heading: 'A shared responsibility',
        body:
          'Platform safety is strongest when users remain attentive, provide accurate information, and report concerns early. A trustworthy environment is maintained through both platform standards and responsible user behaviour.'
      },
      {
        heading: 'Support when you need it',
        body:
          'If you need help with suspicious activity, policy questions, or conduct concerns, use the available support, issue reporting, or grievance routes so the matter can be reviewed through the correct process.'
      }
    ]
  }
};
