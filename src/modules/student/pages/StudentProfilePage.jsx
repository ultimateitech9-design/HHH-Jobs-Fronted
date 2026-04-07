import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiAward, FiBook, FiBriefcase, FiCamera, FiCheckCircle, FiDownload, FiFileText, FiPlus, FiRefreshCw, FiTrash2, FiTrendingUp, FiUploadCloud, FiUser } from 'react-icons/fi';
import useAuthStore from '../../../core/auth/authStore';
import { getToken, setAuthSession } from '../../../utils/auth';
import { getResumeScore, getStudentProfile, importStudentResume, updateStudentAvatar, updateStudentProfile, uploadStudentResume } from '../services/studentApi';
import {
  applyImportedResumeToProfile,
  readFileAsDataUrl,
  readResumeImportPayload,
  STUDENT_RESUME_ACCEPT,
  summarizeImportedProfileDraft,
  validateStudentResumeFile
} from '../utils/resumeImport';

const TABS = [
  { id: 'personal', label: 'Personal', icon: FiUser },
  { id: 'education', label: 'Education', icon: FiBook },
  { id: 'skills', label: 'Skills', icon: FiBriefcase },
  { id: 'resume', label: 'Resume', icon: FiFileText },
  { id: 'score', label: 'Score', icon: FiAward }
];

