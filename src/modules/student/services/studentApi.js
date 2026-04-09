import { apiFetch } from '../../../utils/api';

const clone = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

const safeRequest = async ({ path, options, emptyData, extract = (payload) => payload }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, isDemo: false, error: '' };
  } catch (error) {
    return { data: clone(emptyData), isDemo: false, error: error.message || 'Request failed.' };
  }
};

export const mapProfileToForm = (profile = {}) => {
  const toLineArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => (typeof item === 'string' ? item : item?.value || item?.title || item?.text || ''))
      .filter(Boolean);
  };
  const toEducationEntries = (items) => {
    if (!Array.isArray(items)) return [];

    return items
      .map((item) => {
        if (typeof item === 'string') {
          return {
            educationLevel: '',
            isHighestQualification: false,
            courseName: item,
            specialization: '',
            universityBoard: '',
            instituteName: '',
            startYear: '',
            endYear: '',
            courseType: '',
            gradingSystem: '',
            marksValue: '',
            maxCgpa: '',
            educationStatus: 'completed',
            expectedCompletionYear: '',
            currentSemester: '',
            mediumOfEducation: '',
            backlogs: '',
            educationGap: ''
          };
        }

        const courseName = item?.courseName || item?.course_name || item?.degreeName || item?.degree_name || item?.value || '';
        if (typeof item !== 'object' || !courseName) return null;

        return {
          educationLevel: item?.educationLevel || item?.education_level || item?.level || '',
          isHighestQualification: Boolean(item?.isHighestQualification ?? item?.is_highest_qualification ?? false),
          courseName,
          specialization: item?.specialization || item?.stream || '',
          universityBoard: item?.universityBoard || item?.university_board || item?.board || '',
          instituteName: item?.instituteName || item?.institute_name || item?.college || '',
          startYear: String(item?.startYear || item?.start_year || ''),
          endYear: String(item?.endYear || item?.end_year || item?.passingYear || item?.passing_year || ''),
          courseType: item?.courseType || item?.course_type || '',
          gradingSystem: item?.gradingSystem || item?.grading_system || '',
          marksValue: String(item?.marksValue || item?.marks_value || item?.score || ''),
          maxCgpa: String(item?.maxCgpa || item?.max_cgpa || ''),
          educationStatus: item?.educationStatus || item?.education_status || 'completed',
          expectedCompletionYear: String(item?.expectedCompletionYear || item?.expected_completion_year || ''),
          currentSemester: item?.currentSemester || item?.current_semester || '',
          mediumOfEducation: item?.mediumOfEducation || item?.medium_of_education || '',
          backlogs: String(item?.backlogs || ''),
          educationGap: item?.educationGap || item?.education_gap || ''
        };
      })
      .filter(Boolean);
  };

  return {
    name: profile.name || '',
    email: profile.email || '',
    mobile: profile.mobile || '',
    gender: profile.gender || '',
    caste: profile.caste || '',
    religion: profile.religion || '',
    avatarUrl: profile.avatar_url || profile.avatarUrl || '',
    headline: profile.headline || '',
    targetRole: profile.target_role || profile.targetRole || '',
    profileSummary: profile.profile_summary || profile.profileSummary || '',
    careerObjective: profile.career_objective || profile.careerObjective || '',
    dateOfBirth: profile.date_of_birth || profile.dateOfBirth || '',
    maritalStatus: profile.marital_status || profile.maritalStatus || '',
    currentAddress: profile.current_address || profile.currentAddress || '',
    preferredWorkLocation: profile.preferred_work_location || profile.preferredWorkLocation || '',
    location: profile.location || '',
    currentPincode: profile.current_pincode || profile.currentPincode || '',
    permanentPincode: profile.permanent_pincode || profile.permanentPincode || '',
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    technicalSkills: Array.isArray(profile.technical_skills) ? profile.technical_skills : (Array.isArray(profile.technicalSkills) ? profile.technicalSkills : []),
    softSkills: Array.isArray(profile.soft_skills) ? profile.soft_skills : (Array.isArray(profile.softSkills) ? profile.softSkills : []),
    toolsTechnologies: Array.isArray(profile.tools_technologies) ? profile.tools_technologies : (Array.isArray(profile.toolsTechnologies) ? profile.toolsTechnologies : []),
    education: toLineArray(profile.education || profile.educationEntries),
    educationEntries: toEducationEntries(profile.education || profile.educationEntries),
    class10Details: profile.class_10_details || profile.class10Details || '',
    class12Details: profile.class_12_details || profile.class12Details || '',
    graduationDetails: profile.graduation_details || profile.graduationDetails || '',
    postGraduationDetails: profile.post_graduation_details || profile.postGraduationDetails || '',
    educationScore: profile.education_score || profile.educationScore || '',
    projects: toLineArray(profile.projects),
    internships: toLineArray(profile.internships),
    experience: toLineArray(profile.experience),
    certifications: toLineArray(profile.certifications),
    achievements: toLineArray(profile.achievements),
    languagesKnown: Array.isArray(profile.languages_known) ? profile.languages_known : (Array.isArray(profile.languagesKnown) ? profile.languagesKnown : []),
    resumeUrl: profile.resume_url || profile.resumeUrl || '',
    resumeText: profile.resume_text || profile.resumeText || '',
    portfolioUrl: profile.portfolio_url || profile.portfolioUrl || '',
    githubUrl: profile.github_url || profile.githubUrl || '',
    linkedinUrl: profile.linkedin_url || profile.linkedinUrl || '',
    facebookUrl: profile.facebook_url || profile.facebookUrl || '',
    instagramUrl: profile.instagram_url || profile.instagramUrl || '',
    eimagerId: profile.eimager_id || profile.eimagerId || '',
    preferredSalaryMin: profile.preferred_salary_min ?? profile.preferredSalaryMin ?? '',
    preferredSalaryMax: profile.preferred_salary_max ?? profile.preferredSalaryMax ?? '',
    expectedSalary: profile.expected_salary ?? profile.expectedSalary ?? '',
    preferredJobType: profile.preferred_job_type || profile.preferredJobType || '',
    availabilityToJoin: profile.availability_to_join || profile.availabilityToJoin || '',
    willingToRelocate: profile.willing_to_relocate ?? profile.willingToRelocate ?? '',
    noticePeriodDays: profile.notice_period_days ?? profile.noticePeriodDays ?? ''
  };
};

