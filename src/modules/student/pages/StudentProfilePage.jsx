import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FiAward,
  FiBook,
  FiBriefcase,
  FiCamera,
  FiCheckCircle,
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
  FiUploadCloud,
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
  noticePeriodDays: ''
};

const SECTION_META = [
  { id: 'resume', label: 'Resume', weight: 12, icon: FiFileText },
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

const generatedResume = (form = EMPTY_FORM) =>
  [
    form.name || 'Student Name',
    form.headline || form.targetRole || 'Professional Headline',
    [form.email, form.mobile, form.location].filter(Boolean).join(' | '),
    [form.linkedinUrl, form.githubUrl, form.portfolioUrl].filter(Boolean).join(' | '),
    '',
    'SUMMARY',
    form.profileSummary || 'Add your professional summary.',
    '',
    'TECHNICAL SKILLS',
    joinCommaList(form.technicalSkills) || 'Add technical skills',
    '',
    'EXPERIENCE',
    ...(form.experience.length ? form.experience.map((item) => `- ${item}`) : ['- Add experience']),
    '',
    'PROJECTS',
    ...(form.projects.length ? form.projects.map((item) => `- ${item}`) : ['- Add projects']),
    '',
    'EDUCATION',
    ...(form.educationEntries.some(hasEducationContent)
      ? form.educationEntries
          .filter(hasEducationContent)
          .map((item) => `- ${[item.courseName, item.instituteName, item.endYear || item.expectedCompletionYear].filter(Boolean).join(' | ')}`)
      : ['- Add education'])
  ]
    .filter((line) => line !== '')
    .join('\n');

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
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);

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

  useEffect(() => () => timerRef.current && window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!avatarPreviewOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setAvatarPreviewOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [avatarPreviewOpen]);

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
        educationEntries: ensureEducationEntries(data.educationEntries)
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

  const addEducation = (educationLevel = 'Graduation') =>
    setForm((current) => ({
      ...current,
      educationEntries: [...current.educationEntries, createEmptyEducation(educationLevel)]
    }));

  const removeEducation = (index) =>
    setForm((current) => {
      if (current.educationEntries.length <= 1) {
        return { ...current, educationEntries: [createEmptyEducation()] };
      }

      return {
        ...current,
        educationEntries: current.educationEntries.filter((_, entryIndex) => entryIndex !== index)
      };
    });

  const updateEducation = (index, field, value) =>
    setForm((current) => ({
      ...current,
      educationEntries: current.educationEntries.map((item, entryIndex) =>
        entryIndex === index ? { ...item, [field]: value } : item
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
  const availabilityLabel = form.availabilityToJoin || 'Add availability to join';
  const resumeFileName = getResumeFileName(form);

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
    <div className="mx-auto w-full max-w-[1120px] space-y-7 pb-12">
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_382px]">
        <div className={`${cardClassName} flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between`}>
          <div className="flex flex-col gap-5 sm:flex-row">
            <button
              type="button"
              aria-label={form.avatarUrl ? 'Preview profile photo' : 'Profile photo'}
              className={`relative shrink-0 self-start rounded-full ${form.avatarUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
              onClick={() => form.avatarUrl && setAvatarPreviewOpen(true)}
            >
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full p-1"
                style={{
                  background: `conic-gradient(#ef4444 0 ${Math.max(completion, 4)}%, #e8ecf6 ${Math.max(completion, 4)}% 100%)`
                }}
              >
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-100 text-4xl font-black text-slate-400">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                  ) : (
                    (userName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <span className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 rounded-full border border-red-100 bg-white px-3 py-1 text-xs font-bold text-red-500 shadow-sm">
                {completion}%
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[2.2rem] font-extrabold tracking-tight text-navy">{userName}</h1>
                <button
                  type="button"
                  onClick={() => scrollToNode(sectionRefs.current['personal-details'])}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-200 hover:text-brand-700"
                  aria-label="Edit personal details"
                >
                  <FiEdit2 size={15} />
                </button>
              </div>
              <p className="mt-2 text-[1.12rem] text-slate-500">
                {form.headline || form.targetRole || 'Add your professional headline'}
              </p>
              <p className="mt-1 text-[0.96rem] text-slate-400">Profile last updated - Yesterday</p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  <FiTrendingUp />
                  Completion {completion}%
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                  <FiFileText />
                  {hasResume ? 'Resume ready' : 'Resume missing'}
                </span>
              </div>

              <div className="mt-5 grid gap-x-5 gap-y-3 text-[0.98rem] text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                <span className="inline-flex items-center gap-2">
                  <FiMapPin className="text-brand-600" />
                  {form.location || 'Add location'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiBriefcase className="text-brand-600" />
                  {employmentLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiRefreshCw className="text-brand-600" />
                  {availabilityLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiPhone className="text-brand-600" />
                  {form.mobile || 'Add phone number'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiMail className="text-brand-600" />
                  {form.email || 'Add email'}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-70"
                >
                  {avatarUploading ? <FiRefreshCw className="animate-spin" /> : <FiCamera />}
                  {avatarUploading ? 'Uploading photo...' : 'Upload Photo'}
                </button>
                <span className="text-sm text-slate-400">PNG, JPG, or WEBP up to 4 MB</span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ef5c30] disabled:opacity-70"
                >
                  {saving ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className={`${cardClassName} bg-[linear-gradient(180deg,#fff5e8_0%,#fffaf2_100%)]`}>
          <div className="space-y-4">
            {missingSections.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToNode(sectionRefs.current[item.id])}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1 text-[1.02rem] font-semibold leading-6 text-navy">
                    Add {item.label.toLowerCase()}
                  </span>
                  <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-600">
                    +{item.weight}%
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => scrollToNode(sectionRefs.current[missingSections[0]?.id || 'personal-details'])}
              className="mt-2 inline-flex rounded-full bg-[#ff6b3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
            >
              {missingSections.length > 0 ? `Add ${missingSections.length} missing details` : 'Profile looks complete'}
            </button>
          </div>
        </aside>
      </section>

      {avatarPreviewOpen && form.avatarUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/75 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setAvatarPreviewOpen(false);
          }}
        >
          <div className="w-full max-w-xl rounded-[1.75rem] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setAvatarPreviewOpen(false)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FiX size={16} />
                Close
              </button>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
              <img src={form.avatarUrl} alt="Profile preview" className="max-h-[75vh] w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className={`${cardClassName} space-y-1.5 px-1`}>
            <h2 className="px-3 pb-3 text-[1.15rem] font-extrabold tracking-tight text-navy">Quick links</h2>
            {quickLinks.map((item) => {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToNode(sectionRefs.current[item.id])}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <span className="text-[0.98rem] font-medium text-slate-900">{item.label}</span>
                  <span className="text-[0.97rem] font-bold text-[#2d5bff]">{item.actionLabel}</span>
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Resume</h2>
                  <span className="text-base font-bold text-emerald-600">{hasResume ? 'Updated' : 'Add 12%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {hasResume ? 'Your stored resume is ready for one-click apply.' : 'Upload your latest resume to unlock recruiter-ready apply.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                disabled={resumeImporting}
                className="text-lg font-bold text-[#2d5bff] transition hover:text-[#2449d8] disabled:opacity-70"
              >
                {hasResume ? 'Update resume' : 'Upload resume'}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-lg font-bold text-slate-900">{resumeFileName}</p>
                <p className="mt-1 text-sm text-slate-400">Uploaded on Apr 09, 2026</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResumeDownload}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2d5bff] shadow-sm transition hover:bg-slate-100"
                  aria-label="Download resume text"
                >
                  <FiDownload />
                </button>
                <button
                  type="button"
                  onClick={clearResumeDraft}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2d5bff] shadow-sm transition hover:bg-slate-100"
                  aria-label="Clear resume draft"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-dashed border-[#b7c4f7] px-5 py-8 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={resumeImporting}
                  className="inline-flex items-center justify-center rounded-full border border-[#2d5bff] px-5 py-2.5 text-sm font-bold text-[#2d5bff] transition hover:bg-[#eef2ff] disabled:opacity-70"
                >
                  {resumeImporting ? 'Importing...' : 'Update resume'}
                </button>
                <button
                  type="button"
                  onClick={() => updateField('resumeText', generatedResume(form))}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Generate draft
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-400">Supported formats: doc, docx, rtf, pdf, upto 2 MB</p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="student-resume-text">
                Resume text
              </label>
              <textarea
                id="student-resume-text"
                rows="8"
                value={form.resumeText}
                onChange={(event) => updateField('resumeText', event.target.value)}
                className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                placeholder="Paste resume text here or upload a file to auto-fill profile sections."
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleResumeImport({
                      resumeText: form.resumeText,
                      successMessage: 'Resume text parsed into profile draft.'
                    })
                  }
                  disabled={resumeImporting || !String(form.resumeText || '').trim()}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100 disabled:opacity-70"
                >
                  <FiUploadCloud />
                  Import from text
                </button>
              </div>
            </div>
          </article>

          <article
            id="resume-headline"
            ref={(node) => {
              sectionRefs.current['resume-headline'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Resume headline</h2>
                  <span className="text-base font-bold text-emerald-600">{hasResumeHeadline ? 'Updated' : 'Add 8%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Add a summary headline so recruiters quickly understand your intent.</p>
              </div>
              <button type="button" onClick={() => scrollToNode(sectionRefs.current['resume-headline'])} className="text-lg font-bold text-[#2d5bff]">
                {hasResumeHeadline ? 'Update headline' : 'Add resume headline'}
              </button>
            </div>
            <input
              value={form.headline}
              onChange={(event) => updateField('headline', event.target.value)}
              className="mt-5 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              placeholder="Add a recruiter-friendly profile headline"
            />
          </article>

          <article
            id="key-skills"
            ref={(node) => {
              sectionRefs.current['key-skills'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Key skills</h2>
                  <span className="text-base font-bold text-emerald-600">{hasKeySkills ? 'Updated' : 'Add 8%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Recruiters look for candidates with specific key skills.</p>
              </div>
              <button type="button" onClick={() => scrollToNode(sectionRefs.current['key-skills'])} className="text-lg font-bold text-[#2d5bff]">
                {hasKeySkills ? 'Update key skills' : 'Add key skills'}
              </button>
            </div>
            {form.technicalSkills.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {form.technicalSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-[#eef2ff] px-3 py-1 text-sm font-semibold text-[#2d5bff]">
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
            <textarea
              rows="3"
              value={joinCommaList(form.technicalSkills)}
              onChange={(event) => updateField('technicalSkills', parseCommaList(event.target.value))}
              className="mt-5 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              placeholder="React, Node.js, SQL, UI Design"
            />
          </article>

          <article
            id="employment"
            ref={(node) => {
              sectionRefs.current.employment = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Employment</h2>
                  <span className="text-base font-bold text-emerald-600">{hasEmployment ? 'Updated' : 'Add 18%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Your employment details will help recruiters understand your experience.</p>
              </div>
              <button type="button" onClick={() => scrollToNode(sectionRefs.current.employment)} className="text-lg font-bold text-[#2d5bff]">
                {hasEmployment ? 'Update employment' : 'Add employment'}
              </button>
            </div>
            <textarea
              rows="5"
              value={joinLineList(form.experience)}
              onChange={(event) => updateField('experience', parseLineList(event.target.value))}
              className="mt-5 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              placeholder="Frontend Developer Intern - Built dashboards&#10;Software Engineer - Worked on APIs"
            />
          </article>

          <article
            id="education"
            ref={(node) => {
              sectionRefs.current.education = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Education</h2>
                  <span className="text-base font-bold text-emerald-600">{hasEducation ? 'Updated' : 'Add 10%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Your qualifications help employers know your educational background.</p>
              </div>
              <button type="button" onClick={() => addEducation()} className="text-lg font-bold text-[#2d5bff]">
                Add education
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {['Doctorate/PhD', 'Masters/Post-graduation', 'Graduation/Diploma', 'Class XII', 'Class X', 'Below 10th'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => addEducation(label)}
                  className="text-left text-base font-semibold text-[#2d5bff] transition hover:text-[#2449d8]"
                >
                  Add {label.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {form.educationEntries.map((entry, index) => (
                <div key={`education-entry-${index}`} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900">Education #{index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      disabled={form.educationEntries.length <= 1}
                      className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3 py-1.5 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <FiTrash2 />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input value={entry.educationLevel} onChange={(event) => updateEducation(index, 'educationLevel', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Education level" />
                    <input value={entry.courseName} onChange={(event) => updateEducation(index, 'courseName', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Course or degree" />
                    <input value={entry.instituteName} onChange={(event) => updateEducation(index, 'instituteName', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Institute name" />
                    <input value={entry.universityBoard} onChange={(event) => updateEducation(index, 'universityBoard', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="University or board" />
                    <input value={entry.specialization} onChange={(event) => updateEducation(index, 'specialization', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Specialization" />
                    <input value={entry.startYear} onChange={(event) => updateEducation(index, 'startYear', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Start year" />
                    <input value={entry.endYear} onChange={(event) => updateEducation(index, 'endYear', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="End year" />
                    <input value={entry.expectedCompletionYear} onChange={(event) => updateEducation(index, 'expectedCompletionYear', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Expected completion year" />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article
            id="it-skills"
            ref={(node) => {
              sectionRefs.current['it-skills'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">IT skills</h2>
                  <span className="text-base font-bold text-emerald-600">{hasItSkills ? 'Updated' : 'Add 10%'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Show your technical expertise by mentioning softwares and skills you know.</p>
              </div>
              <button type="button" onClick={() => scrollToNode(sectionRefs.current['it-skills'])} className="text-lg font-bold text-[#2d5bff]">
                Add details
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <textarea rows="4" value={joinCommaList(form.toolsTechnologies)} onChange={(event) => updateField('toolsTechnologies', parseCommaList(event.target.value))} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Git, Docker, Postman, Jira" />
              <textarea rows="4" value={joinCommaList(form.softSkills)} onChange={(event) => updateField('softSkills', parseCommaList(event.target.value))} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Communication, teamwork, ownership" />
            </div>
          </article>

          <article
            id="projects"
            ref={(node) => {
              sectionRefs.current.projects = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-navy">Projects</h2>
                <p className="mt-2 text-sm text-slate-500">Stand out to employers by adding details about projects that you have done so far.</p>
              </div>
              <button type="button" onClick={() => scrollToNode(sectionRefs.current.projects)} className="text-lg font-bold text-[#2d5bff]">
                Add project
              </button>
            </div>
            <textarea
              rows="5"
              value={joinLineList(form.projects)}
              onChange={(event) => updateField('projects', parseLineList(event.target.value))}
              className="mt-5 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              placeholder="Portfolio website&#10;Campus hiring dashboard&#10;Inventory app"
            />
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Career profile</h2>
                  <button type="button" onClick={() => scrollToNode(sectionRefs.current['career-profile'])} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-200 hover:text-brand-700">
                    <FiEdit2 size={15} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">Add details about your current and preferred career profile. This helps us personalise your job recommendations.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-400">Current role / industry</p>
                <input value={form.targetRole} onChange={(event) => updateField('targetRole', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add current industry" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Preferred work location</p>
                <input value={form.preferredWorkLocation} onChange={(event) => updateField('preferredWorkLocation', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add preferred work location" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Desired job type</p>
                <input value={form.preferredJobType} onChange={(event) => updateField('preferredJobType', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add desired job type" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Availability to join</p>
                <input value={form.availabilityToJoin} onChange={(event) => updateField('availabilityToJoin', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add availability" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Expected salary</p>
                <input value={preferredSalary} onChange={(event) => updateField('expectedSalary', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add expected salary" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Notice period (days)</p>
                <input value={form.noticePeriodDays} onChange={(event) => updateField('noticePeriodDays', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add notice period" />
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Personal details</h2>
                  <button type="button" onClick={() => scrollToNode(sectionRefs.current['personal-details'])} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-200 hover:text-brand-700">
                    <FiEdit2 size={15} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">This information is important for employers to know you better.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div><p className="text-sm text-slate-400">Full name</p><input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add full name" /></div>
              <div><p className="text-sm text-slate-400">Email</p><input value={form.email} disabled className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500" /></div>
              <div><p className="text-sm text-slate-400">Mobile number</p><input value={form.mobile} onChange={(event) => updateField('mobile', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add mobile number" /></div>
              <div><p className="text-sm text-slate-400">Location</p><input value={form.location} onChange={(event) => updateField('location', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add location" /></div>
              <div><p className="text-sm text-slate-400">Gender</p><input value={form.gender} onChange={(event) => updateField('gender', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add gender" /></div>
              <div><p className="text-sm text-slate-400">Date of birth</p><input value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add date of birth" /></div>
              <div><p className="text-sm text-slate-400">Marital status</p><input value={form.maritalStatus} onChange={(event) => updateField('maritalStatus', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add marital status" /></div>
              <div><p className="text-sm text-slate-400">Address</p><input value={form.currentAddress} onChange={(event) => updateField('currentAddress', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add address" /></div>
            </div>
          </article>

          <article
            id="diversity-inclusion"
            ref={(node) => {
              sectionRefs.current['diversity-inclusion'] = node;
            }}
            className={cardClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-navy">Diversity &amp; inclusion</h2>
                  <button type="button" onClick={() => scrollToNode(sectionRefs.current['diversity-inclusion'])} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-200 hover:text-brand-700">
                    <FiEdit2 size={15} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">Share details to attract recruiters who value people from different backgrounds.</p>
              </div>
              <span className="inline-flex rounded-full bg-[#f0ebff] px-3 py-1 text-xs font-bold text-[#8c6cf6]">New</span>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div><p className="text-sm text-slate-400">Category</p><input value={form.caste} onChange={(event) => updateField('caste', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add category" /></div>
              <div><p className="text-sm text-slate-400">Religion</p><input value={form.religion} onChange={(event) => updateField('religion', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add religion" /></div>
              <div><p className="text-sm text-slate-400">Willing to relocate</p><select value={String(form.willingToRelocate)} onChange={(event) => updateField('willingToRelocate', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"><option value="">Select preference</option><option value="true">Yes</option><option value="false">No</option></select></div>
              <div><p className="text-sm text-slate-400">Languages</p><input value={joinCommaList(form.languagesKnown)} onChange={(event) => updateField('languagesKnown', parseCommaList(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Add languages" /></div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default StudentProfilePage;
