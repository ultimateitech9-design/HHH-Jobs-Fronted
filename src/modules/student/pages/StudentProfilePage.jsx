import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  FiAward,
  FiBook,
  FiBriefcase,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiTrendingUp,
  FiUser,
  FiX
} from 'react-icons/fi';
import useAuthStore from '../../../core/auth/authStore';
import { getToken, setAuthSession } from '../../../utils/auth';
import {
  getStudentProfile,
  importStudentResume,
  updateStudentAvatar,
  updateStudentProfile,
  uploadStudentResume
} from '../services/studentApi';
import {
  applyImportedResumeToProfile,
  readFileAsDataUrl,
  readResumeImportPayload,
  STUDENT_RESUME_ACCEPT,
  summarizeImportedProfileDraft,
  validateStudentResumeFile
} from '../utils/resumeImport';

const EMPTY_EDUCATION = {
  educationLevel: 'Graduation',
  courseName: '',
  instituteName: '',
  universityBoard: '',
  specialization: '',
  startYear: '',
  endYear: '',
  educationStatus: 'completed',
  expectedCompletionYear: '',
  isHighestQualification: false
};

const EMPTY_EXPERIENCE = {
  companyName: '',
  designation: '',
  employmentType: 'Full-time',
  startYear: '',
  endYear: '',
  isCurrentlyWorking: false,
  location: '',
  responsibilities: '',
  keyAchievement: '',
  techStack: []
};

const EMPTY_PROJECT = {
  title: '',
  description: '',
  techStack: [],
  role: '',
  githubUrl: '',
  liveUrl: '',
  startYear: '',
  endYear: '',
  isOngoing: false
};

const EDUCATION_LEVEL_OPTIONS = [
  'Doctorate / PhD',
  'Masters / Post Graduation',
  'Graduation / Diploma',
  'Class XII',
  'Class X',
  'Below 10th'
];

const KEY_SKILL_SUGGESTIONS = [
  'Full Stack Development',
  'Java',
  'Spring Boot',
  'Node.js',
  'RESTful APIs',
  'MySQL',
  'PostgreSQL',
  'Technical SEO',
  'API Design',
  'Database Management',
  'JavaScript',
  'Secure Authentication',
  'Performance Optimization',
  'Responsive Web Design',
  'Problem Solving',
  'Agile Methodologies',
  'User Experience (UX)'
];

const MAX_HEADLINE_CHARS = 250;
const CURRENT_YEAR = new Date().getFullYear();

const GENDER_OPTIONS = ['Male', 'Female', 'Transgender'];
const MARITAL_STATUS_OPTIONS = ['Single/unmarried', 'Married', 'Widowed', 'Divorced', 'Separated', 'Other'];
const CATEGORY_OPTIONS = [
  'General',
  'Scheduled Caste (SC)',
  'Scheduled Tribe (ST)',
  'OBC - Creamy',
  'OBC - Non creamy',
  'Other'
];
const MONTH_OPTIONS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' }
];
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, index) => String(CURRENT_YEAR - index));
const COURSE_TYPE_OPTIONS = ['Full time', 'Part time', 'Correspondence/Distance learning'];
const WORK_LOCATION_SUGGESTIONS = [
  'Delhi / NCR',
  'Gurgaon/Gurugram',
  'Hyderabad/Secunderabad',
  'Mumbai',
  'Pune',
  'Bangalore/Bengaluru',
  'Noida',
  'Remote'
];
const DEFAULT_LANGUAGE_ROW = {
  language: '',
  proficiency: 'Proficient',
  read: true,
  write: true,
  speak: true
};

const normalizeExperienceItems = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) =>
    typeof item === 'string'
      ? { ...EMPTY_EXPERIENCE, responsibilities: item }
      : { ...EMPTY_EXPERIENCE, ...item }
  );

const normalizeProjectItems = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) =>
    typeof item === 'string'
      ? { ...EMPTY_PROJECT, title: item }
      : { ...EMPTY_PROJECT, ...item }
  );

const EMPTY_FORM = {
  name: '',
  email: '',
  mobile: '',
  gender: '',
  caste: '',
  religion: '',
  avatarUrl: '',
  headline: '',
  targetRole: '',
  profileSummary: '',
  careerObjective: '',
  dateOfBirth: '',
  maritalStatus: '',
  currentAddress: '',
  preferredWorkLocation: '',
  location: '',
  currentPincode: '',
  permanentPincode: '',
  technicalSkills: [],
  softSkills: [],
  toolsTechnologies: [],
  educationEntries: [],
  projects: [],
  internships: [],
  experience: [],
  certifications: [],
  achievements: [],
  languagesKnown: [],
  resumeUrl: '',
  resumeText: '',
  portfolioUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  preferredSalaryMin: '',
  preferredSalaryMax: '',
  expectedSalary: '',
  preferredJobType: '',
  availabilityToJoin: '',
  willingToRelocate: '',
  noticePeriodDays: '',
  isDiscoverable: false,
  availableToHire: false
};

const SECTION_META = [
  { id: 'resume', label: 'Resume', weight: 10, icon: FiFileText },
  { id: 'resume-headline', label: 'Resume headline', weight: 8, icon: FiEdit2 },
  { id: 'key-skills', label: 'Key skills', weight: 8, icon: FiAward },
  { id: 'employment', label: 'Employment', weight: 18, icon: FiBriefcase },
  { id: 'education', label: 'Education', weight: 10, icon: FiBook },
  { id: 'it-skills', label: 'IT skills', weight: 10, icon: FiTrendingUp },
  { id: 'projects', label: 'Projects', weight: 6, icon: FiBriefcase },
  { id: 'profile-summary', label: 'Profile summary', weight: 8, icon: FiEdit2 },
  { id: 'accomplishments', label: 'Accomplishments', weight: 6, icon: FiAward },
  { id: 'career-profile', label: 'Career profile', weight: 10, icon: FiTrendingUp },
  { id: 'personal-details', label: 'Personal details', weight: 8, icon: FiUser },
  { id: 'diversity-inclusion', label: 'Diversity & inclusion', weight: 4, icon: FiCheckCircle }
];

const createEmptyEducation = (educationLevel = 'Graduation') => ({
  ...EMPTY_EDUCATION,
  educationLevel
});

const hasEducationContent = (entry = {}) =>
  Boolean(
    entry?.courseName
    || entry?.instituteName
    || entry?.universityBoard
    || entry?.specialization
    || entry?.startYear
    || entry?.endYear
    || entry?.expectedCompletionYear
  );

const ensureEducationEntries = (items = []) =>
  Array.isArray(items) && items.length > 0 ? items : [createEmptyEducation()];

const parseCommaList = (value = '') =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseLineList = (value = '') =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const joinCommaList = (items = []) => (Array.isArray(items) ? items.join(', ') : '');
const joinLineList = (items = []) => (Array.isArray(items) ? items.join('\n') : '');

const normalizeSkillList = (items = []) => {
  const seen = new Set();

  return (Array.isArray(items) ? items : parseCommaList(items))
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const buildSuggestedHeadline = (form = EMPTY_FORM) => {
  const role = String(form.targetRole || form.headline || 'Full Stack Engineer').trim();
  const skills = normalizeSkillList([
    ...(Array.isArray(form.technicalSkills) ? form.technicalSkills : []),
    ...(Array.isArray(form.toolsTechnologies) ? form.toolsTechnologies : [])
  ]).slice(0, 4);
  const education = form.educationEntries?.find(hasEducationContent);
  const educationText = education?.courseName ? ` with ${education.courseName}` : '';
  const skillText = skills.length ? ` skilled in ${skills.join(', ')}` : ' focused on scalable product development';
  const summary = `${role}${educationText},${skillText}, building reliable user experiences and business-ready web solutions.`;

  return summary.length > MAX_HEADLINE_CHARS ? `${summary.slice(0, MAX_HEADLINE_CHARS - 1).trim()}.` : summary;
};

const completionOf = (form = EMPTY_FORM) => {
  const checks = [
    Boolean(form.name),
    Boolean(form.mobile),
    Boolean(form.avatarUrl),
    Boolean(form.headline || form.targetRole),
    Boolean(form.location),
    Boolean(form.profileSummary),
    form.technicalSkills.length > 0,
    form.educationEntries.some(hasEducationContent),
    form.experience.length > 0 || form.projects.length > 0,
    Boolean(form.resumeUrl || form.resumeText),
    Boolean(form.linkedinUrl || form.githubUrl || form.portfolioUrl)
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getResumeFileName = (form = EMPTY_FORM) => {
  if (form.resumeUrl) {
    try {
      const url = new URL(form.resumeUrl);
      const fileName = decodeURIComponent(url.pathname.split('/').pop() || '');
      if (fileName) return fileName;
    } catch (error) {
      const fallback = decodeURIComponent(String(form.resumeUrl).split('/').pop() || '');
      if (fallback) return fallback;
    }
  }

  return form.resumeText ? 'profile-resume.txt' : 'No resume uploaded';
};

const scrollToNode = (node) => {
  if (!node) return;
  node.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const cardClassName =
  'rounded-[1.75rem] border border-[#e6ecf5] bg-white p-5 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)] sm:p-6';

const modalInputClassName =
  'h-11 w-full rounded-[0.9rem] border border-[#dfe5f2] bg-white px-4 text-[0.88rem] text-slate-950 outline-none transition placeholder:text-[#9aa5c6] focus:border-[#2d5bff] focus:ring-2 focus:ring-[#2d5bff]/10';

const modalSelectClassName =
  'h-11 w-full rounded-[0.9rem] border border-[#dfe5f2] bg-white px-4 text-[0.88rem] text-slate-950 outline-none transition focus:border-[#2d5bff] focus:ring-2 focus:ring-[#2d5bff]/10';

const modalLabelClassName = 'mb-2 block text-[0.8rem] font-extrabold text-slate-950';

const profileModalBackdropClassName =
  'fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/65 p-4 backdrop-blur-[2px]';

const profileMetaItemClassName =
  'inline-flex items-center gap-2 text-left text-[0.8rem] text-slate-600';

const renderProfileModal = (content) => {
  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
};

const formatAvailabilityToJoin = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'Add joining timeline';
  if (/^\d+$/.test(trimmed)) return `${trimmed} month${trimmed === '1' ? '' : 's'}`;
  return trimmed;
};

const getDateParts = (value = '') => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return { year: match[1], month: match[2], day: String(Number(match[3])) };

  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return { year: '', month: '', day: '' };

  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate())
  };
};

const buildDateValue = ({ day = '', month = '', year = '' } = {}) => {
  if (!day || !month || !year) return '';
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
};

const formatDateOfBirth = (value = '') => {
  const { day, month, year } = getDateParts(value);
  if (!day || !month || !year) return 'Add date of birth';
  const monthLabel = MONTH_OPTIONS.find((item) => item.value === month)?.label || month;
  return `${String(day).padStart(2, '0')} ${monthLabel} ${year}`;
};

const formatSalary = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'Add expected salary';
  const rangeParts = trimmed.split(/\s+-\s+/).filter(Boolean);
  if (rangeParts.length === 2) return `${formatSalary(rangeParts[0])} - ${formatSalary(rangeParts[1])}`;
  const numeric = Number(trimmed.replace(/[^\d]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return trimmed;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numeric);
};

const getEducationDisplayTitle = (entry = {}, index = 0) => {
  const title = [entry.courseName, entry.specialization].filter(Boolean).join(' ');
  return title || entry.educationLevel || `Qualification ${index + 1}`;
};

const getEducationDisplayMeta = (entry = {}) => {
  const years = [entry.startYear, entry.endYear || entry.expectedCompletionYear].filter(Boolean).join('-');
  const type = entry.courseType || (entry.educationStatus === 'pursuing' ? 'Full Time' : '');
  return [years, type].filter(Boolean).join(' | ') || 'Add course duration';
};

const getProjectDisplayMeta = (entry = {}) => {
  const years = [entry.startYear, entry.isOngoing ? 'Present' : entry.endYear].filter(Boolean).join(' to ');
  return [entry.role || 'Other (Offsite)', years].filter(Boolean).join('\n');
};

const previewText = (value = '', limit = 220) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Add a concise description recruiters can scan quickly.';
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
};

