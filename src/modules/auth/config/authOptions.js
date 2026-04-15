export const socialRoleOptions = [
  { value: 'student', label: 'Student / Candidate', description: 'Apply for roles, track applications, and manage your profile.' },
  { value: 'retired_employee', label: 'Retired Employee', description: 'Explore opportunities designed for experienced professionals.' }
];

export const signupRoleOptions = [
  { value: 'student', label: 'Student / Candidate', description: 'Apply for roles, track applications, and manage your profile.' },
  { value: 'hr', label: 'Employer / Recruiter', description: 'Manage openings, applicants, and hiring communication.' },
  { value: 'retired_employee', label: 'Retired Employee', description: 'Explore opportunities designed for experienced professionals.' }
];

export const genderOptions = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' }
];

export const casteOptions = [
  { value: '', label: 'Select caste category' },
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ews', label: 'EWS' }
];

export const religionOptions = [
  { value: '', label: 'Select religion' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'christian', label: 'Christian' },
  { value: 'jain', label: 'Jain' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'other', label: 'Other' }
];

export const countryCodeOptions = [
  { code: '+91', label: 'India (+91)', digits: 10 },
  { code: '+1', label: 'USA/Canada (+1)', digits: 10 },
  { code: '+44', label: 'UK (+44)', digits: 10 },
  { code: '+61', label: 'Australia (+61)', digits: 9 },
  { code: '+971', label: 'UAE (+971)', digits: 9 }
];

export const loginShellBenefits = [
  {
    title: 'Secure sign-in',
    description: 'Access your HHH Jobs account through a clear and protected sign-in flow.'
  },
  {
    title: 'Role-specific access',
    description: 'Candidates, recruiters, and experienced professionals enter the experience built for them.'
  },
  {
    title: 'Flexible login options',
    description: 'Eligible accounts can continue with Google or LinkedIn, or sign in with email anytime.'
  }
];

export const signupShellBenefits = [
  {
    title: 'Role-fit account setup',
    description: 'Each registration path is designed around the information most relevant to that account type.'
  },
  {
    title: 'Clear profile creation',
    description: 'The signup flow keeps account creation straightforward, professional, and easy to complete.'
  },
  {
    title: 'Smooth verification',
    description: 'Users can complete registration with the right sign-up and verification path for their role.'
  }
];

export const forgotPasswordBenefits = [
  {
    title: 'Protected recovery',
    description: 'Password reset follows a secure path that helps protect account access.'
  },
  {
    title: 'Step-by-step guidance',
    description: 'Each stage is presented clearly so users can complete recovery without confusion.'
  }
];

export const otpBenefits = [
  {
    title: 'Verified access',
    description: 'OTP confirmation helps ensure the right user is completing the next account step.'
  },
  {
    title: 'Quick confirmation',
    description: 'The process stays focused so users can complete verification with minimal delay.'
  }
];

export const oauthBenefits = [
  {
    title: 'Secure handoff',
    description: 'Social sign-in responses are processed safely before users continue into the platform.'
  },
  {
    title: 'Account continuity',
    description: 'Role-based account access stays organised and ready for the next step after sign-in.'
  }
];