const buildProfilePayload = (form = {}) => {
  const toArrayObjects = (items) =>
    items
      .filter(Boolean)
      .map((item) => ({ value: item.trim() }))
      .filter((item) => item.value);
  const toNullableBoolean = (value) => {
    if (value === '' || value === undefined || value === null) return null;
    if (typeof value === 'boolean') return value;
    if (String(value).toLowerCase() === 'true') return true;
    if (String(value).toLowerCase() === 'false') return false;
    return null;
  };
  const toEducationPayload = (items) => {
    if (!Array.isArray(items)) return [];

    return items
      .map((item) => ({
        educationLevel: String(item?.educationLevel || '').trim(),
        isHighestQualification: Boolean(item?.isHighestQualification),
        courseName: String(item?.courseName || '').trim(),
        specialization: String(item?.specialization || '').trim(),
        universityBoard: String(item?.universityBoard || '').trim(),
        instituteName: String(item?.instituteName || '').trim(),
        startYear: String(item?.startYear || '').trim(),
        endYear: String(item?.endYear || '').trim(),
        courseType: String(item?.courseType || '').trim(),
        gradingSystem: String(item?.gradingSystem || '').trim(),
        marksValue: String(item?.marksValue || '').trim(),
        maxCgpa: String(item?.maxCgpa || '').trim(),
        educationStatus: String(item?.educationStatus || '').trim(),
        expectedCompletionYear: String(item?.expectedCompletionYear || '').trim(),
        currentSemester: String(item?.currentSemester || '').trim(),
        mediumOfEducation: String(item?.mediumOfEducation || '').trim(),
        backlogs: String(item?.backlogs || '').trim(),
        educationGap: String(item?.educationGap || '').trim()
      }))
      .filter((item) =>
        item.courseName
        || item.instituteName
        || item.universityBoard
        || item.specialization
        || item.startYear
        || item.endYear
        || item.expectedCompletionYear
      );
  };

  const educationFromEntries = toEducationPayload(form.educationEntries || []);

  return {
    name: form.name,
    mobile: form.mobile,
    gender: form.gender,
    caste: form.caste,
    religion: form.religion,
    avatarUrl: form.avatarUrl,
    headline: form.headline,
    targetRole: form.targetRole,
    profileSummary: form.profileSummary,
    careerObjective: form.careerObjective,
    dateOfBirth: form.dateOfBirth,
    maritalStatus: form.maritalStatus,
    currentAddress: form.currentAddress,
    preferredWorkLocation: form.preferredWorkLocation,
    location: form.location,
    currentPincode: form.currentPincode,
    permanentPincode: form.permanentPincode,
    skills: [
      ...(Array.isArray(form.technicalSkills) ? form.technicalSkills : []),
      ...(Array.isArray(form.softSkills) ? form.softSkills : []),
      ...(Array.isArray(form.toolsTechnologies) ? form.toolsTechnologies : [])
    ].filter(Boolean),
    technicalSkills: Array.isArray(form.technicalSkills) ? form.technicalSkills : [],
    softSkills: Array.isArray(form.softSkills) ? form.softSkills : [],
    toolsTechnologies: Array.isArray(form.toolsTechnologies) ? form.toolsTechnologies : [],
    education: educationFromEntries.length > 0
      ? educationFromEntries
      : toArrayObjects(form.education || []),
    class10Details: form.class10Details,
    class12Details: form.class12Details,
    graduationDetails: form.graduationDetails,
    postGraduationDetails: form.postGraduationDetails,
    educationScore: form.educationScore,
    projects: toArrayObjects(form.projects || []),
    internships: toArrayObjects(form.internships || []),
    experience: toArrayObjects(form.experience || []),
    certifications: toArrayObjects(form.certifications || []),
    achievements: toArrayObjects(form.achievements || []),
    // Temporary compatibility: some DBs still don't have `languages_known`.
    // Keep UI field local, but don't send it in update payload.
    // languagesKnown: Array.isArray(form.languagesKnown) ? form.languagesKnown : [],
    resumeUrl: form.resumeUrl,
    resumeText: form.resumeText,
    portfolioUrl: form.portfolioUrl,
    githubUrl: form.githubUrl,
    linkedinUrl: form.linkedinUrl,
    facebookUrl: form.facebookUrl,
    instagramUrl: form.instagramUrl,
    eimagerId: form.eimagerId,
    preferredSalaryMin: form.preferredSalaryMin === '' ? null : Number(form.preferredSalaryMin),
    preferredSalaryMax: form.preferredSalaryMax === '' ? null : Number(form.preferredSalaryMax),
    expectedSalary: form.expectedSalary === '' ? null : Number(form.expectedSalary),
    preferredJobType: form.preferredJobType,
    availabilityToJoin: form.availabilityToJoin,
    willingToRelocate: toNullableBoolean(form.willingToRelocate),
    noticePeriodDays: form.noticePeriodDays === '' ? null : Number(form.noticePeriodDays)
  };
};