const toLanguageRows = (items = []) => {
  const rows = (Array.isArray(items) ? items : parseCommaList(items))
    .map((item) => (typeof item === 'string' ? { ...DEFAULT_LANGUAGE_ROW, language: item } : { ...DEFAULT_LANGUAGE_ROW, ...item }))
    .filter((item) => String(item.language || '').trim());

  return rows;
};

const toPersonalEditorDraft = (source = {}) => {
  const dateParts = getDateParts(source.dateOfBirth);

  return {
    gender: source.gender || '',
    maritalStatus: source.maritalStatus || '',
    birthDay: dateParts.day,
    birthMonth: dateParts.month,
    birthYear: dateParts.year,
    category: source.caste || '',
    workPermit: 'India',
    currentAddress: source.currentAddress || '',
    hometown: source.location || '',
    pincode: source.currentPincode || source.permanentPincode || '',
    languages: toLanguageRows(source.languagesKnown).length > 0
      ? toLanguageRows(source.languagesKnown)
      : [{ ...DEFAULT_LANGUAGE_ROW, language: 'Hindi' }, { ...DEFAULT_LANGUAGE_ROW, language: 'English' }]
  };
};

const toCareerEditorDraft = (source = {}) => ({
  currentIndustry: source.careerObjective || '',
  department: 'Engineering - Software & QA',
  roleCategory: 'Software Development',
  jobRole: source.targetRole || '',
  desiredJobType: source.preferredJobType || '',
  employmentType: 'Full Time',
  preferredShift: 'Flexible',
  preferredWorkLocation: source.preferredWorkLocation || '',
  expectedSalary: source.expectedSalary || ''
});

const toItSkillRows = (source = {}) =>
  normalizeSkillList([...(source.toolsTechnologies || []), ...(source.softSkills || [])]).map((skill, index) => ({
    name: skill,
    version: /java/i.test(skill) ? '8' : '-',
    lastUsed: String(CURRENT_YEAR),
    experience: index === 0 ? '1 Year 0 Month' : '2 Years 0 Month'
  }));

const toProfileEditorDraft = (source = {}) => ({
  name: source.name || '',
  headline: source.headline || '',
  mobile: source.mobile || '',
  email: source.email || '',
  location: source.location || '',
  availabilityToJoin: source.availabilityToJoin || '',
  gender: source.gender || '',
  dateOfBirth: source.dateOfBirth || ''
});

