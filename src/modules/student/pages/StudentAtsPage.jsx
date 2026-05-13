import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUploadCloud,
  FiX,
  FiZap
} from 'react-icons/fi';
import DataTable from '../../../shared/components/DataTable';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentFieldClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName,
  studentTextareaClassName
} from '../components/StudentExperience';
import {
  deleteAtsHistoryItem,
  formatDateTime,
  getAtsHistory,
  getStudentJobs,
  runAtsCheck,
  runAtsPreview
} from '../services/studentApi';

const MAX_RESUME_FILE_SIZE = 8 * 1024 * 1024;

const compactFieldClassName = `${studentFieldClassName} rounded-[0.95rem] px-3 py-2.5 text-[13px]`;
const compactTextareaClassName = `${studentTextareaClassName} min-h-[104px] rounded-[0.95rem] px-3 py-2.5 text-[13px] leading-5`;

const getJobId = (job = {}) => String(job.id || job._id || '');

const mergeJobs = (current = [], incoming = []) => {
  const map = new Map();
  [...current, ...incoming].forEach((job) => {
    const id = getJobId(job);
    if (id) map.set(id, job);
  });
  return [...map.values()];
};

const getScoreTone = (score) => {
  const value = Number(score || 0);
  if (value >= 80) {
    return {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      bar: 'bg-emerald-500',
      text: 'text-emerald-700',
      surface: 'border-emerald-200 bg-emerald-50'
    };
  }
  if (value >= 60) {
    return {
      badge: 'border-amber-200 bg-amber-50 text-amber-700',
      bar: 'bg-amber-500',
      text: 'text-amber-700',
      surface: 'border-amber-200 bg-amber-50'
    };
  }
  return {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    bar: 'bg-rose-500',
    text: 'text-rose-700',
    surface: 'border-rose-200 bg-rose-50'
  };
};

const getWordCount = (value = '') => String(value || '').trim().split(/\s+/).filter(Boolean).length;

const CASE_COVERAGE = [
  'Profile resume',
  'Custom PDF/DOC/DOCX/TXT',
  'Pasted resume text',
  'Live platform job',
  'Manual job description',
  'Missing resume guard',
  'Large/invalid file guard',
  'AI fallback handling'
];

const scoreCards = [
  { key: 'mustHaveScore', label: 'Core skill fit', icon: FiZap },
  { key: 'similarityScore', label: 'Role evidence', icon: FiTrendingUp },
  { key: 'titleScore', label: 'Title alignment', icon: FiTarget },
  { key: 'seniorityScore', label: 'Seniority fit', icon: FiActivity },
  { key: 'formatScore', label: 'Format', icon: FiCheckCircle },
  { key: 'impactScore', label: 'Impact', icon: FiBarChart2 }
];

const BUSINESS_FLAG_LABELS = {
  insufficient_core_skills: 'Core skill coverage is still below the target role requirements.',
  role_alignment_low: 'Resume title and positioning are weaker than the underlying project evidence.',
  evidence_quality_low: 'Impact evidence is light, so recruiter confidence may drop.',
  seniority_gap: 'Experience depth looks below the role expectation.',
  possible_overqualification: 'Resume may look overqualified for this role.',
  low_analysis_confidence: 'ATS confidence is limited because the target or resume evidence is thin.'
};