export const getStudentProfile = async () => {
  const result = await safeRequest({
    path: '/student/profile',
    emptyData: {},
    extract: (payload) => payload?.profile || {}
  });

  return {
    ...result,
    data: mapProfileToForm(result.data)
  };
};

export const getStudentDashboardOverview = async () => {
  const result = await safeRequest({
    path: '/student/overview',
    emptyData: {
      profile: {},
      profileCompletion: 0,
      counters: {
        totalApplications: 0,
        savedJobs: 0,
        upcomingInterviews: 0,
        unreadNotifications: 0,
        atsChecks: 0
      },
      pipeline: {
        applied: 0,
        shortlisted: 0,
        interviewed: 0,
        offered: 0,
        rejected: 0,
        hired: 0,
        moved: 0
      },
      recommendedJobs: [],
      recentApplications: [],
      upcomingInterviews: [],
      recentNotifications: [],
      nextInterview: null
    },
    extract: (payload) => payload?.overview || {}
  });

  return {
    ...result,
    data: {
      ...result.data,
      profile: mapProfileToForm(result.data?.profile || {}),
      counters: result.data?.counters || {
        totalApplications: 0,
        savedJobs: 0,
        upcomingInterviews: 0,
        unreadNotifications: 0,
        atsChecks: 0
      },
      pipeline: result.data?.pipeline || {
        applied: 0,
        shortlisted: 0,
        interviewed: 0,
        offered: 0,
        rejected: 0,
        hired: 0,
        moved: 0
      },
      recommendedJobs: result.data?.recommendedJobs || [],
      recentApplications: result.data?.recentApplications || [],
      upcomingInterviews: result.data?.upcomingInterviews || [],
      recentNotifications: result.data?.recentNotifications || [],
      nextInterview: result.data?.nextInterview || null,
      profileCompletion: Number(result.data?.profileCompletion || 0)
    }
  };
};