const StudentProfilePage = () => {
  const location = useLocation();
  const { user, refreshUser } = useAuthStore();
  const avatarInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const timerRef = useRef(null);
  const sectionRefs = useRef({});

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resumeImporting, setResumeImporting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileEditorDraft, setProfileEditorDraft] = useState(() => toProfileEditorDraft(EMPTY_FORM));
  const [profileEditorFocusField, setProfileEditorFocusField] = useState('');
  const [headlineEditorOpen, setHeadlineEditorOpen] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState('');
  const [skillsEditorOpen, setSkillsEditorOpen] = useState(false);
  const [skillsDraft, setSkillsDraft] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [personalEditorOpen, setPersonalEditorOpen] = useState(false);
  const [personalDraft, setPersonalDraft] = useState(() => toPersonalEditorDraft(EMPTY_FORM));
  const [educationEditorOpen, setEducationEditorOpen] = useState(false);
  const [educationEditorIndex, setEducationEditorIndex] = useState(-1);
  const [educationDraft, setEducationDraft] = useState(() => createEmptyEducation('Graduation / Diploma'));
  const [itSkillEditorOpen, setItSkillEditorOpen] = useState(false);
  const [itSkillEditorIndex, setItSkillEditorIndex] = useState(-1);
  const [itSkillDraft, setItSkillDraft] = useState({ name: '', version: '', lastUsed: String(CURRENT_YEAR), years: '2', months: '0' });
  const [projectEditorOpen, setProjectEditorOpen] = useState(false);
  const [projectEditorIndex, setProjectEditorIndex] = useState(-1);
  const [projectDraft, setProjectDraft] = useState(() => ({ ...EMPTY_PROJECT }));
  const [careerEditorOpen, setCareerEditorOpen] = useState(false);
  const [careerDraft, setCareerDraft] = useState(() => toCareerEditorDraft(EMPTY_FORM));
  const [diversityEditorOpen, setDiversityEditorOpen] = useState(false);
  const [diversityDraft, setDiversityDraft] = useState({ caste: '', religion: '', willingToRelocate: '' });

  const setFlash = (type, text) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setMessage({ type, text });
    if (text) {
      timerRef.current = window.setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const syncUser = (profile = {}) => {
    if (!user) return;
    const avatar = profile.avatarUrl || profile.avatar_url || user.avatarUrl || user.avatar_url || '';
    const nextUser = {
      ...user,
      name: profile.name || user.name || '',
      mobile: profile.mobile || user.mobile || '',
      gender: profile.gender || user.gender || '',
      avatarUrl: avatar,
      avatar_url: avatar
    };

    refreshUser(nextUser);
    const token = getToken();
    if (token) setAuthSession(token, nextUser);
  };

  const commitProfileUpdate = async (nextForm, successText, failureText, onSuccess = () => {}) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updated = await updateStudentProfile(nextForm);
      setForm((current) => ({
        ...current,
        ...nextForm,
        ...updated,
        email: updated.email || nextForm.email || current.email,
        educationEntries: ensureEducationEntries(updated.educationEntries || nextForm.educationEntries || current.educationEntries),
        experience: normalizeExperienceItems(updated.experience || nextForm.experience || current.experience),
        projects: normalizeProjectItems(updated.projects || nextForm.projects || current.projects),
        languagesKnown: updated.languagesKnown || nextForm.languagesKnown || current.languagesKnown
      }));
      syncUser({ ...nextForm, ...updated });
      onSuccess(updated);
      setFlash('success', successText);
    } catch (error) {
      setFlash('error', error.message || failureText);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => () => timerRef.current && window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const response = await getStudentProfile();
      if (!mounted) return;

      const data = response.data || {};
      setForm({
        ...EMPTY_FORM,
        ...data,
        name: data.name || user?.name || '',
        email: data.email || user?.email || '',
        mobile: data.mobile || user?.mobile || '',
        avatarUrl: data.avatarUrl || user?.avatarUrl || user?.avatar_url || '',
        educationEntries: ensureEducationEntries(data.educationEntries),
        experience: normalizeExperienceItems(data.experience),
        projects: normalizeProjectItems(data.projects)
      });
      setMessage(response.error ? { type: 'error', text: response.error } : { type: '', text: '' });
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user?.avatarUrl, user?.avatar_url, user?.email, user?.mobile, user?.name]);

  useEffect(() => {
    if (loading) return;
    const requestedSection = new URLSearchParams(location.search).get('section');
    if (!requestedSection) return;

    const sectionIdMap = {
      personal: 'personal-details',
      resume: 'resume',
      skills: 'key-skills',
      education: 'education',
      profile: 'personal-details'
    };
    const targetId = sectionIdMap[requestedSection] || requestedSection;
    window.requestAnimationFrame(() => scrollToNode(sectionRefs.current[targetId]));
  }, [loading, location.search]);

  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const openProfileEditor = (focusField = '') => {
    setProfileEditorDraft(toProfileEditorDraft(form));
    setProfileEditorFocusField(focusField);
    setProfileEditorOpen(true);
  };

  const closeProfileEditor = () => {
    if (saving) return;
    setProfileEditorOpen(false);
    setProfileEditorFocusField('');
  };

  const updateProfileEditorField = (name, value) =>
    setProfileEditorDraft((current) => ({
      ...current,
      [name]: value
    }));

  const addExperience = () =>
    setForm((current) => ({
      ...current,
      experience: [...current.experience, { ...EMPTY_EXPERIENCE }]
    }));

  const removeExperience = (index) =>
    setForm((current) => ({
      ...current,
      experience: current.experience.filter((_, i) => i !== index)
    }));

  const updateExperience = (index, field, value) =>
    setForm((current) => ({
      ...current,
      experience: current.experience.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updated = await updateStudentProfile(form);
      setForm((current) => ({
        ...current,
        ...updated,
        email: updated.email || current.email,
        educationEntries: ensureEducationEntries(updated.educationEntries || current.educationEntries)
      }));
      syncUser(updated);
      setFlash('success', 'Profile saved successfully.');
    } catch (error) {
      setFlash('error', error.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileEditorSave = async () => {
    const nextForm = {
      ...form,
      ...profileEditorDraft
    };

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updated = await updateStudentProfile(nextForm);
      setForm((current) => ({
        ...current,
        ...updated,
        email: updated.email || current.email,
        educationEntries: ensureEducationEntries(updated.educationEntries || current.educationEntries)
      }));
      syncUser(updated);
      setProfileEditorOpen(false);
      setFlash('success', 'Profile updated successfully.');
    } catch (error) {
      setFlash('error', error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const openHeadlineEditor = () => {
    setHeadlineDraft(String(form.headline || '').slice(0, MAX_HEADLINE_CHARS));
    setHeadlineEditorOpen(true);
  };

  const closeHeadlineEditor = () => {
    if (saving) return;
    setHeadlineEditorOpen(false);
  };

  const handleHeadlineEditorSave = async () => {
    const cleanHeadline = String(headlineDraft || '').trim();
    const wordCount = cleanHeadline.split(/\s+/).filter(Boolean).length;

    if (wordCount > 0 && wordCount < 5) {
      setFlash('error', 'Resume headline must be at least 5 words.');
      return;
    }

    const nextForm = {
      ...form,
      headline: cleanHeadline
    };

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updated = await updateStudentProfile(nextForm);
      setForm((current) => ({
        ...current,
        ...updated,
        email: updated.email || current.email,
        educationEntries: ensureEducationEntries(updated.educationEntries || current.educationEntries)
      }));
      syncUser(updated);
      setHeadlineEditorOpen(false);
      setFlash('success', 'Resume headline updated.');
    } catch (error) {
      setFlash('error', error.message || 'Failed to update resume headline.');
    } finally {
      setSaving(false);
    }
  };

  const openSkillsEditor = () => {
    setSkillsDraft(normalizeSkillList(form.technicalSkills));
    setSkillInput('');
    setSkillsEditorOpen(true);
  };

  const closeSkillsEditor = () => {
    if (saving) return;
    setSkillsEditorOpen(false);
    setSkillInput('');
  };

  const addSkillsToDraft = (value = '') => {
    const nextItems = parseCommaList(value);
    if (nextItems.length === 0) return;

    setSkillsDraft((current) => normalizeSkillList([...current, ...nextItems]));
    setSkillInput('');
  };

  const removeSkillFromDraft = (skill) => {
    const target = String(skill || '').trim().toLowerCase();
    setSkillsDraft((current) => current.filter((item) => String(item || '').trim().toLowerCase() !== target));
  };

  const handleSkillInputKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkillsToDraft(skillInput);
    }

    if (event.key === 'Backspace' && !skillInput && skillsDraft.length > 0) {
      setSkillsDraft((current) => current.slice(0, -1));
    }
  };

  const handleSkillsEditorSave = async () => {
    const cleanSkills = normalizeSkillList([...skillsDraft, ...parseCommaList(skillInput)]);

    if (cleanSkills.length === 0) {
      setFlash('error', 'Add at least one key skill.');
      return;
    }

    const nextForm = {
      ...form,
      technicalSkills: cleanSkills
    };

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updated = await updateStudentProfile(nextForm);
      setForm((current) => ({
        ...current,
        ...updated,
        email: updated.email || current.email,
        educationEntries: ensureEducationEntries(updated.educationEntries || current.educationEntries)
      }));
      syncUser(updated);
      setSkillsEditorOpen(false);
      setSkillInput('');
      setFlash('success', 'Key skills updated.');
    } catch (error) {
      setFlash('error', error.message || 'Failed to update key skills.');
    } finally {
      setSaving(false);
    }
  };

  const openPersonalEditor = () => {
    setPersonalDraft(toPersonalEditorDraft(form));
    setPersonalEditorOpen(true);
  };

  const closePersonalEditor = () => {
    if (saving) return;
    setPersonalEditorOpen(false);
  };

  const updatePersonalDraftField = (name, value) =>
    setPersonalDraft((current) => ({
      ...current,
      [name]: value
    }));

  const updatePersonalLanguage = (index, field, value) =>
    setPersonalDraft((current) => ({
      ...current,
      languages: current.languages.map((item, entryIndex) =>
        entryIndex === index ? { ...item, [field]: value } : item
      )
    }));

  const addPersonalLanguage = () =>
    setPersonalDraft((current) => ({
      ...current,
      languages: [...current.languages, { ...DEFAULT_LANGUAGE_ROW }]
    }));

  const removePersonalLanguage = (index) =>
    setPersonalDraft((current) => ({
      ...current,
      languages: current.languages.length > 1
        ? current.languages.filter((_, entryIndex) => entryIndex !== index)
        : [{ ...DEFAULT_LANGUAGE_ROW }]
    }));

  const handlePersonalEditorSave = () => {
    const languagesKnown = normalizeSkillList(
      personalDraft.languages.map((item) => item.language)
    );
    const nextForm = {
      ...form,
      gender: personalDraft.gender,
      maritalStatus: personalDraft.maritalStatus,
      dateOfBirth: buildDateValue({
        day: personalDraft.birthDay,
        month: personalDraft.birthMonth,
        year: personalDraft.birthYear
      }),
      caste: personalDraft.category,
      currentAddress: personalDraft.currentAddress,
      location: personalDraft.hometown,
      currentPincode: personalDraft.pincode,
      permanentPincode: personalDraft.pincode,
      languagesKnown
    };

    commitProfileUpdate(nextForm, 'Personal details updated.', 'Failed to update personal details.', () => {
      setPersonalEditorOpen(false);
    });
  };

  const openEducationEditor = (index = -1, educationLevel = 'Graduation / Diploma') => {
    const source = index >= 0 ? form.educationEntries[index] : createEmptyEducation(educationLevel);
    setEducationEditorIndex(index);
    setEducationDraft({
      ...EMPTY_EDUCATION,
      courseType: 'Full time',
      gradingSystem: '',
      ...source,
      educationLevel: source?.educationLevel || educationLevel
    });
    setEducationEditorOpen(true);
  };

  const closeEducationEditor = () => {
    if (saving) return;
    setEducationEditorOpen(false);
  };

  const updateEducationDraftField = (name, value) =>
    setEducationDraft((current) => ({
      ...current,
      [name]: value
    }));

  const handleEducationEditorSave = () => {
    if (!hasEducationContent(educationDraft)) {
      setFlash('error', 'Add course, institute, or duration before saving education.');
      return;
    }

    const existingEntries = form.educationEntries.some(hasEducationContent) ? form.educationEntries : [];
    const educationEntries = educationEditorIndex >= 0
      ? form.educationEntries.map((item, index) => (index === educationEditorIndex ? educationDraft : item))
      : [...existingEntries, educationDraft];

    commitProfileUpdate(
      { ...form, educationEntries: ensureEducationEntries(educationEntries) },
      'Education updated.',
      'Failed to update education.',
      () => setEducationEditorOpen(false)
    );
  };

  const openItSkillEditor = (index = -1, skillName = '') => {
    setItSkillEditorIndex(index);
    setItSkillDraft({
      name: skillName,
      version: /java/i.test(skillName) ? '8' : '',
      lastUsed: String(CURRENT_YEAR),
      years: index === 0 ? '1' : '2',
      months: '0'
    });
    setItSkillEditorOpen(true);
  };

  const closeItSkillEditor = () => {
    if (saving) return;
    setItSkillEditorOpen(false);
  };

  const updateItSkillDraftField = (name, value) =>
    setItSkillDraft((current) => ({
      ...current,
      [name]: value
    }));

  const handleItSkillEditorSave = () => {
    const skillName = String(itSkillDraft.name || '').trim();
    if (!skillName) {
      setFlash('error', 'Add skill/software name before saving.');
      return;
    }

    const toolsTechnologies = normalizeSkillList(form.toolsTechnologies);
    const nextTools = itSkillEditorIndex >= 0 && itSkillEditorIndex < toolsTechnologies.length
      ? toolsTechnologies.map((item, index) => (index === itSkillEditorIndex ? skillName : item))
      : [...toolsTechnologies, skillName];

    commitProfileUpdate(
      { ...form, toolsTechnologies: normalizeSkillList(nextTools) },
      'IT skills updated.',
      'Failed to update IT skills.',
      () => setItSkillEditorOpen(false)
    );
  };

  const openProjectEditor = (index = -1) => {
    const source = index >= 0 ? form.projects[index] : { ...EMPTY_PROJECT };
    setProjectEditorIndex(index);
    setProjectDraft({ ...EMPTY_PROJECT, ...source });
    setProjectEditorOpen(true);
  };

  const closeProjectEditor = () => {
    if (saving) return;
    setProjectEditorOpen(false);
  };

  const updateProjectDraftField = (name, value) =>
    setProjectDraft((current) => ({
      ...current,
      [name]: value
    }));

  const handleProjectEditorSave = () => {
    if (!projectDraft.title && !projectDraft.description) {
      setFlash('error', 'Add project title or details before saving.');
      return;
    }

    const projects = projectEditorIndex >= 0
      ? form.projects.map((item, index) => (index === projectEditorIndex ? projectDraft : item))
      : [...form.projects, projectDraft];

    commitProfileUpdate(
      { ...form, projects: normalizeProjectItems(projects) },
      'Project details updated.',
      'Failed to update project details.',
      () => setProjectEditorOpen(false)
    );
  };

  const handleProjectDelete = () => {
    if (projectEditorIndex < 0) {
      setProjectEditorOpen(false);
      return;
    }

    commitProfileUpdate(
      { ...form, projects: form.projects.filter((_, index) => index !== projectEditorIndex) },
      'Project removed.',
      'Failed to remove project.',
      () => setProjectEditorOpen(false)
    );
  };

  const openCareerEditor = () => {
    setCareerDraft(toCareerEditorDraft(form));
    setCareerEditorOpen(true);
  };

  const closeCareerEditor = () => {
    if (saving) return;
    setCareerEditorOpen(false);
  };

  const updateCareerDraftField = (name, value) =>
    setCareerDraft((current) => ({
      ...current,
      [name]: value
    }));

  const addCareerLocation = (value = '') => {
    const currentLocations = parseCommaList(careerDraft.preferredWorkLocation);
    const nextLocations = normalizeSkillList([...currentLocations, ...parseCommaList(value)]).slice(0, 10);
    setCareerDraft((current) => ({
      ...current,
      preferredWorkLocation: nextLocations.join(', ')
    }));
  };

  const removeCareerLocation = (locationName) => {
    const target = String(locationName || '').toLowerCase();
    const nextLocations = parseCommaList(careerDraft.preferredWorkLocation).filter(
      (item) => item.toLowerCase() !== target
    );
    setCareerDraft((current) => ({
      ...current,
      preferredWorkLocation: nextLocations.join(', ')
    }));
  };

  const handleCareerEditorSave = () => {
    const nextForm = {
      ...form,
      careerObjective: careerDraft.currentIndustry,
      targetRole: careerDraft.jobRole,
      preferredJobType: careerDraft.desiredJobType,
      preferredWorkLocation: normalizeSkillList(parseCommaList(careerDraft.preferredWorkLocation)).join(', '),
      expectedSalary: careerDraft.expectedSalary
    };

    commitProfileUpdate(nextForm, 'Career profile updated.', 'Failed to update career profile.', () => {
      setCareerEditorOpen(false);
    });
  };

  const openDiversityEditor = () => {
    setDiversityDraft({
      caste: form.caste || '',
      religion: form.religion || '',
      willingToRelocate: String(form.willingToRelocate ?? '')
    });
    setDiversityEditorOpen(true);
  };

  const closeDiversityEditor = () => {
    if (saving) return;
    setDiversityEditorOpen(false);
  };

  const updateDiversityDraftField = (name, value) =>
    setDiversityDraft((current) => ({
      ...current,
      [name]: value
    }));

  const handleDiversityEditorSave = () => {
    commitProfileUpdate(
      {
        ...form,
        caste: diversityDraft.caste,
        religion: diversityDraft.religion,
        willingToRelocate: diversityDraft.willingToRelocate
      },
      'Diversity details updated.',
      'Failed to update diversity details.',
      () => setDiversityEditorOpen(false)
    );
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setFlash('error', 'Select a valid image file.');
    if (file.size > 4 * 1024 * 1024) return setFlash('error', 'Profile photo must be 4 MB or smaller.');

    setAvatarUploading(true);
    try {
      const avatarUrl = await readFileAsDataUrl(file);
      const updated = await updateStudentAvatar(avatarUrl);
      setForm((current) => ({ ...current, ...updated, avatarUrl: updated.avatarUrl || avatarUrl }));
      syncUser({ ...updated, avatarUrl: updated.avatarUrl || avatarUrl });
      setFlash('success', 'Profile photo updated.');
    } catch (error) {
      setFlash('error', error.message || 'Unable to upload photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleResumeImport = async ({ resumeText = '', resumeUrl = '', file = null, successMessage }) => {
    setResumeImporting(true);
    setMessage({ type: '', text: '' });

    try {
      const imported = await importStudentResume({ resumeText, resumeUrl });
      let uploadSummary = { resumeUrl: '', resumeText: '', warnings: [] };

      if (file) {
        try {
          uploadSummary = await uploadStudentResume(file);
        } catch (error) {
          uploadSummary = {
            resumeUrl: '',
            resumeText: '',
            warnings: [error.message || 'Resume file upload failed.']
          };
        }
      }

      const warnings = [...(imported.warnings || []), ...(uploadSummary.warnings || [])].filter(Boolean);
      const nextForm = applyImportedResumeToProfile({
        currentProfile: form,
        importedDraft: imported.profileDraft || {},
        uploadSummary,
        fallbackResumeText: resumeText
      });

      setForm((current) => ({ ...current, ...nextForm }));
      const updated = await updateStudentProfile(nextForm);
      setForm((current) => ({
        ...current,
        ...updated,
        email: updated.email || current.email,
        educationEntries: ensureEducationEntries(updated.educationEntries || current.educationEntries)
      }));
      syncUser(updated);

      const savedSummary = summarizeImportedProfileDraft(updated);
      const baseMessage = `${successMessage} Saved ${savedSummary} to profile.`;
      setFlash('success', warnings.length ? `${baseMessage} ${warnings.join(' ')}` : baseMessage);
    } catch (error) {
      setFlash('error', error.message || 'Unable to import resume.');
    } finally {
      setResumeImporting(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationMessage = validateStudentResumeFile(file);
    if (validationMessage) return setFlash('error', validationMessage);

    const payload = await readResumeImportPayload(file);
    await handleResumeImport({
      ...payload,
      file,
      successMessage: 'Resume imported into profile draft.'
    });
  };

  const handleResumeDownload = () => {
    if (!String(form.resumeText || '').trim()) {
      setFlash('error', 'No resume text available to download yet.');
      return;
    }

    const blob = new Blob([String(form.resumeText || '')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${String(form.name || 'student-resume').trim().replace(/\s+/g, '-').toLowerCase()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearResumeDraft = () => {
    setForm((current) => ({ ...current, resumeUrl: '', resumeText: '' }));
    setFlash('success', 'Resume cleared from the draft. Save profile to keep this change.');
  };

  const profileDialogOpen =
    profileEditorOpen
    || headlineEditorOpen
    || skillsEditorOpen
    || personalEditorOpen
    || educationEditorOpen
    || itSkillEditorOpen
    || projectEditorOpen
    || careerEditorOpen
    || diversityEditorOpen;

  useEffect(() => {
    if (!profileDialogOpen || typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [profileDialogOpen]);

  useEffect(() => {
    if (!profileDialogOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key !== 'Escape' || saving) return;
      setProfileEditorOpen(false);
      setHeadlineEditorOpen(false);
      setSkillsEditorOpen(false);
      setSkillInput('');
      setPersonalEditorOpen(false);
      setEducationEditorOpen(false);
      setItSkillEditorOpen(false);
      setProjectEditorOpen(false);
      setCareerEditorOpen(false);
      setDiversityEditorOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [profileDialogOpen, saving]);

  const completion = completionOf(form);
  const hasResume = Boolean(form.resumeUrl || form.resumeText);
  const hasResumeHeadline = Boolean(form.headline);
  const hasKeySkills = form.technicalSkills.length > 0;
  const hasEmployment = form.experience.length > 0;
  const hasEducation = form.educationEntries.some(hasEducationContent);
  const hasItSkills = form.toolsTechnologies.length > 0 || form.softSkills.length > 0;
  const hasProjects = form.projects.length > 0;
  const hasProfileSummary = Boolean(form.profileSummary);
  const hasAccomplishments =
    form.certifications.length > 0
    || form.achievements.length > 0
    || Boolean(form.linkedinUrl || form.githubUrl || form.portfolioUrl);
  const hasCareerProfile = Boolean(
    form.targetRole
    || form.preferredJobType
    || form.preferredWorkLocation
    || form.expectedSalary
    || form.careerObjective
    || form.availabilityToJoin
  );
  const hasPersonalDetails = Boolean(form.name || form.mobile || form.location || form.currentAddress);
  const hasDiversity = Boolean(form.caste || form.religion || String(form.willingToRelocate) !== '');

  const userName = form.name || 'Your Name';
  const preferredSalary = form.expectedSalary || [form.preferredSalaryMin, form.preferredSalaryMax].filter(Boolean).join(' - ');
  const employmentLabel = hasEmployment ? 'Experienced' : 'Fresher';
  const availabilityLabel = formatAvailabilityToJoin(form.availabilityToJoin);
  const resumeFileName = getResumeFileName(form);
  const headlineWordCount = String(headlineDraft || '').trim().split(/\s+/).filter(Boolean).length;
  const headlineCharacterCount = String(headlineDraft || '').length;
  const skillSuggestions = KEY_SKILL_SUGGESTIONS.filter(
    (suggestion) => !skillsDraft.some((skill) => skill.toLowerCase() === suggestion.toLowerCase())
  );
  const languageRows = toLanguageRows(form.languagesKnown);
  const itSkillRows = toItSkillRows(form);
  const educationDisplayEntries = form.educationEntries.filter(hasEducationContent);
  const careerLocations = parseCommaList(careerDraft.preferredWorkLocation);
  const displayCareerLocations = parseCommaList(form.preferredWorkLocation);
  const personalSummary = [form.gender, form.maritalStatus].filter(Boolean).join(', ') || 'Add personal information';
  const addressSummary = [form.currentAddress, form.location, form.currentPincode || form.permanentPincode]
    .filter(Boolean)
    .join(', ');

  const sectionStates = useMemo(
    () => ({
      resume: { filled: hasResume, actionLabel: hasResume ? 'Update' : 'Add' },
      'resume-headline': { filled: hasResumeHeadline, actionLabel: hasResumeHeadline ? 'Update' : 'Add' },
      'key-skills': { filled: hasKeySkills, actionLabel: hasKeySkills ? 'Update' : 'Add' },
      employment: { filled: hasEmployment, actionLabel: hasEmployment ? 'Update' : 'Add' },
      education: { filled: hasEducation, actionLabel: hasEducation ? 'Update' : 'Add' },
      'it-skills': { filled: hasItSkills, actionLabel: hasItSkills ? 'Update' : 'Add' },
      projects: { filled: hasProjects, actionLabel: hasProjects ? 'Update' : 'Add' },
      'profile-summary': { filled: hasProfileSummary, actionLabel: hasProfileSummary ? 'Update' : 'Add' },
      accomplishments: { filled: hasAccomplishments, actionLabel: hasAccomplishments ? 'Update' : 'Add' },
      'career-profile': { filled: hasCareerProfile, actionLabel: hasCareerProfile ? 'Update' : 'Add' },
      'personal-details': { filled: hasPersonalDetails, actionLabel: hasPersonalDetails ? 'Update' : 'Add' },
      'diversity-inclusion': { filled: hasDiversity, actionLabel: hasDiversity ? 'Update' : 'Add' }
    }),
    [
      hasAccomplishments,
      hasCareerProfile,
      hasDiversity,
      hasEducation,
      hasEmployment,
      hasItSkills,
      hasKeySkills,
      hasPersonalDetails,
      hasProfileSummary,
      hasProjects,
      hasResume,
      hasResumeHeadline
    ]
  );

  const quickLinks = useMemo(
    () =>
      SECTION_META.map((item) => ({
        ...item,
        ...sectionStates[item.id]
      })),
    [sectionStates]
  );

  const missingSections = quickLinks.filter((item) => !item.filled);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-5 pb-12 sm:space-y-7">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="student-avatar-input"
        onChange={handleAvatar}
      />
      <input
        ref={resumeInputRef}
        type="file"
        accept={STUDENT_RESUME_ACCEPT}
        className="hidden"
        data-testid="student-resume-upload-input"
        onChange={handleResumeUpload}
      />

      {message.text ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {profileEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeProfileEditor();
          }}
        >
          <div className="w-full max-w-2xl rounded-[1.9rem] border border-[#e6ecf5] bg-white p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.26em] text-brand-700">Quick Update</p>
                <h2 className="mt-1 text-[1.45rem] font-extrabold tracking-tight text-navy">Update profile</h2>
                <p className="mt-1 text-sm text-slate-500">Edit your basic details here and save instantly.</p>
              </div>
              <button
                type="button"
                onClick={closeProfileEditor}
                disabled={saving}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-60"
                aria-label="Close profile editor"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-400">Full name</p>
                <input
                  value={profileEditorDraft.name}
                  onChange={(event) => updateProfileEditorField('name', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  placeholder="Add full name"
                />
              </div>
              <div>
                <p className="text-sm text-slate-400">Profile headline</p>
                <input
                  value={profileEditorDraft.headline}
                  onChange={(event) => updateProfileEditorField('headline', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  placeholder="Add profile headline"
                />
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <input
                  value={profileEditorDraft.email}
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                />
              </div>
              <div>
                <p className="text-sm text-slate-400">Mobile number</p>
                <input
                  value={profileEditorDraft.mobile}
                  onChange={(event) => updateProfileEditorField('mobile', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  placeholder="Add mobile number"
                />
              </div>
              <div>
                <p className="text-sm text-slate-400">Location</p>
                <input
                  value={profileEditorDraft.location}
                  onChange={(event) => updateProfileEditorField('location', event.target.value)}
                  autoFocus={profileEditorFocusField === 'location'}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  placeholder="Add location"
                />
              </div>
              <div>
                <p className="text-sm text-slate-400">Availability to join</p>
                <input
                  value={profileEditorDraft.availabilityToJoin}
                  onChange={(event) => updateProfileEditorField('availabilityToJoin', event.target.value)}
                  autoFocus={profileEditorFocusField === 'availabilityToJoin'}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  placeholder="e.g. 3 months"
                />
              </div>
              <div>
                <p className="text-sm text-slate-400">Gender</p>
                <input
                  value={profileEditorDraft.gender}
                  onChange={(event) => updateProfileEditorField('gender', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  placeholder="Add gender"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm text-slate-400">Date of birth</p>
              <input
                type="date"
                value={profileEditorDraft.dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                onChange={(event) => updateProfileEditorField('dateOfBirth', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeProfileEditor}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProfileEditorSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-[#ff6b3d] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#ef5c30] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {headlineEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeHeadlineEditor();
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[830px] overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.45rem] font-extrabold tracking-tight text-slate-950">Resume headline</h2>
                <p className="mt-1 max-w-2xl text-[0.95rem] leading-6 text-[#68749a]">
                  It is the first thing recruiters notice in your profile. Write a concise headline introducing yourself to employers. (Minimum 5 words)
                </p>
              </div>
              <button
                type="button"
                onClick={closeHeadlineEditor}
                disabled={saving}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#68749a] transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
                aria-label="Close resume headline editor"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mt-8">
              <label className="text-[0.95rem] font-extrabold text-slate-950" htmlFor="resume-headline-editor">
                Resume headline<span className="text-red-500">*</span>
                <FiAward className="ml-1 inline text-[#f5a623]" size={15} />
              </label>
              <div className="mt-3 overflow-hidden rounded-[1.1rem] border border-[#e2e7f3] bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-[#edf0f7] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setHeadlineDraft(buildSuggestedHeadline(form))}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#d08a20] px-3 py-1.5 text-[0.8rem] font-bold text-[#a36300] transition hover:bg-[#fff7e8]"
                  >
                    <FiAward size={13} />
                    Improve with AI
                  </button>
                  <span className="text-[0.88rem] font-bold text-slate-900">
                    {headlineWordCount > 0 ? '1/4' : '0/4'}
                  </span>
                </div>
                <textarea
                  id="resume-headline-editor"
                  rows="7"
                  value={headlineDraft}
                  onChange={(event) => setHeadlineDraft(event.target.value.slice(0, MAX_HEADLINE_CHARS))}
                  className="min-h-[180px] w-full resize-none px-4 py-4 text-[0.96rem] leading-6 text-slate-950 outline-none"
                  placeholder="Example: Full Stack Engineer skilled in Java, Spring Boot, Node.js and MERN Stack."
                />
              </div>
              <div className={`mt-1 text-right text-xs font-semibold ${headlineCharacterCount >= MAX_HEADLINE_CHARS ? 'text-red-500' : 'text-[#8a94b7]'}`}>
                {headlineCharacterCount}/{MAX_HEADLINE_CHARS}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-5">
              <button
                type="button"
                onClick={closeHeadlineEditor}
                disabled={saving}
                className="text-[0.95rem] font-bold text-[#2d5bff] transition hover:text-[#2449d8] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHeadlineEditorSave}
                disabled={saving || (Boolean(headlineDraft.trim()) && headlineWordCount < 5)}
                className="inline-flex min-w-[92px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.95rem] font-bold text-white shadow-[0_14px_24px_-18px_rgba(45,91,255,0.7)] transition hover:bg-[#2449d8] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {skillsEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeSkillsEditor();
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[830px] overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.35rem] font-extrabold tracking-tight text-slate-950">Key skills</h2>
                <p className="mt-1 max-w-2xl text-[0.95rem] leading-6 text-[#68749a]">
                  Add skills that best define your expertise, for e.g. Direct Marketing, Oracle, Java, etc. (Minimum 1)
                </p>
              </div>
              <button
                type="button"
                onClick={closeSkillsEditor}
                disabled={saving}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#68749a] transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
                aria-label="Close key skills editor"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mt-8">
              <p className="text-[0.95rem] font-extrabold text-slate-950">Skills</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {skillsDraft.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#1f2638] bg-[#f4f6fb] px-3.5 py-1 text-[0.9rem] font-bold text-slate-950"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkillFromDraft(skill)}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
                      aria-label={`Remove ${skill}`}
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={handleSkillInputKeyDown}
                onBlur={() => addSkillsToDraft(skillInput)}
                className="mt-8 h-13 w-full rounded-[1.05rem] border border-[#e2e7f3] px-4 text-[0.95rem] text-slate-950 outline-none transition placeholder:text-[#a3abc7] focus:border-[#2d5bff] focus:ring-2 focus:ring-[#2d5bff]/10"
                placeholder="Add skills"
              />
            </div>

            <div className="mt-8">
              <p className="flex items-center gap-1.5 text-[0.95rem] font-extrabold text-slate-950">
                AI suggestions
                <FiAward className="text-[#f5a623]" size={15} />
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {skillSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSkillsToDraft(suggestion)}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#aeb8da] bg-white px-3.5 py-1 text-[0.82rem] font-medium text-[#425072] transition hover:border-[#2d5bff] hover:text-[#2d5bff]"
                  >
                    {suggestion}
                    <FiPlus size={12} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-end gap-5">
              <button
                type="button"
                onClick={closeSkillsEditor}
                disabled={saving}
                className="text-[0.95rem] font-bold text-[#2d5bff] transition hover:text-[#2449d8] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkillsEditorSave}
                disabled={saving || (skillsDraft.length === 0 && !String(skillInput || '').trim())}
                className="inline-flex min-w-[92px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.95rem] font-bold text-white shadow-[0_14px_24px_-18px_rgba(45,91,255,0.7)] transition hover:bg-[#2449d8] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {personalEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closePersonalEditor();
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[700px] overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.35rem] font-extrabold tracking-tight text-slate-950">Personal details</h2>
                <p className="mt-1 text-[0.9rem] leading-5 text-[#68749a]">This information is important for employers to know you better</p>
              </div>
              <button
                type="button"
                onClick={closePersonalEditor}
                disabled={saving}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#68749a] transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
                aria-label="Close personal details editor"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <span className={modalLabelClassName}>Gender</span>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updatePersonalDraftField('gender', option)}
                      className={`rounded-full border px-4 py-2 text-[0.84rem] font-medium transition ${
                        personalDraft.gender === option
                          ? 'border-[#1f2638] bg-[#f4f6fb] text-slate-950'
                          : 'border-[#aeb8da] bg-white text-[#425072] hover:border-[#2d5bff]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={modalLabelClassName}>Marital status</span>
                <div className="flex flex-wrap gap-2">
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updatePersonalDraftField('maritalStatus', option)}
                      className={`rounded-full border px-4 py-2 text-[0.84rem] font-medium transition ${
                        personalDraft.maritalStatus === option
                          ? 'border-[#1f2638] bg-[#f4f6fb] text-slate-950'
                          : 'border-[#aeb8da] bg-white text-[#425072] hover:border-[#2d5bff]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={modalLabelClassName}>Date of birth</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  <select value={personalDraft.birthDay} onChange={(event) => updatePersonalDraftField('birthDay', event.target.value)} className={modalSelectClassName}>
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select value={personalDraft.birthMonth} onChange={(event) => updatePersonalDraftField('birthMonth', event.target.value)} className={modalSelectClassName}>
                    <option value="">Month</option>
                    {MONTH_OPTIONS.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select value={personalDraft.birthYear} onChange={(event) => updatePersonalDraftField('birthYear', event.target.value)} className={modalSelectClassName}>
                    <option value="">Year</option>
                    {YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className={modalLabelClassName}>Category</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updatePersonalDraftField('category', option)}
                      className={`rounded-full border px-4 py-2 text-[0.84rem] font-medium transition ${
                        personalDraft.category === option
                          ? 'border-[#1f2638] bg-[#f4f6fb] text-slate-950'
                          : 'border-[#aeb8da] bg-white text-[#425072] hover:border-[#2d5bff]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className={modalLabelClassName} htmlFor="personal-work-permit">Work permit for other countries</label>
                  <input
                    id="personal-work-permit"
                    value={personalDraft.workPermit}
                    onChange={(event) => updatePersonalDraftField('workPermit', event.target.value)}
                    className={modalInputClassName}
                    placeholder="India"
                  />
                </div>
                <div>
                  <label className={modalLabelClassName} htmlFor="personal-address">Permanent address</label>
                  <input
                    id="personal-address"
                    value={personalDraft.currentAddress}
                    onChange={(event) => updatePersonalDraftField('currentAddress', event.target.value)}
                    className={modalInputClassName}
                    placeholder="House, area, city"
                  />
                </div>
                <div>
                  <label className={modalLabelClassName} htmlFor="personal-hometown">Hometown</label>
                  <input
                    id="personal-hometown"
                    value={personalDraft.hometown}
                    onChange={(event) => updatePersonalDraftField('hometown', event.target.value)}
                    className={modalInputClassName}
                    placeholder="Add hometown"
                  />
                </div>
                <div>
                  <label className={modalLabelClassName} htmlFor="personal-pincode">Pincode</label>
                  <input
                    id="personal-pincode"
                    value={personalDraft.pincode}
                    onChange={(event) => updatePersonalDraftField('pincode', event.target.value)}
                    className={modalInputClassName}
                    placeholder="Add pincode"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-[1.15rem] font-extrabold text-slate-950">Language proficiency</h3>
                <p className="mt-1 text-[0.86rem] text-[#68749a]">Strengthen your resume by letting recruiters know you can communicate in multiple languages</p>
                <div className="mt-5 space-y-5">
                  {personalDraft.languages.map((language, index) => (
                    <div key={`language-${index}`} className="grid gap-3 rounded-[1rem] border border-[#edf0f7] p-4 sm:grid-cols-2">
                      <div>
                        <label className={modalLabelClassName} htmlFor={`language-name-${index}`}>Language<span className="text-red-500">*</span></label>
                        <input
                          id={`language-name-${index}`}
                          value={language.language}
                          onChange={(event) => updatePersonalLanguage(index, 'language', event.target.value)}
                          className={modalInputClassName}
                          placeholder="Hindi"
                        />
                      </div>
                      <div>
                        <label className={modalLabelClassName} htmlFor={`language-proficiency-${index}`}>Proficiency<span className="text-red-500">*</span></label>
                        <select
                          id={`language-proficiency-${index}`}
                          value={language.proficiency}
                          onChange={(event) => updatePersonalLanguage(index, 'proficiency', event.target.value)}
                          className={modalSelectClassName}
                        >
                          <option value="Proficient">Proficient</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Beginner">Beginner</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                        {['read', 'write', 'speak'].map((field) => (
                          <label key={field} className="inline-flex items-center gap-2 text-[0.85rem] font-medium capitalize text-slate-950">
                            <input
                              type="checkbox"
                              checked={Boolean(language[field])}
                              onChange={(event) => updatePersonalLanguage(index, field, event.target.checked)}
                              className="h-4 w-4 rounded border-[#aeb8da] accent-slate-950"
                            />
                            {field}
                          </label>
                        ))}
                        <button
                          type="button"
                          onClick={() => removePersonalLanguage(index)}
                          className="ml-auto text-[0.85rem] font-bold text-[#2d5bff]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addPersonalLanguage} className="mt-4 text-[0.9rem] font-bold text-[#2d5bff]">
                  Add another language
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-5">
              <button type="button" onClick={closePersonalEditor} disabled={saving} className="text-[0.95rem] font-bold text-[#2d5bff] disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePersonalEditorSave}
                disabled={saving}
                className="inline-flex min-w-[92px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.95rem] font-bold text-white transition hover:bg-[#2449d8] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {educationEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeEducationEditor();
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[700px] overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.25rem] font-extrabold text-slate-950">Education</h2>
                <p className="mt-1 text-[0.82rem] leading-5 text-[#68749a]">Details like course, university, and more, help recruiters identify your educational background</p>
              </div>
              <button type="button" onClick={closeEducationEditor} disabled={saving} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#68749a] hover:bg-slate-50 disabled:opacity-60" aria-label="Close education editor">
                <FiX size={22} />
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className={modalLabelClassName} htmlFor="education-level">Education<span className="text-red-500">*</span></label>
                <select id="education-level" value={educationDraft.educationLevel} onChange={(event) => updateEducationDraftField('educationLevel', event.target.value)} className={modalSelectClassName}>
                  {EDUCATION_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="education-institute">University/Institute<span className="text-red-500">*</span></label>
                <input id="education-institute" value={educationDraft.instituteName} onChange={(event) => updateEducationDraftField('instituteName', event.target.value)} className={modalInputClassName} placeholder="Select university/institute" />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="education-course">Course<span className="text-red-500">*</span></label>
                <input id="education-course" value={educationDraft.courseName} onChange={(event) => updateEducationDraftField('courseName', event.target.value)} className={modalInputClassName} placeholder="Select course" />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="education-specialization">Specialization<span className="text-red-500">*</span></label>
                <input id="education-specialization" value={educationDraft.specialization} onChange={(event) => updateEducationDraftField('specialization', event.target.value)} className={modalInputClassName} placeholder="Select specialization" />
              </div>
              <div>
                <span className={modalLabelClassName}>Course type<span className="text-red-500">*</span></span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {COURSE_TYPE_OPTIONS.map((option) => (
                    <label key={option} className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-[#425072]">
                      <input
                        type="radio"
                        name="education-course-type"
                        checked={(educationDraft.courseType || 'Full time') === option}
                        onChange={() => updateEducationDraftField('courseType', option)}
                        className="h-4 w-4 accent-slate-950"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className={modalLabelClassName}>Course duration<span className="text-red-500">*</span></span>
                <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <input value={educationDraft.startYear} onChange={(event) => updateEducationDraftField('startYear', event.target.value)} className={modalInputClassName} placeholder="Starting year" />
                  <span className="text-[0.85rem] font-bold text-slate-950">To</span>
                  <input value={educationDraft.endYear || educationDraft.expectedCompletionYear} onChange={(event) => updateEducationDraftField('endYear', event.target.value)} className={modalInputClassName} placeholder="Ending year" />
                </div>
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="education-grading">Grading system</label>
                <input id="education-grading" value={educationDraft.gradingSystem || ''} onChange={(event) => updateEducationDraftField('gradingSystem', event.target.value)} className={modalInputClassName} placeholder="Select grading system" />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-5">
              <button type="button" onClick={closeEducationEditor} disabled={saving} className="text-[0.9rem] font-bold text-[#2d5bff] disabled:opacity-60">Cancel</button>
              <button type="button" onClick={handleEducationEditorSave} disabled={saving} className="inline-flex min-w-[82px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.9rem] font-bold text-white hover:bg-[#2449d8] disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {itSkillEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeItSkillEditor();
          }}
        >
          <div className="w-full max-w-[520px] rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.05rem] font-extrabold text-slate-950">IT skills <span className="text-[0.78rem] text-emerald-600">Add %</span></h2>
                <p className="mt-1 text-[0.78rem] leading-5 text-[#68749a]">Mention skills like programming languages, softwares and more, to show your technical expertise.</p>
              </div>
              <button type="button" onClick={closeItSkillEditor} disabled={saving} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#68749a] hover:bg-slate-50 disabled:opacity-60" aria-label="Close IT skills editor">
                <FiX size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className={modalLabelClassName} htmlFor="it-skill-name">Skill / software name<span className="text-red-500">*</span></label>
                <input id="it-skill-name" value={itSkillDraft.name} onChange={(event) => updateItSkillDraftField('name', event.target.value)} className={modalInputClassName} placeholder="Skill / Software name" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={modalLabelClassName} htmlFor="it-skill-version">Software version</label>
                  <input id="it-skill-version" value={itSkillDraft.version} onChange={(event) => updateItSkillDraftField('version', event.target.value)} className={modalInputClassName} placeholder="Software version" />
                </div>
                <div>
                  <label className={modalLabelClassName} htmlFor="it-skill-last-used">Last used</label>
                  <input id="it-skill-last-used" value={itSkillDraft.lastUsed} onChange={(event) => updateItSkillDraftField('lastUsed', event.target.value)} className={modalInputClassName} placeholder="Last used" />
                </div>
              </div>
              <div>
                <span className={modalLabelClassName}>Experience</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={itSkillDraft.years} onChange={(event) => updateItSkillDraftField('years', event.target.value)} className={modalInputClassName} placeholder="Years" />
                  <input value={itSkillDraft.months} onChange={(event) => updateItSkillDraftField('months', event.target.value)} className={modalInputClassName} placeholder="Months" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-5">
              <button type="button" onClick={closeItSkillEditor} disabled={saving} className="text-[0.85rem] font-bold text-[#2d5bff] disabled:opacity-60">Cancel</button>
              <button type="button" onClick={handleItSkillEditorSave} disabled={saving} className="inline-flex min-w-[82px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.85rem] font-bold text-white hover:bg-[#2449d8] disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {projectEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeProjectEditor();
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[560px] overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.05rem] font-extrabold text-slate-950">Project</h2>
                <p className="mt-1 text-[0.78rem] leading-5 text-[#68749a]">Stand out for employers by adding details about projects you have done in college, internships, or at work</p>
              </div>
              <div className="flex items-center gap-2">
                {projectEditorIndex >= 0 ? (
                  <button type="button" onClick={handleProjectDelete} disabled={saving} className="text-[0.8rem] font-bold text-[#2d5bff] disabled:opacity-60">Delete</button>
                ) : null}
                <button type="button" onClick={closeProjectEditor} disabled={saving} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#68749a] hover:bg-slate-50 disabled:opacity-60" aria-label="Close project editor">
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className={modalLabelClassName} htmlFor="project-title">Project title<span className="text-red-500">*</span></label>
                <input id="project-title" value={projectDraft.title} onChange={(event) => updateProjectDraftField('title', event.target.value)} className={modalInputClassName} placeholder="Project title" />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="project-role">Tag this project with your employment/education</label>
                <input id="project-role" value={projectDraft.role} onChange={(event) => updateProjectDraftField('role', event.target.value)} className={modalInputClassName} placeholder="Select employment/education" />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="project-client">Client</label>
                <input id="project-client" value={projectDraft.liveUrl} onChange={(event) => updateProjectDraftField('liveUrl', event.target.value)} className={modalInputClassName} placeholder="Client or live URL" />
              </div>
              <div>
                <span className={modalLabelClassName}>Project status</span>
                <div className="flex gap-10">
                  <label className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-slate-950">
                    <input type="radio" checked={Boolean(projectDraft.isOngoing)} onChange={() => updateProjectDraftField('isOngoing', true)} className="h-4 w-4 accent-slate-950" />
                    In progress
                  </label>
                  <label className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-[#8a94b7]">
                    <input type="radio" checked={!projectDraft.isOngoing} onChange={() => updateProjectDraftField('isOngoing', false)} className="h-4 w-4 accent-slate-950" />
                    Finished
                  </label>
                </div>
              </div>
              <div>
                <span className={modalLabelClassName}>Worked from<span className="text-red-500">*</span></span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={projectDraft.startYear} onChange={(event) => updateProjectDraftField('startYear', event.target.value)} className={modalInputClassName} placeholder="2025" />
                  <input value={projectDraft.endYear} onChange={(event) => updateProjectDraftField('endYear', event.target.value)} disabled={projectDraft.isOngoing} className={modalInputClassName} placeholder="Jul" />
                </div>
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="project-details">Details of project</label>
                <div className="overflow-hidden rounded-[1rem] border border-[#dfe5f2]">
                  <div className="border-b border-[#edf0f7] px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateProjectDraftField(
                          'description',
                          `- Developed ${projectDraft.title || 'a production-ready application'} with clean user flows and reliable backend integrations.\n- Designed and implemented scalable modules with secure authentication and role-based access.\n- Improved performance, maintainability, and recruiter-facing presentation through polished UI and clear architecture.`
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#d08a20] px-2.5 py-1 text-[0.72rem] font-bold text-[#a36300]"
                    >
                      <FiAward size={12} />
                      Improve with AI
                    </button>
                  </div>
                  <textarea
                    id="project-details"
                    rows="6"
                    value={projectDraft.description}
                    onChange={(event) => updateProjectDraftField('description', event.target.value.slice(0, 1000))}
                    className="w-full resize-none px-3 py-3 text-[0.82rem] leading-5 text-slate-950 outline-none"
                    placeholder="Add key project details"
                  />
                </div>
                <p className="mt-1 text-right text-[0.72rem] text-[#8a94b7]">{String(projectDraft.description || '').length}/1000</p>
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="project-location">Project location</label>
                <input id="project-location" value={projectDraft.githubUrl} onChange={(event) => updateProjectDraftField('githubUrl', event.target.value)} className={modalInputClassName} placeholder="New Delhi or source URL" />
              </div>
              <div>
                <span className={modalLabelClassName}>Project site</span>
                <div className="flex gap-10">
                  <label className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-slate-950"><input type="radio" defaultChecked className="h-4 w-4 accent-slate-950" />Offsite</label>
                  <label className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-[#8a94b7]"><input type="radio" className="h-4 w-4 accent-slate-950" />Onsite</label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-5">
              <button type="button" onClick={closeProjectEditor} disabled={saving} className="text-[0.85rem] font-bold text-[#2d5bff] disabled:opacity-60">Cancel</button>
              <button type="button" onClick={handleProjectEditorSave} disabled={saving} className="inline-flex min-w-[82px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.85rem] font-bold text-white hover:bg-[#2449d8] disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {careerEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeCareerEditor();
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[520px] overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.05rem] font-extrabold text-slate-950">Career profile</h2>
                <p className="mt-1 text-[0.78rem] leading-5 text-[#68749a]">Add details about your current and preferred job profile. This helps us personalise your job recommendations.</p>
              </div>
              <button type="button" onClick={closeCareerEditor} disabled={saving} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#68749a] hover:bg-slate-50 disabled:opacity-60" aria-label="Close career profile editor">
                <FiX size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className={modalLabelClassName} htmlFor="career-industry">Current industry<span className="text-red-500">*</span></label>
                <input id="career-industry" value={careerDraft.currentIndustry} onChange={(event) => updateCareerDraftField('currentIndustry', event.target.value)} className={modalInputClassName} placeholder="AI/ML" />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="career-department">Department<span className="text-red-500">*</span></label>
                <input id="career-department" value={careerDraft.department} onChange={(event) => updateCareerDraftField('department', event.target.value)} className={modalInputClassName} />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="career-role-category">Role category<span className="text-red-500">*</span></label>
                <input id="career-role-category" value={careerDraft.roleCategory} onChange={(event) => updateCareerDraftField('roleCategory', event.target.value)} className={modalInputClassName} />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="career-job-role">Job role<span className="text-red-500">*</span></label>
                <input id="career-job-role" value={careerDraft.jobRole} onChange={(event) => updateCareerDraftField('jobRole', event.target.value)} className={modalInputClassName} placeholder="Full Stack Developer" />
              </div>
              <div>
                <span className={modalLabelClassName}>Desired job type</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Permanent', 'Contractual'].map((option) => (
                    <label key={option} className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-[#425072]">
                      <input
                        type="checkbox"
                        checked={careerDraft.desiredJobType.toLowerCase() === option.toLowerCase()}
                        onChange={() => updateCareerDraftField('desiredJobType', option)}
                        className="h-4 w-4 rounded accent-slate-950"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className={modalLabelClassName}>Preferred shift</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['Day', 'Night', 'Flexible'].map((option) => (
                    <label key={option} className="inline-flex items-center gap-2 text-[0.82rem] font-medium text-[#425072]">
                      <input type="radio" checked={careerDraft.preferredShift === option} onChange={() => updateCareerDraftField('preferredShift', option)} className="h-4 w-4 accent-slate-950" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="career-location">Preferred work location (Max 10)</label>
                <input
                  id="career-location"
                  value={careerDraft.preferredWorkLocation}
                  onChange={(event) => updateCareerDraftField('preferredWorkLocation', event.target.value)}
                  onBlur={(event) => addCareerLocation(event.target.value)}
                  className={modalInputClassName}
                  placeholder="Tell us your location preferences to work"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {careerLocations.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => removeCareerLocation(item)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#1f2638] bg-[#f4f6fb] px-2.5 py-1 text-[0.72rem] font-bold text-slate-950"
                    >
                      {item}
                      <FiX size={11} />
                    </button>
                  ))}
                  {careerLocations.length === 0 ? WORK_LOCATION_SUGGESTIONS.slice(0, 5).map((item) => (
                    <button key={item} type="button" onClick={() => addCareerLocation(item)} className="rounded-full border border-[#aeb8da] px-2.5 py-1 text-[0.72rem] font-medium text-[#425072]">
                      {item} +
                    </button>
                  )) : null}
                </div>
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="career-salary">Expected salary</label>
                <input id="career-salary" value={careerDraft.expectedSalary} onChange={(event) => updateCareerDraftField('expectedSalary', event.target.value)} className={modalInputClassName} placeholder="6,50,000" />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-5">
              <button type="button" onClick={closeCareerEditor} disabled={saving} className="text-[0.85rem] font-bold text-[#2d5bff] disabled:opacity-60">Cancel</button>
              <button type="button" onClick={handleCareerEditorSave} disabled={saving} className="inline-flex min-w-[82px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.85rem] font-bold text-white hover:bg-[#2449d8] disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {diversityEditorOpen ? renderProfileModal(
        <div
          className={profileModalBackdropClassName}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDiversityEditor();
          }}
        >
          <div className="w-full max-w-[520px] rounded-[1.25rem] bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[1.1rem] font-extrabold text-slate-950">Diversity &amp; inclusion</h2>
                <p className="mt-1 text-[0.82rem] leading-5 text-[#68749a]">Share details to attract recruiters who value people from different backgrounds.</p>
              </div>
              <button type="button" onClick={closeDiversityEditor} disabled={saving} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#68749a] hover:bg-slate-50 disabled:opacity-60" aria-label="Close diversity editor">
                <FiX size={20} />
              </button>
            </div>
            <div className="mt-6 grid gap-5">
              <div>
                <label className={modalLabelClassName} htmlFor="diversity-category">Category</label>
                <input id="diversity-category" value={diversityDraft.caste} onChange={(event) => updateDiversityDraftField('caste', event.target.value)} className={modalInputClassName} placeholder="General" />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="diversity-religion">Religion</label>
                <input id="diversity-religion" value={diversityDraft.religion} onChange={(event) => updateDiversityDraftField('religion', event.target.value)} className={modalInputClassName} placeholder="Add religion" />
              </div>
              <div>
                <label className={modalLabelClassName} htmlFor="diversity-relocate">Willing to relocate</label>
                <select id="diversity-relocate" value={diversityDraft.willingToRelocate} onChange={(event) => updateDiversityDraftField('willingToRelocate', event.target.value)} className={modalSelectClassName}>
                  <option value="">Select preference</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-end gap-5">
              <button type="button" onClick={closeDiversityEditor} disabled={saving} className="text-[0.85rem] font-bold text-[#2d5bff] disabled:opacity-60">Cancel</button>
              <button type="button" onClick={handleDiversityEditorSave} disabled={saving} className="inline-flex min-w-[82px] items-center justify-center rounded-full bg-[#2d5bff] px-6 py-3 text-[0.85rem] font-bold text-white hover:bg-[#2449d8] disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-2.5 rounded-[1.6rem] border border-[#e6ecf5] bg-white p-3.5 shadow-[0_16px_36px_-32px_rgba(15,23,42,0.22)] sm:p-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start xl:grid-cols-[minmax(0,1fr)_272px]">
        <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              aria-label="Update profile photo"
              className="group relative shrink-0 self-start rounded-full"
              onClick={() => avatarInputRef.current?.click()}
            >
              <div
                className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full p-1"
                style={{
                  background: `conic-gradient(#ef4444 0 ${Math.max(completion, 4)}%, #e8ecf6 ${Math.max(completion, 4)}% 100%)`
                }}
              >
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[1.8rem] font-black text-slate-400">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                  ) : (
                    (userName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <span className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 rounded-full border border-red-100 bg-white px-1.5 py-0.5 text-[9px] font-bold text-red-500 shadow-sm">
                {completion}%
              </span>
              <span className="absolute -right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white bg-navy text-white shadow-md transition group-hover:bg-brand-600">
                <FiCamera size={12} />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-[1.24rem] font-extrabold tracking-tight text-navy">{userName}</h1>
                <button
                  type="button"
                  onClick={openProfileEditor}
                  className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-200 hover:text-brand-700"
                  aria-label="Edit personal details"
                >
                  <FiEdit2 size={11} />
                </button>
              </div>
              <p className="mt-0.5 text-[0.84rem] text-slate-500">
                {form.headline || form.targetRole || 'Add your professional headline'}
              </p>
              <p className="mt-0.5 text-[0.72rem] text-slate-400">Profile last updated - Yesterday</p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[0.74rem] font-bold text-emerald-700">
                  <FiTrendingUp size={12} />
                  Completion {completion}%
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[0.74rem] font-bold text-amber-700">
                  <FiFileText size={12} />
                  {hasResume ? 'Resume ready' : 'Resume missing'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.74rem] font-bold ${form.isDiscoverable ? 'border-sky-100 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                  <FiUser size={12} />
                  {form.isDiscoverable ? 'Discoverable by HR' : 'Private profile'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.74rem] font-bold ${form.availableToHire ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                  <FiCheckCircle size={12} />
                  {form.availableToHire ? 'Available to hire' : 'Availability hidden'}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <label className={`inline-flex h-10 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition ${form.isDiscoverable ? 'border-sky-200 bg-sky-50 shadow-[0_10px_22px_-18px_rgba(14,165,233,0.45)]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={form.isDiscoverable}
                      onChange={(event) => updateField('isDiscoverable', event.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-600"
                    />
                    <span className="truncate text-[0.79rem] font-bold text-navy">Recruiter visibility</span>
                  </span>
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[0.64rem] font-bold ${form.isDiscoverable ? 'bg-white text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                    {form.isDiscoverable ? 'Visible' : 'Hidden'}
                  </span>
                </label>
                <label className={`inline-flex h-10 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition ${form.availableToHire ? 'border-emerald-200 bg-emerald-50 shadow-[0_10px_22px_-18px_rgba(16,185,129,0.45)]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={form.availableToHire}
                      onChange={(event) => updateField('availableToHire', event.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-600"
                    />
                    <span className="truncate text-[0.79rem] font-bold text-navy">Open to work</span>
                  </span>
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[0.64rem] font-bold ${form.availableToHire ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {form.availableToHire ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>

              <div className="mt-2 grid gap-x-5 gap-y-2 text-[0.8rem] text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={() => openProfileEditor('location')}
                  className={`${profileMetaItemClassName} transition hover:text-brand-700`}
                >
                  <FiMapPin size={15} className="text-brand-600" />
                  {form.location || 'Add location'}
                </button>
                <span className={profileMetaItemClassName}>
                  <FiBriefcase size={15} className="text-brand-600" />
                  {employmentLabel}
                </span>
                <button
                  type="button"
                  onClick={() => openProfileEditor('availabilityToJoin')}
                  className={`${profileMetaItemClassName} transition hover:text-brand-700`}
                >
                  <FiClock size={15} className="text-brand-600" />
                  {availabilityLabel}
                </button>
                <span className={profileMetaItemClassName}>
                  <FiPhone size={15} className="text-brand-600" />
                  {form.mobile || 'Add phone number'}
                </span>
                <span className={profileMetaItemClassName}>
                  <FiMail size={15} className="text-brand-600" />
                  {form.email || 'Add email'}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5 md:flex-nowrap">
                {avatarUploading ? (
                  <span className="min-w-0 flex-1 text-[0.76rem] text-slate-400 md:whitespace-nowrap">
                    Uploading profile photo...
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#ff6b3d] px-3 py-1.5 text-[0.8rem] font-bold leading-none text-white transition hover:bg-[#ef5c30] disabled:opacity-70"
                >
                  {saving ? <FiRefreshCw size={15} className="animate-spin" /> : <FiCheckCircle size={15} />}
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </div>
          </div>

        <aside className="rounded-[1.2rem] border border-[#f7dfbf] bg-[linear-gradient(180deg,#fff5e8_0%,#fffaf2_100%)] p-3 shadow-[0_12px_24px_-22px_rgba(245,158,11,0.22)] sm:p-3.5">
          <div className="space-y-2">
            {missingSections.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToNode(sectionRefs.current[item.id])}
                  className="flex w-full items-start gap-1.5 text-left"
                >
                  <span className="mt-0.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1 text-[0.84rem] font-semibold leading-5 text-navy">
                    Add {item.label.toLowerCase()}
                  </span>
                  <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                    +{item.weight}%
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => scrollToNode(sectionRefs.current[missingSections[0]?.id || 'personal-details'])}
              className="mt-0.5 inline-flex rounded-full bg-[#ff6b3d] px-3.5 py-1.5 text-[0.8rem] font-bold text-white transition hover:bg-[#ef5c30]"
            >
              {missingSections.length > 0 ? `Add ${missingSections.length} missing details` : 'Profile looks complete'}
            </button>
          </div>
        </aside>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className={`${cardClassName} space-y-0.5 px-1`}>
            <h2 className="px-3 pb-2 text-[0.92rem] font-extrabold tracking-tight text-navy">Quick links</h2>
            {quickLinks.map((item) => {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToNode(sectionRefs.current[item.id])}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <span className="text-[0.82rem] font-medium text-slate-900">{item.label}</span>
                  <span className="text-[0.8rem] font-bold text-[#2d5bff]">{item.actionLabel}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-5">
          <article
            id="resume"
            ref={(node) => {
              sectionRefs.current.resume = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[1.05rem] font-extrabold text-slate-950">Resume</h2>
                <span className="text-[0.95rem] font-bold text-emerald-600">{hasResume ? 'Updated' : 'Add 10%'}</span>
              </div>
              {hasResume ? (
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={resumeImporting}
                  className="text-[0.95rem] font-bold text-[#2d5bff] transition hover:text-[#2449d8] disabled:opacity-70"
                >
                  Update resume
                </button>
              ) : null}
            </div>

            <p className="mt-5 text-[0.98rem] font-medium text-[#23305f]">
              70% of recruiters discover candidates through their resume
            </p>

            {hasResume ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[1.1rem] border border-[#edf0f7] bg-[#f8faff] px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2d5bff] shadow-sm">
                    <FiFileText size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[1rem] font-extrabold text-slate-950">{resumeFileName}</p>
                    <p className="mt-0.5 text-[0.82rem] text-[#8a94b7]">Stored resume is ready for one-click apply.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResumeDownload}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2d5bff] shadow-sm transition hover:bg-slate-100"
                    aria-label="Download resume text"
                  >
                    <FiDownload size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={clearResumeDraft}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2d5bff] shadow-sm transition hover:bg-slate-100"
                    aria-label="Clear resume draft"
                  >
                    <FiTrash2 size={17} />
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              disabled={resumeImporting}
              className="mt-5 flex min-h-[116px] w-full flex-col items-center justify-center rounded-[1rem] border border-dashed border-[#9facdf] px-5 py-7 text-center transition hover:border-[#2d5bff] hover:bg-[#f8faff] disabled:opacity-70"
            >
              <span className="text-[1rem] font-extrabold text-slate-950">
                Already have a resume?{' '}
                <span className="text-[#2d5bff]">{resumeImporting ? 'Uploading...' : hasResume ? 'Upload newer resume' : 'Upload resume'}</span>
              </span>
              <span className="mt-1 text-[0.92rem] font-medium text-[#68749a]">
                Supported Formats: doc, docx, rtf, pdf, upto 2 MB
              </span>
            </button>
          </article>

          <article
            id="resume-headline"
            ref={(node) => {
              sectionRefs.current['resume-headline'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[1.05rem] font-extrabold text-slate-950">Resume headline</h2>
                <FiAward className="text-[#f5a623]" size={18} />
                <button
                  type="button"
                  onClick={openHeadlineEditor}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                  aria-label="Edit resume headline"
                >
                  <FiEdit2 size={17} />
                </button>
              </div>
            </div>
            {hasResumeHeadline ? (
              <p className="mt-6 text-[0.98rem] leading-6 text-[#23305f]">{form.headline}</p>
            ) : (
              <button
                type="button"
                onClick={openHeadlineEditor}
                className="mt-6 text-[0.98rem] font-bold text-[#2d5bff] transition hover:text-[#2449d8]"
              >
                Add a professional resume headline
              </button>
            )}
          </article>

          <article
            id="key-skills"
            ref={(node) => {
              sectionRefs.current['key-skills'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[1.05rem] font-extrabold text-slate-950">Key skills</h2>
                <FiAward className="text-[#f5a623]" size={18} />
                <button
                  type="button"
                  onClick={openSkillsEditor}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                  aria-label="Edit key skills"
                >
                  <FiEdit2 size={17} />
                </button>
              </div>
            </div>
            {form.technicalSkills.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2.5">
                {form.technicalSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex min-h-8 items-center rounded-full border border-[#e0e5f2] bg-white px-3.5 py-1 text-[0.9rem] font-medium text-[#23305f] shadow-[0_8px_18px_-18px_rgba(15,23,42,0.5)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={openSkillsEditor}
                className="mt-6 text-[0.98rem] font-bold text-[#2d5bff] transition hover:text-[#2449d8]"
              >
                Add key skills
              </button>
            )}
          </article>

          <article
            id="employment"
            ref={(node) => { sectionRefs.current.employment = node; }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Employment</h2>
                  <span className="text-base font-bold text-emerald-600">{hasEmployment ? 'Updated' : 'Add 18%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Add each job separately so recruiters can clearly see your career timeline, responsibilities, and impact.
                </p>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-2 rounded-full border border-[#2d5bff] px-4 py-2 text-sm font-bold text-[#2d5bff] transition hover:bg-[#eef2ff]"
              >
                <FiPlus size={15} />
                Add employment
              </button>
            </div>

            {form.experience.length === 0 ? (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-10 text-center">
                <FiBriefcase size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-400">No employment added yet.</p>
                <p className="mt-1 text-xs text-slate-400">Click &ldquo;Add employment&rdquo; to tell recruiters about your work history.</p>
                <button
                  type="button"
                  onClick={addExperience}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
                >
                  <FiPlus size={14} />
                  Add first job
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {form.experience.map((entry, index) => (
                  <div
                    key={`exp-${index}`}
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    {/* Card header */}
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold text-navy">
                          {entry.designation || entry.companyName || `Experience #${index + 1}`}
                        </p>
                        {entry.designation && entry.companyName && (
                          <p className="mt-0.5 text-sm text-slate-500">{entry.companyName}</p>
                        )}
                        {(entry.startYear || entry.isCurrentlyWorking) && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {entry.startYear || ''}
                            {entry.startYear ? ' – ' : ''}
                            {entry.isCurrentlyWorking ? 'Present' : entry.endYear || ''}
                            {entry.location ? ` · ${entry.location}` : ''}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50"
                      >
                        <FiTrash2 size={13} />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Company name */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">Company name <span className="text-red-400">*</span></p>
                        <input
                          value={entry.companyName}
                          onChange={(e) => updateExperience(index, 'companyName', e.target.value)}
                          placeholder="e.g. Infosys, Startupname, Freelance"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>

                      {/* Designation */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">Designation / Role <span className="text-red-400">*</span></p>
                        <input
                          value={entry.designation}
                          onChange={(e) => updateExperience(index, 'designation', e.target.value)}
                          placeholder="e.g. Software Engineer, Intern, Team Lead"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>

                      {/* Employment type */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">Employment type</p>
                        <select
                          value={entry.employmentType}
                          onChange={(e) => updateExperience(index, 'employmentType', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Internship">Internship</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>

                      {/* Location */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">Location</p>
                        <input
                          value={entry.location}
                          onChange={(e) => updateExperience(index, 'location', e.target.value)}
                          placeholder="e.g. Mumbai / Remote / Hybrid"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>

                      {/* Start year */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">Start year</p>
                        <input
                          value={entry.startYear}
                          onChange={(e) => updateExperience(index, 'startYear', e.target.value)}
                          placeholder="e.g. 2022"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>

                      {/* End year + currently working */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">End year</p>
                        <input
                          value={entry.endYear}
                          onChange={(e) => updateExperience(index, 'endYear', e.target.value)}
                          placeholder="e.g. 2024"
                          disabled={entry.isCurrentlyWorking}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={entry.isCurrentlyWorking}
                            onChange={(e) => {
                              updateExperience(index, 'isCurrentlyWorking', e.target.checked);
                              if (e.target.checked) updateExperience(index, 'endYear', '');
                            }}
                            className="h-4 w-4 rounded accent-[#2d5bff]"
                          />
                          I currently work here
                        </label>
                      </div>

                      {/* Responsibilities */}
                      <div className="md:col-span-2">
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">Key responsibilities</p>
                        <textarea
                          rows="3"
                          value={entry.responsibilities}
                          onChange={(e) => updateExperience(index, 'responsibilities', e.target.value)}
                          placeholder="Describe what you did day-to-day. e.g. Built REST APIs for user auth module, Led frontend migration from jQuery to React, Managed a team of 3 interns..."
                          className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>

                      {/* Key achievement */}
                      <div className="md:col-span-2">
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">
                          Key achievement <span className="font-normal text-slate-400">(quantify it — recruiters love numbers)</span>
                        </p>
                        <input
                          value={entry.keyAchievement}
                          onChange={(e) => updateExperience(index, 'keyAchievement', e.target.value)}
                          placeholder="e.g. Reduced page load time by 40% · Increased sales conversions by ₹5L/month · Shipped feature used by 10k+ users"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>

                      {/* Tech stack */}
                      <div className="md:col-span-2">
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">Technologies used <span className="font-normal text-slate-400">(comma-separated)</span></p>
                        <input
                          value={joinCommaList(entry.techStack)}
                          onChange={(e) => updateExperience(index, 'techStack', parseCommaList(e.target.value))}
                          placeholder="e.g. React, Node.js, PostgreSQL, Docker, AWS"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                        {entry.techStack?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {entry.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-xs font-semibold text-[#2d5bff]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-[#2d5bff] hover:text-[#2d5bff]"
                >
                  <FiPlus size={15} />
                  Add another job
                </button>
              </div>
            )}
          </article>

          <article
            id="education"
            ref={(node) => {
              sectionRefs.current.education = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[1.05rem] font-extrabold text-slate-950">Education</h2>
              <button type="button" onClick={() => openEducationEditor()} className="text-[0.9rem] font-bold text-[#2d5bff]">
                Add education
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {educationDisplayEntries.length > 0 ? (
                educationDisplayEntries.map((entry, index) => (
                  <div key={`education-display-${index}`} className="max-w-[620px]">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[0.88rem] font-extrabold text-slate-950">
                          {getEducationDisplayTitle(entry, index)}
                        </p>
                        <p className="mt-1 text-[0.82rem] font-semibold text-slate-950">
                          {entry.instituteName || entry.universityBoard || 'Add institute name'}
                        </p>
                        <p className="mt-1 text-[0.8rem] text-[#68749a]">{getEducationDisplayMeta(entry)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEducationEditor(index)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                        aria-label="Edit education"
                      >
                        <FiEdit2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <button type="button" onClick={() => openEducationEditor()} className="text-[0.9rem] font-bold text-[#2d5bff]">
                  Add your education details
                </button>
              )}
            </div>

            <div className="mt-7 space-y-5">
              <button type="button" onClick={() => openEducationEditor(-1, 'Doctorate / PhD')} className="block text-[0.9rem] font-bold text-[#2d5bff]">
                Add doctorate/PhD
              </button>
              <button type="button" onClick={() => openEducationEditor(-1, 'Masters / Post Graduation')} className="block text-[0.9rem] font-bold text-[#2d5bff]">
                Add masters/post-graduation
              </button>
            </div>
          </article>

          <article
            id="it-skills"
            ref={(node) => {
              sectionRefs.current['it-skills'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[1.05rem] font-extrabold text-slate-950">IT skills</h2>
              <button type="button" onClick={() => openItSkillEditor()} className="text-[0.9rem] font-bold text-[#2d5bff]">
                Add details
              </button>
            </div>
            {itSkillRows.length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[0.82rem]">
                  <thead className="border-b border-[#e2e7f3] text-[#68749a]">
                    <tr>
                      <th className="pb-3 font-medium">Skills</th>
                      <th className="pb-3 font-medium">Version</th>
                      <th className="pb-3 font-medium">Last used</th>
                      <th className="pb-3 font-medium">Experience</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent text-[#23305f]">
                    {itSkillRows.map((row, index) => (
                      <tr key={`${row.name}-${index}`}>
                        <td className="py-3 font-bold">{row.name}</td>
                        <td className="py-3">{row.version}</td>
                        <td className="py-3">{row.lastUsed}</td>
                        <td className="py-3">{row.experience}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openItSkillEditor(index, row.name)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                            aria-label={`Edit ${row.name}`}
                          >
                            <FiEdit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <button type="button" onClick={() => openItSkillEditor()} className="mt-5 text-[0.9rem] font-bold text-[#2d5bff]">
                Add IT skill
              </button>
            )}
          </article>

          <article
            id="projects"
            ref={(node) => { sectionRefs.current.projects = node; }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[1.05rem] font-extrabold text-slate-950">Projects</h2>
                <FiAward className="text-[#f5a623]" size={16} />
              </div>
              <button type="button" onClick={() => openProjectEditor()} className="text-[0.9rem] font-bold text-[#2d5bff]">
                Add project
              </button>
            </div>

            {form.projects.length === 0 ? (
              <div className="mt-5 rounded-[1rem] border border-dashed border-[#c7d0ee] px-5 py-7 text-center">
                <p className="text-[0.9rem] font-semibold text-[#68749a]">Add college projects, personal builds, or internship work.</p>
                <button type="button" onClick={() => openProjectEditor()} className="mt-3 text-[0.9rem] font-bold text-[#2d5bff]">
                  Add first project
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {form.projects.map((entry, index) => (
                  <div key={`project-display-${index}`} className="border-b border-transparent pb-2 last:border-b-0">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.88rem] font-extrabold text-slate-950">{entry.title || `Project #${index + 1}`}</p>
                        <p className="mt-1 whitespace-pre-line text-[0.78rem] font-medium text-slate-950">{getProjectDisplayMeta(entry)}</p>
                        <p className="mt-1 text-[0.78rem] leading-5 text-[#23305f]">
                          - {previewText(entry.description)}
                          {String(entry.description || '').length > 220 ? (
                            <button type="button" onClick={() => openProjectEditor(index)} className="ml-1 font-bold text-[#2d5bff]">
                              Read More
                            </button>
                          ) : null}
                        </p>
                        {entry.techStack?.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {entry.techStack.map((tech) => (
                              <span key={tech} className="rounded-full border border-[#e0e5f2] px-2 py-0.5 text-[0.7rem] font-medium text-[#425072]">
                                {tech}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => openProjectEditor(index)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                        aria-label="Edit project"
                      >
                        <FiEdit2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
          <article
            id="profile-summary"
            ref={(node) => {
              sectionRefs.current['profile-summary'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Profile summary</h2>
                  <span className="text-base font-bold text-emerald-600">{hasProfileSummary ? 'Updated' : 'Add 8%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Highlight your key career achievements to help employers know your potential.</p>
              </div>
              <button type="button" onClick={() => scrollToNode(sectionRefs.current['profile-summary'])} className="text-lg font-bold text-[#2d5bff]">
                Add profile summary
              </button>
            </div>
            <textarea
              rows="6"
              value={form.profileSummary}
              onChange={(event) => updateField('profileSummary', event.target.value)}
              className="mt-5 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              placeholder="Write a concise recruiter-facing summary about your experience, strengths, and preferred roles."
            />
          </article>

          <article
            id="accomplishments"
            ref={(node) => {
              sectionRefs.current.accomplishments = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-navy">Accomplishments</h2>
                <p className="mt-2 text-sm text-slate-500">Showcase your credentials by adding relevant certifications, work samples, and online profiles.</p>
              </div>
              <button type="button" onClick={() => scrollToNode(sectionRefs.current.accomplishments)} className="text-lg font-bold text-[#2d5bff]">
                {hasAccomplishments ? 'Update' : 'Add'}
              </button>
            </div>

            <div className="mt-6 divide-y divide-slate-200">
              {[
                {
                  title: 'Online profile',
                  hint: 'Add link to online professional profiles (e.g. LinkedIn, etc.)',
                  field: 'linkedinUrl',
                  value: form.linkedinUrl,
                  placeholder: 'https://linkedin.com/in/username'
                },
                {
                  title: 'Work sample',
                  hint: 'Link relevant work samples (e.g. Github, Behance)',
                  field: 'portfolioUrl',
                  value: form.portfolioUrl,
                  placeholder: 'https://portfolio.example.com'
                },
                {
                  title: 'Presentation',
                  hint: 'Add links to your online presentations',
                  field: 'githubUrl',
                  value: form.githubUrl,
                  placeholder: 'https://github.com/username'
                }
              ].map((item) => (
                <div key={item.field} className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
                  <div>
                    <p className="text-xl font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
                    <input
                      value={item.value}
                      onChange={(event) => updateField(item.field, event.target.value)}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                      placeholder={item.placeholder}
                    />
                  </div>
                  <button type="button" onClick={() => scrollToNode(sectionRefs.current.accomplishments)} className="justify-self-start text-lg font-bold text-[#2d5bff] md:justify-self-end">
                    {item.value ? 'Update' : 'Add'}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <textarea rows="4" value={joinLineList(form.certifications)} onChange={(event) => updateField('certifications', parseLineList(event.target.value))} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Certifications, one per line" />
              <textarea rows="4" value={joinLineList(form.achievements)} onChange={(event) => updateField('achievements', parseLineList(event.target.value))} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Achievements, one per line" />
            </div>
          </article>

          <article
            id="career-profile"
            ref={(node) => {
              sectionRefs.current['career-profile'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-[1.05rem] font-extrabold text-slate-950">Career profile</h2>
              <button
                type="button"
                onClick={openCareerEditor}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                aria-label="Edit career profile"
              >
                <FiEdit2 size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2">
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Current industry</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">{form.careerObjective || 'Add current industry'}</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Department</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">Engineering - Software &amp; QA</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Role category</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">Software Development</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Job role</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">{form.targetRole || 'Add job role'}</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Desired job type</p>
                <p className="mt-1 text-[0.9rem] font-bold capitalize text-[#23305f]">{form.preferredJobType || 'permanent'}</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Desired employment type</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">Full Time</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Preferred shift</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">Flexible</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Preferred work location</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">
                  {displayCareerLocations.length > 0 ? displayCareerLocations.join(', ') : 'Add preferred work location'}
                </p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Expected salary</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">{formatSalary(preferredSalary)}</p>
              </div>
            </div>
          </article>

          <article
            id="personal-details"
            ref={(node) => {
              sectionRefs.current['personal-details'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-[1.05rem] font-extrabold text-slate-950">Personal details</h2>
              <button
                type="button"
                onClick={openPersonalEditor}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                aria-label="Edit personal details"
              >
                <FiEdit2 size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2">
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Personal</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">
                  {personalSummary}
                  {form.gender || form.maritalStatus ? (
                    <button type="button" onClick={openPersonalEditor} className="ml-1 font-bold text-[#2d5bff]">Add more info</button>
                  ) : null}
                </p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Work permit</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">India</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Date of birth</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">{formatDateOfBirth(form.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Address</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">{addressSummary || 'Add address'}</p>
              </div>
              <div>
                <p className="text-[0.84rem] text-[#68749a]">Category</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">{form.caste || 'Add category'}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#e2e7f3] pt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[1rem] font-extrabold text-slate-950">Languages</h3>
                <button type="button" onClick={openPersonalEditor} className="text-[0.9rem] font-bold text-[#2d5bff]">
                  Add languages
                </button>
              </div>
              {languageRows.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[0.84rem]">
                    <thead className="border-b border-[#e2e7f3] text-[#68749a]">
                      <tr>
                        <th className="pb-3 font-medium">Languages</th>
                        <th className="pb-3 font-medium">Proficiency</th>
                        <th className="pb-3 text-center font-medium">Read</th>
                        <th className="pb-3 text-center font-medium">Write</th>
                        <th className="pb-3 text-center font-medium">Speak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {languageRows.map((language) => (
                        <tr key={language.language}>
                          <td className="py-3 font-bold text-[#23305f]">{language.language}</td>
                          <td className="py-3 font-bold text-[#23305f]">{language.proficiency}</td>
                          {['read', 'write', 'speak'].map((field) => (
                            <td key={field} className="py-3 text-center text-[#173a79]">
                              {language[field] ? <FiCheckCircle className="mx-auto" size={15} /> : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <button type="button" onClick={openPersonalEditor} className="mt-4 text-[0.9rem] font-bold text-[#2d5bff]">
                  Add language proficiency
                </button>
              )}
            </div>
          </article>

          <article
            id="diversity-inclusion"
            ref={(node) => {
              sectionRefs.current['diversity-inclusion'] = node;
            }}
            className={`${cardClassName} relative`}
          >
            <span className="absolute right-4 top-0 inline-flex rounded-b-xl bg-[#f0ebff] px-3 py-1 text-[0.72rem] font-bold text-[#8c6cf6]">New</span>
            <div className="flex items-center gap-2">
              <h2 className="text-[1.05rem] font-extrabold text-slate-950">Diversity &amp; inclusion</h2>
              <button
                type="button"
                onClick={openDiversityEditor}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6070a6] transition hover:bg-[#f3f6ff] hover:text-[#2d5bff]"
                aria-label="Edit diversity and inclusion"
              >
                <FiEdit2 size={16} />
              </button>
            </div>
            <p className="mt-2 text-[0.85rem] text-[#23305f]">Share details to attract recruiters who value people from different backgrounds</p>
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-[0.78rem] text-[#68749a]">Disability status</p>
                <p className="mt-1 text-[0.9rem] font-bold text-[#23305f]">Do not have disability</p>
              </div>
              <button type="button" onClick={openDiversityEditor} className="block text-[0.9rem] font-bold text-[#2d5bff]">
                Add military experience
              </button>
              <button type="button" onClick={openDiversityEditor} className="block text-[0.9rem] font-bold text-[#2d5bff]">
                Add career break
              </button>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default StudentProfilePage;