const humanizeBusinessFlag = (flag = '') =>
  BUSINESS_FLAG_LABELS[flag] || String(flag || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeResult = (result = {}) => ({
  ...result,
  score: Number(result.score || 0),
  keywordScore: Number(result.keywordScore || 0),
  mustHaveScore: Number(result.mustHaveScore || 0),
  similarityScore: Number(result.similarityScore || 0),
  titleScore: Number(result.titleScore || 0),
  seniorityScore: Number(result.seniorityScore || 0),
  benchmarkScore: Number(result.benchmarkScore || 0),
  formatScore: Number(result.formatScore || 0),
  impactScore: Number(result.impactScore || 0),
  confidenceScore: Number(result.confidenceScore || 0),
  resumeWordCount: Number(result.resumeWordCount || 0),
  resumeYearsExperience: Number.isFinite(Number(result.resumeYearsExperience)) ? Number(result.resumeYearsExperience) : null,
  aiCalibrationDelta: Number(result.aiCalibrationDelta || 0),
  matchedKeywords: Array.isArray(result.matchedKeywords) ? result.matchedKeywords : [],
  missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
  mustHaveKeywords: Array.isArray(result.mustHaveKeywords) ? result.mustHaveKeywords : [],
  warnings: Array.isArray(result.warnings) ? result.warnings : [],
  suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  sectionCoverage: Array.isArray(result.sectionCoverage) ? result.sectionCoverage : [],
  riskFlags: Array.isArray(result.riskFlags) ? result.riskFlags : [],
  businessLogicFlags: Array.isArray(result.businessLogicFlags) ? result.businessLogicFlags : [],
  priorityActions: Array.isArray(result.priorityActions) ? result.priorityActions : [],
  aiStrengths: Array.isArray(result.aiStrengths) ? result.aiStrengths : [],
  aiPriorityEdits: Array.isArray(result.aiPriorityEdits) ? result.aiPriorityEdits : [],
  benchmarkKeywords: Array.isArray(result.benchmarkKeywords) ? result.benchmarkKeywords : [],
  seniorityInsights: String(result.seniorityInsights || '').trim(),
  aiCalibrationReason: String(result.aiCalibrationReason || '').trim(),
  aiSeniorityAssessment: String(result.aiSeniorityAssessment || '').trim(),
  aiBusinessVerdict: String(result.aiBusinessVerdict || '').trim()
});

const ChipList = ({ items = [], tone = 'slate', emptyText }) => {
  const palette = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600'
  };

  if (!items.length) {
    return <p className="text-xs font-medium text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${palette[tone] || palette.slate}`}>
          {item}
        </span>
      ))}
    </div>
  );
};