export const updateStudentProfile = async (formState, options = {}) => {
  const payload = options?.prebuiltPayload ? formState : buildProfilePayload(formState);
  const updated = await strictRequest({
    path: '/student/profile',
    options: {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    extract: (responsePayload) => responsePayload?.profile || payload
  });

  return mapProfileToForm(updated);
};

export const updateStudentAvatar = async (avatarUrl) => {
  const updated = await strictRequest({
    path: '/student/profile',
    options: {
      method: 'PUT',
      body: JSON.stringify({ avatarUrl })
    },
    extract: (responsePayload) => responsePayload?.profile || {}
  });

  return mapProfileToForm(updated);
};

export const importStudentResume = async ({ resumeText = '', resumeUrl = '' } = {}) =>
  strictRequest({
    path: '/student/profile/import-resume',
    options: {
      method: 'POST',
      body: JSON.stringify({ resumeText, resumeUrl })
    },
    extract: (payload) => ({
      source: payload?.import?.source || '',
      warnings: payload?.import?.warnings || [],
      profileDraft: mapProfileToForm(payload?.import?.profileDraft || {})
    })
  });

export const uploadStudentResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  return strictRequest({
    path: '/student/upload/resume',
    options: {
      method: 'POST',
      body: formData
    },
    extract: (payload) => ({
      resumeUrl: payload?.resumeUrl || '',
      resumeText: payload?.resumeText || '',
      warnings: payload?.warnings || []
    })
  });
};

export const getFriendlyApplyErrorMessage = (error, fallback = 'Unable to apply right now.') => {
  const message = String(error?.message || '').trim();
  if (!message) return fallback;

  if (/resume is required/i.test(message)) {
    return 'Profile resume missing. Open Profile > Resume, upload or import your resume, then apply again.';
  }

  return message;
};

export const getStudentJobs = async (filters = {}) => {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 8);
  const params = new URLSearchParams();

  Object.entries({
    page,
    limit,
    search: filters.search,
    location: filters.location,
    employmentType: filters.employmentType,
    experienceLevel: filters.experienceLevel,
    category: filters.category,
    audience: filters.audience,
    status: 'open'
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, value);
    }
  });

  return safeRequest({
    path: `/jobs?${params.toString()}`,
    emptyData: {
      jobs: [],
      pagination: { page, limit, total: 0, totalPages: 1 }
    },
    extract: (payload) => ({
      jobs: payload?.jobs || [],
      pagination: payload?.pagination || { page, limit, total: 0, totalPages: 1 }
    })
  });
};

export const getStudentJobById = async (jobId) =>
  safeRequest({
    path: `/jobs/${jobId}`,
    emptyData: null,
    extract: (payload) => payload?.job || payload || null
  });

export const applyToJob = async ({ jobId, coverLetter = '' }) =>
  strictRequest({
    path: `/jobs/${jobId}/apply`,
    options: {
      method: 'POST',
      body: JSON.stringify({ useProfileResume: true, coverLetter })
    },
    extract: (payload) => payload?.application || payload
  });

export const getStudentApplications = async () =>
  safeRequest({
    path: '/student/applications',
    emptyData: [],
    extract: (payload) => payload?.applications || []
  });

export const getStudentSavedJobs = async () =>
  safeRequest({
    path: '/student/saved-jobs',
    emptyData: [],
    extract: (payload) => payload?.savedJobs || []
  });

export const saveJobForStudent = async (jobId) =>
  strictRequest({
    path: `/student/saved-jobs/${jobId}`,
    options: { method: 'POST', body: JSON.stringify({}) },
    extract: (payload) => payload?.savedJob || payload
  });

export const removeSavedJobForStudent = async (jobId) =>
  strictRequest({
    path: `/student/saved-jobs/${jobId}`,
    options: { method: 'DELETE', body: JSON.stringify({}) },
    extract: (payload) => payload?.removed || 0
  });

export const getStudentAlerts = async () =>
  safeRequest({
    path: '/student/alerts',
    emptyData: [],
    extract: (payload) => payload?.alerts || []
  });

export const createStudentAlert = async (alertPayload) =>
  strictRequest({
    path: '/student/alerts',
    options: { method: 'POST', body: JSON.stringify(alertPayload) },
    extract: (payload) => payload?.alert || payload
  });

export const updateStudentAlert = async (alertId, alertPayload) =>
  strictRequest({
    path: `/student/alerts/${alertId}`,
    options: { method: 'PATCH', body: JSON.stringify(alertPayload) },
    extract: (payload) => payload?.alert || payload
  });