const EMPTY_EDUCATION = { educationLevel: 'Graduation', courseName: '', instituteName: '', universityBoard: '', specialization: '', startYear: '', endYear: '', educationStatus: 'completed', expectedCompletionYear: '', isHighestQualification: false };
const EMPTY_FORM = { name: '', email: '', mobile: '', gender: '', avatarUrl: '', headline: '', targetRole: '', profileSummary: '', location: '', currentAddress: '', technicalSkills: [], softSkills: [], toolsTechnologies: [], experience: [], projects: [], certifications: [], achievements: [], languagesKnown: [], educationEntries: [], resumeUrl: '', resumeText: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' };

const parseCommaList = (value = '') => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const parseLineList = (value = '') => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
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
    form.educationEntries.length > 0,
    form.experience.length > 0 || form.projects.length > 0,
    Boolean(form.resumeUrl || form.resumeText),
    Boolean(form.linkedinUrl || form.githubUrl || form.portfolioUrl)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const generatedResume = (form = EMPTY_FORM) => [
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
  ...(form.educationEntries.length ? form.educationEntries.map((item) => `- ${[item.courseName, item.instituteName, item.endYear || item.expectedCompletionYear].filter(Boolean).join(' | ')}`) : ['- Add education'])
].filter((line) => line !== '').join('\n');

const StudentProfilePage = () => {
  const location = useLocation();
  const { user, refreshUser } = useAuthStore();
  const avatarInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const timerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resumeImporting, setResumeImporting] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    const nextUser = { ...user, name: profile.name || user.name || '', mobile: profile.mobile || user.mobile || '', gender: profile.gender || user.gender || '', avatarUrl: avatar, avatar_url: avatar };
    refreshUser(nextUser);
    const token = getToken();
    if (token) setAuthSession(token, nextUser);
  };

  useEffect(() => () => timerRef.current && window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('section');
    if (tab && TABS.some((item) => item.id === tab)) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const response = await getStudentProfile();
      if (!mounted) return;
      const data = response.data || {};
      setForm({ ...EMPTY_FORM, ...data, name: data.name || user?.name || '', email: data.email || user?.email || '', mobile: data.mobile || user?.mobile || '', avatarUrl: data.avatarUrl || user?.avatarUrl || user?.avatar_url || '', educationEntries: Array.isArray(data.educationEntries) ? data.educationEntries : [] });
      setMessage(response.error ? { type: 'error', text: response.error } : { type: '', text: '' });
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [user?.avatarUrl, user?.avatar_url, user?.email, user?.mobile, user?.name]);

  useEffect(() => {
    if (activeTab !== 'score' || scoreData || scoreLoading) return;
    let mounted = true;
    const loadScore = async () => {
      setScoreLoading(true);
      const response = await getResumeScore();
      if (!mounted) return;
      setScoreData(response.data || null);
      setScoreLoading(false);
    };
    loadScore();
    return () => { mounted = false; };
  }, [activeTab, scoreData, scoreLoading]);

  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const addEducation = () => setForm((current) => ({ ...current, educationEntries: [...current.educationEntries, { ...EMPTY_EDUCATION }] }));
  const removeEducation = (index) => setForm((current) => ({ ...current, educationEntries: current.educationEntries.filter((_, entryIndex) => entryIndex !== index) }));
  const updateEducation = (index, field, value) => setForm((current) => ({ ...current, educationEntries: current.educationEntries.map((item, entryIndex) => (entryIndex === index ? { ...item, [field]: value } : item)) }));

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const updated = await updateStudentProfile(form);
      setForm((current) => ({ ...current, ...updated, email: updated.email || current.email }));
      syncUser(updated);
      setScoreData(null);
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
          uploadSummary = { resumeUrl: '', resumeText: '', warnings: [error.message || 'Resume file upload failed.'] };
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
      setForm((current) => ({ ...current, ...updated, email: updated.email || current.email }));
      syncUser(updated);
      setScoreData(null);
      const savedSummary = summarizeImportedProfileDraft(updated);
      const baseMessage = `${successMessage} Saved ${savedSummary} to profile.`;
      setFlash('success', warnings.length ? `${baseMessage} ${warnings.join(' ')}` : baseMessage);
    } catch (error) {
      setFlash('error', error.message || 'Unable to import resume.');
    } finally {
      setResumeImporting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>;
  }

  const completion = completionOf(form);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <section className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <button type="button" aria-label="Upload profile photo" className="relative" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-100 text-4xl font-bold text-brand-600 shadow-lg">
              {form.avatarUrl ? <img src={form.avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" /> : (form.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:opacity-100">
              {avatarUploading ? <FiRefreshCw className="animate-spin" /> : <FiCamera />}
            </div>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" data-testid="student-avatar-input" onChange={handleAvatar} />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-primary">{form.name || 'Your Name'}</h1>
            <p className="mt-2 text-lg text-neutral-500">{form.headline || form.targetRole || 'Add your professional headline'}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><FiTrendingUp /> Completion {completion}%</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"><FiFileText /> {form.resumeUrl || form.resumeText ? 'Resume ready' : 'Resume missing'}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-70">
                {avatarUploading ? <FiRefreshCw className="animate-spin" /> : <FiCamera />}
                {avatarUploading ? 'Uploading photo...' : 'Upload Photo'}
              </button>
              <span className="text-xs font-medium text-neutral-500">PNG, JPG, or WEBP up to 4 MB</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="space-y-2 lg:col-span-3">
          {TABS.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 font-bold ${activeTab === tab.id ? 'bg-brand-600 text-white shadow-md' : 'border border-neutral-100 bg-white text-neutral-600 hover:bg-neutral-50'}`}><tab.icon size={18} /> {tab.label}</button>)}
          <button type="button" onClick={handleSave} disabled={saving} data-testid="student-profile-save" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-bold text-white hover:bg-neutral-800 disabled:opacity-70">{saving ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />} {saving ? 'Saving...' : 'Save Profile'}</button>
          {message.text ? <p className={`mt-4 text-center text-sm font-bold ${message.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>{message.text}</p> : null}
        </aside>

        <section className="lg:col-span-9">
          <div className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm md:p-10">
            {activeTab === 'personal' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-extrabold text-primary">Personal Details</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-name">Full Name</label><input id="student-profile-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="John Doe" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-email">Email</label><input id="student-profile-email" value={form.email} disabled className="w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-500" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-mobile">Mobile Number</label><input id="student-profile-mobile" value={form.mobile} onChange={(event) => updateField('mobile', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="9876543210" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-location">Location</label><input id="student-profile-location" value={form.location} onChange={(event) => updateField('location', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Pune, India" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-gender">Gender</label><select id="student-profile-gender" value={form.gender} onChange={(event) => updateField('gender', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-target-role">Target Role</label><input id="student-profile-target-role" value={form.targetRole} onChange={(event) => updateField('targetRole', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Software Engineer" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-headline">Professional Headline</label><input id="student-profile-headline" value={form.headline} onChange={(event) => updateField('headline', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Frontend Developer | React | UI Systems" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-address">Current Address</label><textarea id="student-profile-address" rows="3" value={form.currentAddress} onChange={(event) => updateField('currentAddress', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Current address" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-summary">Profile Summary</label><textarea id="student-profile-summary" rows="5" value={form.profileSummary} onChange={(event) => updateField('profileSummary', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Write a short recruiter-facing summary." /></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-linkedin">LinkedIn URL</label><input id="student-profile-linkedin" value={form.linkedinUrl} onChange={(event) => updateField('linkedinUrl', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://linkedin.com/in/username" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-github">GitHub URL</label><input id="student-profile-github" value={form.githubUrl} onChange={(event) => updateField('githubUrl', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://github.com/username" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-neutral-700" htmlFor="student-profile-portfolio">Portfolio URL</label><input id="student-profile-portfolio" value={form.portfolioUrl} onChange={(event) => updateField('portfolioUrl', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://portfolio.example.com" /></div>
                </div>
              </div>
            ) : null}

            {activeTab === 'education' ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div><h2 className="text-2xl font-extrabold text-primary">Education</h2><p className="text-sm text-neutral-500">Add each qualification and save it to make the profile recruiter-ready.</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={addEducation} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-500"><FiPlus /> Add Education</button>
                    <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-70">
                      {saving ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                      {saving ? 'Saving...' : 'Save Education'}
                    </button>
                  </div>
                </div>

                {form.educationEntries.length === 0 ? <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/70 p-10 text-center text-neutral-500">No education entries added yet.</div> : null}

                <div className="space-y-5">
                  {form.educationEntries.map((entry, index) => (
                    <article key={`education-${index}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                      <div className="mb-4 flex items-center justify-between gap-4"><h3 className="text-lg font-bold text-primary">Education #{index + 1}</h3><button type="button" onClick={() => removeEducation(index)} className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100"><FiTrash2 /> Remove</button></div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700">Level</label><select value={entry.educationLevel} onChange={(event) => updateEducation(index, 'educationLevel', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="Class 10">Class 10</option><option value="Class 12">Class 12</option><option value="Graduation">Graduation</option><option value="Postgraduate">Postgraduate</option><option value="Doctorate">Doctorate</option><option value="Certification">Certification</option><option value="Other">Other</option></select></div>
                        <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700">Status</label><select value={entry.educationStatus} onChange={(event) => updateEducation(index, 'educationStatus', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="completed">Completed</option><option value="pursuing">Pursuing</option></select></div>
                        <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-neutral-700">Course or Degree</label><input value={entry.courseName} onChange={(event) => updateEducation(index, 'courseName', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="B.Tech Computer Science" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700">Institute</label><input value={entry.instituteName} onChange={(event) => updateEducation(index, 'instituteName', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Institute name" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700">University or Board</label><input value={entry.universityBoard} onChange={(event) => updateEducation(index, 'universityBoard', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="University / board" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700">Specialization</label><input value={entry.specialization} onChange={(event) => updateEducation(index, 'specialization', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="AI / Data Science" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700">Start Year</label><input value={entry.startYear} onChange={(event) => updateEducation(index, 'startYear', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="2021" /></div>
                        <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700">{entry.educationStatus === 'pursuing' ? 'Expected Completion Year' : 'End Year'}</label><input value={entry.educationStatus === 'pursuing' ? entry.expectedCompletionYear : entry.endYear} onChange={(event) => updateEducation(index, entry.educationStatus === 'pursuing' ? 'expectedCompletionYear' : 'endYear', event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="2025" /></div>
                        <label className="inline-flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 md:col-span-2"><input type="checkbox" checked={Boolean(entry.isHighestQualification)} onChange={(event) => updateEducation(index, 'isHighestQualification', event.target.checked)} /> Mark as highest qualification</label>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'skills' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-extrabold text-primary">Skills and Experience</h2>
                <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-technical-skills">Technical Skills</label><input id="student-technical-skills" value={joinCommaList(form.technicalSkills)} onChange={(event) => updateField('technicalSkills', parseCommaList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="React, Node.js, SQL, Python" /></div>
                <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-soft-skills">Soft Skills</label><input id="student-soft-skills" value={joinCommaList(form.softSkills)} onChange={(event) => updateField('softSkills', parseCommaList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Communication, Leadership, Teamwork" /></div>
                <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-tools-technologies">Tools and Technologies</label><input id="student-tools-technologies" value={joinCommaList(form.toolsTechnologies)} onChange={(event) => updateField('toolsTechnologies', parseCommaList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Git, Docker, Postman" /></div>
                <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-experience">Experience</label><textarea id="student-experience" rows="5" value={joinLineList(form.experience)} onChange={(event) => updateField('experience', parseLineList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Frontend Developer Intern - Built dashboards" /></div>
                <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-projects">Projects</label><textarea id="student-projects" rows="5" value={joinLineList(form.projects)} onChange={(event) => updateField('projects', parseLineList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Placement portal - React, Express, Supabase" /></div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-certifications">Certifications</label><textarea id="student-certifications" rows="4" value={joinLineList(form.certifications)} onChange={(event) => updateField('certifications', parseLineList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="AWS Cloud Practitioner" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-achievements">Achievements</label><textarea id="student-achievements" rows="4" value={joinLineList(form.achievements)} onChange={(event) => updateField('achievements', parseLineList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Hackathon finalist" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-bold text-neutral-700" htmlFor="student-languages-known">Languages Known</label><input id="student-languages-known" value={joinCommaList(form.languagesKnown)} onChange={(event) => updateField('languagesKnown', parseCommaList(event.target.value))} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="English, Hindi" /></div>
              </div>
            ) : null}

            {activeTab === 'resume' ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-primary">Resume Import and Builder</h2>
                    <p className="text-sm text-neutral-500">Upload resume file to extract profile fields and keep profile resume ready for job apply.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => resumeInputRef.current?.click()} disabled={resumeImporting} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-70">{resumeImporting ? <FiRefreshCw className="animate-spin" /> : <FiUploadCloud />} Upload Resume</button>
                    <button type="button" onClick={() => handleResumeImport({ resumeText: form.resumeText, successMessage: 'Resume text parsed into profile draft.' })} disabled={resumeImporting || !String(form.resumeText || '').trim()} className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-70"><FiFileText /> Import From Text</button>
                    <button type="button" onClick={() => updateField('resumeText', generatedResume(form))} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50"><FiRefreshCw /> Generate Draft</button>
                    <button type="button" onClick={() => {
                      if (!String(form.resumeText || '').trim()) return setFlash('error', 'No resume text available to download yet.');
                      const blob = new Blob([String(form.resumeText || '')], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement('a');
                      anchor.href = url;
                      anchor.download = `${String(form.name || 'student-resume').trim().replace(/\s+/g, '-').toLowerCase()}.txt`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50"><FiDownload /> Download Text</button>
                  </div>
                </div>

                <input
                  ref={resumeInputRef}
                  type="file"
                  accept={STUDENT_RESUME_ACCEPT}
                  className="hidden"
                  data-testid="student-resume-upload-input"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    const validationMessage = validateStudentResumeFile(file);
                    if (validationMessage) return setFlash('error', validationMessage);
                    const payload = await readResumeImportPayload(file);
                    await handleResumeImport({ ...payload, file, successMessage: 'Resume imported into profile draft.' });
                  }}
                />

                <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800" id="resume-builder">
                  <p className="font-bold">Resume upload flow</p>
                  <p className="mt-1">Upload PDF, DOC, DOCX, or TXT. Extracted education, skills, and experience are filled into your profile draft.</p>
                  <p className="mt-2">{form.resumeUrl ? 'Stored profile resume is available for one-click apply.' : 'No stored profile resume file yet.'}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700" htmlFor="student-resume-text">Resume Text</label>
                  <textarea id="student-resume-text" rows="18" value={form.resumeText} onChange={(event) => updateField('resumeText', event.target.value)} className="min-h-[420px] w-full rounded-2xl bg-slate-900 p-6 font-mono text-sm leading-relaxed text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" placeholder="Paste resume text here or upload a file to auto-fill profile sections." />
                </div>
              </div>
            ) : null}

            {activeTab === 'score' ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div><h2 className="text-2xl font-extrabold text-primary">Resume Score</h2><p className="text-sm text-neutral-500">Profile quality check based on your saved student profile.</p></div>
                  <button type="button" onClick={() => setScoreData(null)} className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100"><FiRefreshCw /> Refresh Score</button>
                </div>

                {scoreLoading ? <div className="flex items-center justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div> : null}

                {!scoreLoading && scoreData ? (
                  <>
                    <div className="flex flex-col items-center gap-8 md:flex-row">
                      <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-emerald-100 bg-emerald-50 text-center">
                        <span className="text-4xl font-extrabold text-primary">{scoreData.score}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">/ {scoreData.maxScore || 100}</span>
                        <span className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-700">{scoreData.grade}</span>
                      </div>
                      <div className="w-full space-y-3">
                        {(scoreData.breakdown || []).map((item) => (
                          <div key={item.label}>
                            <div className="mb-1 flex items-center justify-between text-sm"><span className="font-bold text-primary">{item.label}</span><span className="font-extrabold text-neutral-500">{item.earned}/{item.weight}</span></div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100"><div className={`h-full rounded-full ${item.filled ? 'bg-emerald-500' : 'bg-neutral-200'}`} style={{ width: item.filled ? '100%' : '0%' }} /></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(scoreData.tips || []).length ? (
                      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
                        <h3 className="flex items-center gap-2 text-base font-extrabold text-primary"><FiTrendingUp className="text-brand-600" /> Improvement Tips</h3>
                        <ul className="mt-4 space-y-2">
                          {(scoreData.tips || []).map((tip, index) => <li key={`${tip}-${index}`} className="flex items-start gap-3 text-sm text-neutral-700"><span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{index + 1}</span>{tip}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {!scoreLoading && !scoreData ? <p className="py-10 text-center text-sm text-neutral-500">Save your profile and refresh score to see the latest breakdown.</p> : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentProfilePage;
