export const hrStarterPricing = {
  slug: 'hr_starter',
  name: 'HR Starter',
  listPrice: 999,
  trialRenewalPrice: 499,
  currency: 'INR',
  billingCycle: 'monthly',
  trialDays: 60,
  discountText: 'After trial ₹499/month'
};

export const jobPostingPlans = [
  {
    title: 'Premium',
    slug: 'premium',
    tone: 'premium',
    price: '₹699',
    numericPrice: 699,
    previousPrice: '',
    discountText: 'Plan post',
    taxNote: '*GST as applicable',
    features: [
      { label: 'Detailed job description', included: true },
      { label: '20 job locations', included: true },
      { label: 'Unlimited applies', included: true },
      { label: 'Applies expiry 90 days', included: true },
      { label: 'Jobseeker contact details visible', included: true },
      { label: 'Boost on Job Search Page', included: true },
      { label: 'Job Branding', included: true }
    ],
    offerText: 'Premium posts are managed through recruiter plans',
    ctaLabel: 'View plans',
    ctaTo: '/sign-up?plan=hot_vacancy&role=hr',
    withQuantity: true,
    validity: 'Job validity 30 days'
  },
  {
    title: 'Hot Vacancy',
    slug: 'hot_vacancy',
    tone: 'pro',
    price: '₹299',
    numericPrice: 299,
    previousPrice: '',
    discountText: 'Plan post',
    taxNote: '*GST as applicable',
    features: [
      { label: 'Upto 250 character job description', included: true },
      { label: '8 job locations', included: true },
      { label: 'Unlimited applies', included: true },
      { label: 'Applies expiry 60 days', included: true },
      { label: 'Jobseeker contact details visible', included: true },
      { label: 'Boost on Job Search Page', included: false },
      { label: 'Job Branding', included: false }
    ],
    offerText: 'Hot vacancy posts are managed through recruiter plans',
    ctaLabel: 'Buy now',
    ctaTo: '/sign-up?plan=classified&role=hr',
    withQuantity: true,
    validity: 'Job validity 30 days'
  },
  {
    title: 'Normal',
    slug: 'standard',
    tone: 'standard',
    price: '₹99',
    numericPrice: 99,
    previousPrice: '',
    discountText: 'Plan post',
    taxNote: '*GST as applicable',
    features: [
      { label: 'Upto 250 character job description', included: true },
      { label: '3 job locations', included: true },
      { label: '200 applies', included: true },
      { label: 'Applies expiry 30 days', included: true },
      { label: 'Jobseeker contact details visible', included: false },
      { label: 'Boost on Job Search Page', included: false },
      { label: 'Job Branding', included: false }
    ],
    offerText: 'Normal posts are managed through recruiter plans',
    ctaLabel: 'View plans',
    ctaTo: '/sign-up?plan=standard&role=hr',
    withQuantity: true,
    validity: 'Job validity 15 days'
  },
  {
    title: 'Free',
    slug: 'free',
    tone: 'free',
    price: 'Free',
    numericPrice: 0,
    subTitle: 'Job Posting',
    features: [
      { label: 'Upto 250 character job description', included: true },
      { label: '1 job location', included: true },
      { label: '50 applies', included: true },
      { label: 'Applies expiry 15 days', included: true },
      { label: 'Jobseeker contact details visible', included: false },
      { label: 'Boost on Job Search Page', included: false },
      { label: 'Job Branding', included: false }
    ],
    ctaLabel: 'Post a free job',
    ctaTo: '/sign-up?plan=free&role=hr',
    withQuantity: false,
    validity: 'Job validity 7 days'
  }
];