export const deleteStudentAlert = async (alertId) =>
  strictRequest({
    path: `/student/alerts/${alertId}`,
    options: { method: 'DELETE', body: JSON.stringify({}) },
    extract: (payload) => payload?.removed || 0
  });

export const getStudentInterviews = async () =>
  safeRequest({
    path: '/student/interviews',
    emptyData: [],
    extract: (payload) => payload?.interviews || []
  });

export const getStudentAnalytics = async () =>
  safeRequest({
    path: '/student/analytics',
    emptyData: {
      totalApplications: 0,
      pipeline: {
        applied: 0,
        shortlisted: 0,
        interviewed: 0,
        offered: 0,
        rejected: 0,
        hired: 0
      },
      atsChecks: 0
    },
    extract: (payload) => payload?.analytics || {}
  });

export const getStudentNotifications = async () =>
  safeRequest({
    path: '/notifications',
    emptyData: [],
    extract: (payload) => payload?.notifications || []
  });

export const markNotificationRead = async (notificationId) =>
  strictRequest({
    path: `/notifications/${notificationId}/read`,
    options: { method: 'PATCH', body: JSON.stringify({}) },
    extract: (payload) => payload?.notification || payload
  });

export const markAllNotificationsRead = async () =>
  strictRequest({
    path: '/notifications/read-all',
    options: { method: 'PATCH', body: JSON.stringify({}) },
    extract: (payload) => payload
  });

export const getAtsHistory = async (jobId = '') => {
  const params = new URLSearchParams();
  if (jobId) params.set('jobId', jobId);

  return safeRequest({
    path: `/ats/history${params.toString() ? `?${params.toString()}` : ''}`,
    emptyData: [],
    extract: (payload) => payload?.checks || []
  });
};

export const deleteAtsHistoryItem = async (checkId) =>
  strictRequest({
    path: `/ats/history/${checkId}`,
    options: { method: 'DELETE' },
    extract: (payload) => payload
  });

export const runAtsCheck = async ({ jobId, source = 'profile_resume', resumeText = '', resumeUrl = '' }) =>
  strictRequest({
    path: `/ats/check/${jobId}`,
    options: {
      method: 'POST',
      body: JSON.stringify({ source, resumeText, resumeUrl })
    },
    extract: (payload) => ({
      atsCheckId: payload?.atsCheckId || null,
      result: payload?.result || null,
      saved: Boolean(payload?.saved),
      persistenceWarning: payload?.persistenceWarning || ''
    })
  });

export const runAtsPreview = async ({ source = 'profile_resume', resumeText = '', resumeUrl = '', targetText = '' }) =>
  strictRequest({
    path: '/ats/check-preview',
    options: {
      method: 'POST',
      body: JSON.stringify({ source, resumeText, resumeUrl, targetText })
    },
    extract: (payload) => ({
      atsCheckId: payload?.atsCheckId || null,
      result: payload?.result || null,
      saved: Boolean(payload?.saved),
      persistenceWarning: payload?.persistenceWarning || ''
    })
  });

export const getCompanyReviews = async (companyName) => {
  if (!companyName) {
    return { data: { summary: { count: 0, averageRating: 0 }, reviews: [] }, isDemo: false, error: '' };
  }

  return safeRequest({
    path: `/student/company-reviews/${encodeURIComponent(companyName)}`,
    emptyData: { summary: { count: 0, averageRating: 0 }, reviews: [] },
    extract: (payload) => ({
      summary: payload?.summary || { count: 0, averageRating: 0 },
      reviews: payload?.reviews || []
    })
  });
};

export const addCompanyReview = async (reviewPayload) =>
  strictRequest({
    path: '/student/company-reviews',
    options: { method: 'POST', body: JSON.stringify(reviewPayload) },
    extract: (payload) => payload?.review || payload
  });

export const getResumeScore = async () =>
  safeRequest({
    path: '/student/profile/resume-score',
    options: { timeoutMs: 8000 },
    emptyData: { score: 0, maxScore: 100, grade: 'Needs Work', breakdown: [], tips: [] },
    extract: (payload) => ({
      score: payload?.score || 0,
      maxScore: payload?.maxScore || 100,
      grade: payload?.grade || 'Needs Work',
      breakdown: payload?.breakdown || [],
      tips: payload?.tips || []
    })
  });

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};