const ScoreBar = ({ value = 0, tone }) => {
  const width = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${width}%` }} />
    </div>
  );
};

const StudentAtsPage = () => {
  const searchBoxRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [jobResults, setJobResults] = useState([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobSearchOpen, setJobSearchOpen] = useState(false);
  const [jobSearchLoading, setJobSearchLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [selectedFileName, setSelectedFileName] = useState('');
  const [form, setForm] = useState({
    jobId: '',
    source: 'profile_resume',
    resumeText: '',
    resumeUrl: '',
    targetText: '',
    targetTitle: ''
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const [jobsRes, historyRes] = await Promise.all([
        getStudentJobs({ page: 1, limit: 12 }),
        getAtsHistory()
      ]);

      if (!mounted) return;

      const jobsList = jobsRes.data.jobs || [];
      setJobs(jobsList);
      setJobResults(jobsList);
      setHistory(historyRes.data || []);
      setState({
        loading: false,
        error: jobsRes.error || historyRes.error || ''
      });

      if (jobsList.length > 0) {
        const firstJobId = getJobId(jobsList[0]);
        setForm((current) => ({ ...current, jobId: current.jobId || firstJobId }));
        setJobSearch(`${jobsList[0].jobTitle || 'Untitled role'} at ${jobsList[0].companyName || 'Company'}`);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.loading) return undefined;

    let mounted = true;
    const timer = window.setTimeout(async () => {
      const query = jobSearch.trim();
      setJobSearchLoading(true);
      const response = await getStudentJobs({ page: 1, limit: 12, search: query });
      if (!mounted) return;

      const nextJobs = response.data.jobs || [];
      setJobResults(nextJobs);
      setJobs((current) => mergeJobs(current, nextJobs));
      setJobSearchLoading(false);
      if (response.error) {
        setNotice({ type: 'error', text: response.error });
      }
    }, 280);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [jobSearch, state.loading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchBoxRef.current?.contains(event.target)) {
        setJobSearchOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => getJobId(job) === String(form.jobId)) || null,
    [jobs, form.jobId]
  );

  const selectedJobTitle = selectedJob?.jobTitle || form.targetTitle || 'Custom ATS preview';
  const selectedJobCompany = selectedJob?.companyName || 'Manual target';
  const hasCustomResume = form.source === 'new_resume_upload';
  const isManualTarget = !form.jobId;
  const resumeTextWordCount = getWordCount(form.resumeText);

  const historyStats = useMemo(() => {
    const scores = history.map((item) => Number(item.score || 0)).filter((score) => Number.isFinite(score));
    const latestScore = result?.score || Number(history[0]?.score || 0);
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const avgScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    return {
      checks: history.length,
      latestScore,
      bestScore,
      avgScore
    };
  }, [history, result]);

  const stats = [
    { label: 'Latest score', value: `${historyStats.latestScore || 0}%`, helper: 'Most recent ATS result', icon: FiTarget, tone: 'accent' },
    { label: 'Average', value: `${historyStats.avgScore || 0}%`, helper: `${historyStats.checks} saved checks`, icon: FiActivity, tone: 'info' },
    { label: 'Best', value: `${historyStats.bestScore || 0}%`, helper: 'Highest result in history', icon: FiTrendingUp, tone: 'success' }
  ];

  const scoreTone = useMemo(() => getScoreTone(result?.score), [result?.score]);

  const preflight = useMemo(() => {
    const errors = [];
    const warnings = [];

    if (isManualTarget) {
      if (!form.targetText.trim()) {
        errors.push('Select a platform job or paste a target job description.');
      } else if (getWordCount(form.targetText) < 12) {
        warnings.push('Manual target is short. A full job description gives stronger AI analysis.');
      }
    }

    if (hasCustomResume) {
      if (!form.resumeText.trim() && !form.resumeUrl.trim()) {
        errors.push('Attach a resume file, paste resume text, or add a resume URL.');
      } else if (form.resumeText.trim() && resumeTextWordCount < 45) {
        warnings.push('Resume text is very short. The score may be less reliable.');
      }
    } else {
      warnings.push('Using profile resume. If your profile resume is missing, the backend will ask you to upload one.');
    }

    return { errors, warnings };
  }, [form.resumeText, form.resumeUrl, form.targetText, hasCustomResume, isManualTarget, resumeTextWordCount]);

  const selectJob = (job) => {
    const jobId = getJobId(job);
    if (!jobId) return;

    setJobs((current) => mergeJobs(current, [job]));
    setForm((current) => ({
      ...current,
      jobId,
      targetText: '',
      targetTitle: ''
    }));
    setJobSearch(`${job.jobTitle || 'Untitled role'} at ${job.companyName || 'Company'}`);
    setJobSearchOpen(false);
  };

  const useManualTarget = () => {
    setForm((current) => ({ ...current, jobId: '' }));
    setJobSearch('');
    setJobSearchOpen(false);
  };

  const runCheck = async (event) => {
    event.preventDefault();
    setNotice({ type: '', text: '' });

    if (preflight.errors.length > 0) {
      setNotice({ type: 'error', text: preflight.errors[0] });
      return;
    }

    try {
      setIsRunning(true);
      const payload = form.jobId
        ? await runAtsCheck({
          jobId: form.jobId,
          source: form.source,
          resumeText: form.resumeText,
          resumeUrl: form.resumeUrl
        })
        : await runAtsPreview({
          source: form.source,
          resumeText: form.resumeText,
          resumeUrl: form.resumeUrl,
          targetText: form.targetText,
          jobTitle: form.targetTitle
        });
      const check = normalizeResult(payload?.result);

      if (!payload?.result) {
        throw new Error('ATS response is invalid. Please try again.');
      }

      setResult(check);

      const historyItem = {
        id: payload?.atsCheckId || `temp-${Date.now()}`,
        job_id: form.jobId || 'preview',
        score: check.score,
        keyword_score: check.keywordScore,
        similarity_score: check.similarityScore,
        format_score: check.formatScore,
        created_at: new Date().toISOString()
      };

      if (form.jobId && payload?.saved) {
        const historyRes = await getAtsHistory();
        setHistory(historyRes.error ? (current) => [historyItem, ...current] : historyRes.data || []);
      } else {
        setHistory((current) => [historyItem, ...current]);
      }

      setNotice({
        type: payload?.persistenceWarning ? 'info' : 'success',
        text: payload?.persistenceWarning || 'ATS check completed with job-specific AI analysis.'
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to run ATS check.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleResumeFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = String(file.name || '').toLowerCase();
    const fileType = String(file.type || '').toLowerCase();
    const isTextFile = fileType.includes('text/plain') || fileName.endsWith('.txt');
    const isAllowed = (
      fileName.endsWith('.pdf')
      || fileName.endsWith('.doc')
      || fileName.endsWith('.docx')
      || isTextFile
      || fileType.includes('pdf')
      || fileType.includes('msword')
      || fileType.includes('officedocument.wordprocessingml')
    );

    if (!isAllowed) {
      setNotice({ type: 'error', text: 'Upload PDF, DOC, DOCX, or TXT only.' });
      event.target.value = '';
      return;
    }

    if (file.size <= 0) {
      setNotice({ type: 'error', text: 'Selected resume file is empty.' });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_RESUME_FILE_SIZE) {
      setNotice({ type: 'error', text: 'Resume file must be 8 MB or less.' });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultValue = reader.result;
      if (typeof resultValue !== 'string') {
        setNotice({ type: 'error', text: 'Unable to read selected file.' });
        return;
      }

      setSelectedFileName(file.name);
      setForm((current) => ({
        ...current,
        source: 'new_resume_upload',
        resumeText: isTextFile ? resultValue : '',
        resumeUrl: isTextFile ? current.resumeUrl : resultValue
      }));
      setNotice({ type: 'success', text: 'Resume attached. Run ATS check when ready.' });
    };
    reader.onerror = () => {
      setNotice({ type: 'error', text: 'Unable to read selected file.' });
    };

    if (isTextFile) reader.readAsText(file);
    else reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm((current) => ({
      ...current,
      source: 'profile_resume',
      resumeText: '',
      resumeUrl: '',
      targetText: '',
      targetTitle: ''
    }));
    setSelectedFileName('');
    setNotice({ type: '', text: '' });
  };

  const columns = [
    {
      key: 'job',
      label: 'Role',
      render: (_, row) => {
        const targetJobId = row.job_id || row.jobId;
        const match = jobs.find((job) => getJobId(job) === String(targetJobId));
        return (
          <div>
            <p className="font-semibold text-slate-800">{match?.jobTitle || (targetJobId === 'preview' ? 'Manual preview' : 'Custom preview')}</p>
            <p className="mt-1 text-xs text-slate-500">{match?.companyName || targetJobId || 'Manual target'}</p>
          </div>
        );
      }
    },
    {
      key: 'score',
      label: 'Score',
      render: (value) => {
        const tone = getScoreTone(value);
        return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tone.badge}`}>{value}%</span>;
      }
    },
    { key: 'keyword_score', label: 'Keyword' },
    { key: 'similarity_score', label: 'Fit' },
    { key: 'format_score', label: 'Format' },
    {
      key: 'created_at',
      label: 'Checked',
      render: (value, row) => formatDateTime(value || row.createdAt)
    },
    {
      key: 'id',
      label: 'Action',
      render: (_, row) => {
        const rowId = row.id || row.created_at;
        const canDelete = typeof rowId === 'string' && !rowId.startsWith('temp-');
        if (!canDelete) return '-';

        return (
          <button
            type="button"
            className="text-sm font-semibold text-red-600 transition hover:text-red-700"
            onClick={async () => {
              try {
                await deleteAtsHistoryItem(rowId);
                setHistory((current) => current.filter((item) => String(item.id || item.created_at) !== String(rowId)));
                setNotice({ type: 'success', text: 'History item deleted.' });
              } catch (error) {
                setNotice({ type: 'error', text: error.message || 'Unable to delete history item.' });
              }
            }}
          >
            Delete
          </button>
        );
      }
    }
  ];

  const displayJobResults = jobResults.length > 0 ? jobResults : jobs.slice(0, 12);

  return (
    <StudentPageShell
      eyebrow="ATS Lab"
      badge="AI assisted"
      title="Resume ATS analyzer"
      subtitle="Search real platform jobs, compare your resume against the selected job profile, and get normal plus edge-case feedback before you apply."
      stats={stats}
      heroSize="compact"
      bodyClassName="mx-auto max-w-[1240px] pb-6"
    >
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {notice.text ? <StudentNotice type={notice.type || 'info'} text={notice.text} /> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.9fr)]">
        <StudentSurfaceCard
          eyebrow="Scan setup"
          title="Choose job and resume"
          subtitle="Use the searchable dropdown for jobs already available on the platform."
          className="w-full p-4 xl:p-5 [&>div:first-child]:mb-4 [&_h2]:text-[1.55rem] [&_p]:max-w-none"
        >
          {state.loading ? (
            <div className="h-72 animate-pulse rounded-[1rem] bg-slate-100" />
          ) : (
            <form className="space-y-4" onSubmit={runCheck}>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: 'Target', value: form.jobId ? 'Platform job' : 'Manual JD' },
                  { label: 'Resume', value: hasCustomResume ? 'Custom resume' : 'Profile resume' },
                  { label: 'AI', value: 'OpenAI ready' }
                ].map((item) => (
                  <div key={item.label} className="rounded-[0.9rem] border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase text-slate-400">{item.label}</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-navy">{item.value}</p>
                  </div>
                ))}
              </div>

              <div ref={searchBoxRef} className="relative">
                <label className="mb-1.5 block text-[13px] font-bold text-slate-700" htmlFor="ats-job-search">Search platform job</label>
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    id="ats-job-search"
                    value={jobSearch}
                    onFocus={() => setJobSearchOpen(true)}
                    onChange={(event) => {
                      setJobSearch(event.target.value);
                      setJobSearchOpen(true);
                    }}
                    placeholder="Search by title, company, skill, or description"
                    className={`${compactFieldClassName} pl-9 pr-20`}
                  />
                  <button
                    type="button"
                    onClick={() => setJobSearchOpen((current) => !current)}
                    className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600"
                  >
                    {jobSearchLoading ? <FiRefreshCw className="animate-spin" size={13} /> : <FiChevronDown size={13} />}
                    Jobs
                  </button>
                </div>

                {jobSearchOpen ? (
                  <div className="absolute z-30 mt-2 max-h-[320px] w-full overflow-y-auto rounded-[1.05rem] border border-slate-200 bg-white p-2 shadow-[0_22px_55px_rgba(15,23,42,0.16)]">
                    <button
                      type="button"
                      onClick={useManualTarget}
                      className={`mb-1 flex w-full items-center justify-between rounded-[0.85rem] px-3 py-2 text-left transition hover:bg-brand-50 ${isManualTarget ? 'bg-brand-50 text-brand-700' : 'text-slate-700'}`}
                    >
                      <span>
                        <span className="block text-sm font-bold">Use manual job description</span>
                        <span className="text-xs text-slate-500">Paste any JD when the exact role is not listed</span>
                      </span>
                      {isManualTarget ? <FiCheck size={16} /> : null}
                    </button>

                    {displayJobResults.length === 0 ? (
                      <div className="rounded-[0.85rem] bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                        No matching jobs found. Try another keyword or use manual JD.
                      </div>
                    ) : null}

                    {displayJobResults.map((job) => {
                      const id = getJobId(job);
                      const isSelected = id === String(form.jobId);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => selectJob(job)}
                          className={`flex w-full items-start justify-between gap-3 rounded-[0.85rem] px-3 py-2 text-left transition hover:bg-slate-50 ${isSelected ? 'bg-slate-50' : ''}`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-navy">{job.jobTitle || 'Untitled role'}</span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {job.companyName || 'Company'} · {job.jobLocation || 'Location not specified'}
                            </span>
                            {Array.isArray(job.skills) && job.skills.length > 0 ? (
                              <span className="mt-1 block truncate text-[11px] font-semibold text-slate-400">{job.skills.slice(0, 5).join(', ')}</span>
                            ) : null}
                          </span>
                          {isSelected ? <FiCheck className="mt-1 shrink-0 text-emerald-600" size={16} /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Selected target</p>
                    <h3 className="mt-1 text-lg font-black text-navy">{selectedJobTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500">{selectedJobCompany}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${form.jobId ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    <FiTarget size={13} />
                    {form.jobId ? 'History saved' : 'Preview only'}
                  </span>
                </div>
              </div>

              {isManualTarget ? (
                <div className="grid gap-3">
                  <label>
                    <span className="mb-1 block text-[13px] font-bold text-slate-700">Manual role title</span>
                    <input
                      value={form.targetTitle}
                      onChange={(event) => setForm((current) => ({ ...current, targetTitle: event.target.value }))}
                      placeholder="Example: MERN Full Stack Developer"
                      className={compactFieldClassName}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[13px] font-bold text-slate-700">Manual job description</span>
                    <textarea
                      rows={4}
                      value={form.targetText}
                      onChange={(event) => setForm((current) => ({ ...current, targetText: event.target.value }))}
                      placeholder="Paste job responsibilities, required skills, experience, and tools."
                      className={compactTextareaClassName}
                    />
                  </label>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <span className="mb-1 block text-[13px] font-bold text-slate-700">Resume source</span>
                  <select
                    value={form.source}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      source: event.target.value,
                      ...(event.target.value === 'profile_resume' ? { resumeText: '', resumeUrl: '' } : {})
                    }))}
                    className={compactFieldClassName}
                  >
                    <option value="profile_resume">Use profile resume</option>
                    <option value="new_resume_upload">Use custom file/text/URL</option>
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[13px] font-bold text-slate-700">Resume URL</span>
                  <input
                    value={form.resumeUrl.startsWith('data:') ? selectedFileName : form.resumeUrl}
                    onChange={(event) => setForm((current) => ({ ...current, source: 'new_resume_upload', resumeUrl: event.target.value }))}
                    disabled={form.resumeUrl.startsWith('data:')}
                    placeholder="Optional https resume URL"
                    className={compactFieldClassName}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-slate-700">Resume file</span>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-50">
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-white text-brand-700 shadow-sm">
                      <FiUploadCloud size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-navy">Attach resume</span>
                      <span className="text-xs text-slate-500">PDF, DOC, DOCX, TXT up to 8 MB</span>
                    </span>
                  </span>
                  <span className="max-w-[160px] truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    {selectedFileName || 'Choose file'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleResumeFileUpload}
                    className="hidden"
                  />
                </label>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-slate-700">Resume text</span>
                <textarea
                  rows={4}
                  value={form.resumeText}
                  onChange={(event) => setForm((current) => ({ ...current, source: 'new_resume_upload', resumeText: event.target.value }))}
                  placeholder="Paste resume content to test a custom version."
                  className={`${compactTextareaClassName} bg-white font-mono`}
                />
                <span className="mt-1 block text-right text-xs font-semibold text-slate-400">{resumeTextWordCount} words</span>
              </label>

              <div className="grid gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                {CASE_COVERAGE.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <FiCheckCircle className="text-emerald-500" size={14} />
                    {item}
                  </span>
                ))}
              </div>

              {preflight.warnings.length > 0 ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  {preflight.warnings[0]}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" className={`${studentSecondaryButtonClassName} px-4 py-2 text-xs`} onClick={resetForm}>
                  <FiRefreshCw size={15} />
                  Reset
                </button>
                <button type="submit" className={`${studentPrimaryButtonClassName} px-5 py-2 text-xs`} disabled={isRunning || preflight.errors.length > 0}>
                  <FiActivity size={14} />
                  {isRunning ? 'Analyzing...' : 'Analyze ATS Fit'}
                </button>
              </div>
            </form>
          )}
        </StudentSurfaceCard>

        {result ? (
          <StudentSurfaceCard
            eyebrow="Result"
            title={result.fitLevel || `${selectedJobTitle} fit scan`}
            subtitle="AI and heuristic checks combined into practical resume actions."
            className="w-full p-4 xl:p-5 [&>div:first-child]:mb-4 [&_h2]:text-[1.55rem] [&_p]:max-w-none"
          >
            <div className="space-y-4">
              <div className={`rounded-[1.1rem] border p-4 ${scoreTone.surface}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Overall match</p>
                    <div className="mt-1 flex items-end gap-2">
                      <p className="font-heading text-4xl font-black text-navy">{result.score}%</p>
                      <span className={`mb-1 rounded-full border px-3 py-1 text-xs font-bold ${scoreTone.badge}`}>
                        {result.aiPowered ? 'AI on' : 'AI fallback'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      Confidence {result.confidenceScore || 0}% · {result.resumeWordCount || 0} resume words analyzed
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                        Target {result.targetRole || selectedJobTitle}
                      </span>
                      {result.resumeYearsExperience !== null ? (
                        <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                          Resume experience {result.resumeYearsExperience} year{result.resumeYearsExperience === 1 ? '' : 's'}
                        </span>
                      ) : null}
                      {result.aiPowered && result.aiCalibrationDelta !== 0 ? (
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${result.aiCalibrationDelta > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                          AI calibration {result.aiCalibrationDelta > 0 ? '+' : ''}{result.aiCalibrationDelta}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1rem] bg-white text-navy shadow-sm">
                    <FiShield size={24} />
                  </div>
                </div>
                <div className="mt-3">
                  <ScoreBar value={result.score} tone={scoreTone} />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {scoreCards.map((item) => {
                  const Icon = item.icon;
                  const value = Number(result[item.key] || 0);
                  const tone = getScoreTone(value);
                  return (
                    <div key={item.key} className="rounded-[1rem] border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase text-slate-400">{item.label}</p>
                        <Icon className="text-slate-400" size={15} />
                      </div>
                      <p className="mt-2 font-heading text-2xl font-black text-navy">{Math.round(value)}%</p>
                      <div className="mt-2"><ScoreBar value={value} tone={tone} /></div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 xl:grid-cols-[1.15fr,0.85fr]">
                <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-navy">ATS decision logic</p>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      Business aware
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[0.95rem] border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Must-have role stack</p>
                      <div className="mt-2">
                        <ChipList items={result.mustHaveKeywords} tone="amber" emptyText="No must-have skill bundle returned." />
                      </div>
                    </div>
                    <div className="rounded-[0.95rem] border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Role benchmark</p>
                      <div className="mt-2">
                        <ChipList items={result.benchmarkKeywords} tone="sky" emptyText="No role benchmark keywords were needed." />
                      </div>
                    </div>
                  </div>
                  {result.businessLogicFlags.length > 0 ? (
                    <div className="mt-3 rounded-[0.95rem] border border-amber-200 bg-amber-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700">Business logic checks</p>
                      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900">
                        {result.businessLogicFlags.map((item) => <li key={item}>• {humanizeBusinessFlag(item)}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                  <p className="text-sm font-black text-navy">Recruiter reading</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-[0.95rem] border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Seniority view</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {result.aiSeniorityAssessment || result.seniorityInsights || 'Seniority signal is stable for this comparison.'}
                      </p>
                    </div>
                    <div className="rounded-[0.95rem] border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Business verdict</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {result.aiBusinessVerdict || result.aiCalibrationReason || 'No extra business verdict returned.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1rem] border border-sky-200 bg-sky-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-navy">AI ATS coach</p>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${result.aiPowered ? 'border-sky-200 bg-white text-sky-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                    {result.aiPowered ? 'OpenAI enhanced' : 'Heuristic fallback'}
                  </span>
                </div>
                {result.aiSummary ? <p className="mt-2 text-sm leading-6 text-slate-700">{result.aiSummary}</p> : null}
                {result.aiSuggestedSummary ? (
                  <div className="mt-3 rounded-[0.85rem] border border-sky-100 bg-white p-3">
                    <p className="text-xs font-bold uppercase text-sky-700">Suggested summary</p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-700">{result.aiSuggestedSummary}</p>
                  </div>
                ) : null}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-emerald-700">Strengths</p>
                    <ChipList items={result.aiStrengths} tone="emerald" emptyText="No AI strengths returned." />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-sky-700">Priority edits</p>
                    <ChipList items={result.aiPriorityEdits.length ? result.aiPriorityEdits : result.priorityActions} tone="sky" emptyText="No priority edits returned." />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-emerald-700">Matched role signals</p>
                  <ChipList items={result.matchedKeywords} tone="emerald" emptyText="No strong keyword matches returned." />
                </div>
                <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-rose-700">Add or strengthen</p>
                  <ChipList items={result.missingKeywords} tone="rose" emptyText="No missing keywords detected." />
                </div>
              </div>

              {result.sectionCoverage.length > 0 ? (
                <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-400">Section coverage</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {result.sectionCoverage.map((item) => (
                      <span key={item.key} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                        {item.present ? <FiCheckCircle className="text-emerald-500" size={14} /> : <FiX className="text-rose-500" size={14} />}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-400">Suggestions</p>
                  <ul className="space-y-1.5 text-sm leading-6 text-slate-600">
                    {(result.suggestions || []).length === 0 ? <li>No suggestions returned.</li> : null}
                    {(result.suggestions || []).map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-400">Edge-case warnings</p>
                  <ul className="space-y-1.5 text-sm leading-6 text-slate-600">
                    {([...result.riskFlags, ...result.warnings].filter(Boolean)).length === 0 ? <li>No warnings returned.</li> : null}
                    {[...new Set([...result.riskFlags, ...result.warnings])].map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </StudentSurfaceCard>
        ) : (
          <StudentSurfaceCard
            eyebrow="Result"
            title="Ready for analysis"
            subtitle="Your ATS score, AI coach, missing keywords, and edge-case warnings will appear here."
            className="w-full p-4 xl:p-5 [&>div:first-child]:mb-4 [&_h2]:text-[1.55rem] [&_p]:max-w-none"
          >
            <StudentEmptyState
              icon={FiFileText}
              title="Select a job and run ATS"
              description="The analyzer will compare resume text against the chosen job profile, not a generic role only."
              className="border-none bg-slate-50 py-8"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { icon: FiSearch, text: 'Search live platform jobs' },
                { icon: FiUploadCloud, text: 'Upload or paste resume' },
                { icon: FiAlertTriangle, text: 'Catch edge cases early' },
                { icon: FiClock, text: 'Save history for job checks' }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-center gap-2 rounded-[0.9rem] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                    <Icon className="text-brand-600" size={15} />
                    {item.text}
                  </div>
                );
              })}
            </div>
          </StudentSurfaceCard>
        )}
      </div>

      <StudentSurfaceCard
        eyebrow="History"
        title="Past ATS checks"
        subtitle="Track whether your resume edits are moving the score in the right direction."
        className="w-full p-4 xl:p-5 [&>div:first-child]:mb-4 [&_h2]:text-[1.45rem] [&_p]:max-w-none"
      >
        {history.length === 0 ? (
          <StudentEmptyState
            icon={FiActivity}
            title="No ATS history yet"
            description="Completed job-linked checks will be saved here. Manual previews stay temporary."
            className="border-none bg-slate-50 py-6"
          />
        ) : (
          <DataTable columns={columns} rows={history.map((item) => ({ ...item, id: item.id || item.created_at }))} />
        )}
      </StudentSurfaceCard>
    </StudentPageShell>
  );
};

export default StudentAtsPage;
