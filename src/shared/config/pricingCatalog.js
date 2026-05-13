export const hrStarterPricing = {
  slug: 'hr_starter',
  name: 'HR Starter',
  listPrice: 999,
  trialRenewalPrice: 399,
  currency: 'INR',
  billingCycle: 'monthly',
  trialDays: 30,
  discountText: 'After trial ₹399/month'
};

export const jobPostingPlans = [
  {
    title: 'Premium',
    slug: 'hot_vacancy',
    tone: 'premium',
    price: '₹999',
    numericPrice: 999,
    previousPrice: '₹1,600',
    discountText: 'Launch offer',
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
    offerText: 'Trial starts today · renewal at ₹399/month for HR Starter',
    ctaLabel: 'Start trial',
    ctaTo: '/sign-up?plan=hot_vacancy&role=hr',
    withQuantity: true,
    validity: 'Job validity 30 days'
  },
  {
    title: 'Pro',
    slug: 'classified',
    tone: 'pro',
    price: '₹699',
    numericPrice: 699,
    previousPrice: '₹1,100',
    discountText: 'Launch offer',
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
    offerText: 'Flat 10% OFF on 5 Job Postings or more',
    ctaLabel: 'Buy now',
    ctaTo: '/sign-up?plan=classified&role=hr',
    withQuantity: true,
    validity: 'Job validity 30 days'
  },
  {
    title: 'Standard',
    slug: 'standard',
    tone: 'standard',
    price: '₹399',
    numericPrice: 399,
    previousPrice: '₹999',
    discountText: 'After-trial price',
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
    offerText: 'Best entry paid plan after free trial',
    ctaLabel: 'Start trial',
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
