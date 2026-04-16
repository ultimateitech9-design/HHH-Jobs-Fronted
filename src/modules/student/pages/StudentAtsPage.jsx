import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUploadCloud,
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

const getScoreTone = (score) => {
  const value = Number(score || 0);
  if (value >= 80) {
    return {
      accent: 'from-emerald-400 via-teal-400 to-sky-500',
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      surface: 'border-emerald-200 bg-emerald-50/70'
    };
  }
  if (value >= 60) {
    return {
      accent: 'from-amber-400 via-orange-400 to-pink-500',
      badge: 'border-amber-200 bg-amber-50 text-amber-700',
      surface: 'border-amber-200 bg-amber-50/70'
    };
  }
  return {
    accent: 'from-rose-400 via-orange-400 to-amber-400',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    surface: 'border-rose-200 bg-rose-50/70'
  };
};

const compactFieldClassName = `${studentFieldClassName} rounded-[0.95rem] px-3 py-2.5 text-[13px]`;
const compactTextareaClassName = `${studentTextareaClassName} min-h-[96px] rounded-[0.95rem] px-3 py-2.5 text-[13px] leading-5`;

const StudentAtsPage = () => {
  const [jobs, setJobs] = useState([]);
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
    targetText: ''
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const [jobsRes, historyRes] = await Promise.all([
        getStudentJobs({ page: 1, limit: 100 }),
        getAtsHistory()
      ]);

      if (!mounted) return;

      const jobsList = jobsRes.data.jobs || [];
      setJobs(jobsList);
      setHistory(historyRes.data || []);
      setState({
        loading: false,
        error: jobsRes.error || historyRes.error || ''
      });

      if (jobsList.length > 0) {
        setForm((current) => ({ ...current, jobId: current.jobId || jobsList[0].id || jobsList[0]._id }));
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id || job._id) === String(form.jobId)) || null,
    [jobs, form.jobId]
  );

  const selectedJobTitle = selectedJob?.jobTitle || 'ATS preview';
  const selectedJobCompany = selectedJob?.companyName || 'Custom target';

  const historyStats = useMemo(() => {
    if (history.length === 0) {
      return { checks: 0, avgScore: 0, latestScore: result?.score || 0 };
    }

    const totalScore = history.reduce((sum, item) => sum + Number(item.score || 0), 0);
    return {
      checks: history.length,
      avgScore: Math.round(totalScore / history.length),
      latestScore: result?.score || Number(history[0]?.score || 0)
    };
  }, [history, result]);

  const scoreTone = useMemo(() => getScoreTone(result?.score), [result?.score]);

  const columns = [
    {
      key: 'job',
      label: 'Role',
      render: (_, row) => {
        const targetJobId = row.job_id || row.jobId;
        const match = jobs.find((job) => String(job.id || job._id) === String(targetJobId));
        return (
          <div>
            <p className="font-semibold text-slate-800">{match?.jobTitle || 'Custom preview'}</p>
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
        return (
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tone.badge}`}>
            {value}%
          </span>
        );
      }
    },
    { key: 'keyword_score', label: 'Keyword' },
    { key: 'similarity_score', label: 'Similarity' },
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

  const runCheck = async (event) => {
    event.preventDefault();
    setNotice({ type: '', text: '' });

    if (form.source === 'new_resume_upload' && !String(form.resumeText || '').trim() && !String(form.resumeUrl || '').trim()) {
      setNotice({ type: 'error', text: 'Upload a resume file or provide resume text/URL before running ATS.' });
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
          targetText: form.targetText
        });
      const check = payload?.result;

      if (!check) {
        throw new Error('ATS response is invalid. Please try again.');
      }

      setResult(check);
      if (form.jobId && payload?.saved) {
        const historyRes = await getAtsHistory(form.jobId);
        if (!historyRes.error) {
          setHistory(historyRes.data || []);
        } else {
          setHistory((current) => [
            {
              id: payload?.atsCheckId || `temp-${Date.now()}`,
              job_id: form.jobId,
              score: check.score,
              keyword_score: check.keywordScore,
              similarity_score: check.similarityScore,
              format_score: check.formatScore,
              created_at: new Date().toISOString()
            },
            ...current
          ]);
        }
      } else {
        setHistory((current) => [
          {
            id: payload?.atsCheckId || `temp-${Date.now()}`,
            job_id: form.jobId || 'preview',
            score: check.score,
            keyword_score: check.keywordScore,
            similarity_score: check.similarityScore,
            format_score: check.formatScore,
            created_at: new Date().toISOString()
          },
          ...current
        ]);
      }
      setNotice({
        type: payload?.persistenceWarning ? 'info' : 'success',
        text: payload?.persistenceWarning || 'ATS check completed successfully.'
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
    const isAllowed = (
      fileName.endsWith('.pdf')
      || fileName.endsWith('.doc')
      || fileName.endsWith('.docx')
      || fileName.endsWith('.txt')
      || fileType.includes('pdf')
      || fileType.includes('msword')
      || fileType.includes('officedocument.wordprocessingml')
      || fileType.includes('text/plain')
    );

    if (!isAllowed) {
      setNotice({ type: 'error', text: 'Please upload a PDF, DOC, DOCX, or TXT file.' });
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Resume file size must be 5 MB or less.' });
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
        resumeText: fileType.includes('text/plain') || fileName.endsWith('.txt') ? resultValue : current.resumeText,
        resumeUrl: fileType.includes('text/plain') || fileName.endsWith('.txt') ? current.resumeUrl : resultValue
      }));
      setNotice({ type: 'success', text: 'Resume file attached. Run ATS check now.' });
    };
    reader.onerror = () => {
      setNotice({ type: 'error', text: 'Unable to read selected file.' });
    };

    if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  return (
    <StudentPageShell showHero={false} bodyClassName="mx-auto max-w-[1180px] space-y-4 pb-6">
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {notice.text ? <StudentNotice type={notice.type || 'info'} text={notice.text} /> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.84fr)]">
        <StudentSurfaceCard
          eyebrow="Scan Setup"
          title="Build your ATS test"
          subtitle="Pick a live role, switch resume mode, and run a sharper comparison."
          className="w-full border-[#ffe2b6] bg-[linear-gradient(180deg,rgba(255,251,245,0.98),rgba(255,255,255,0.96))] p-4 xl:p-4.5 [&>div:first-child]:mb-4 [&_h2]:text-[1.6rem] [&_h2]:leading-tight [&_p]:max-w-none"
        >
          {state.loading ? (
            <div className="h-40 animate-pulse rounded-[1rem] bg-slate-100" />
          ) : (
            <form className="space-y-3" onSubmit={runCheck}>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[0.8rem] border border-brand-100 bg-white/90 px-2.5 py-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Mode</p>
                  <p className="mt-0.5 text-[13px] font-bold text-navy">{form.jobId ? 'Live role' : 'Custom preview'}</p>
                </div>
                <div className="rounded-[0.8rem] border border-brand-100 bg-white/90 px-2.5 py-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Resume</p>
                  <p className="mt-0.5 text-[13px] font-bold text-navy">{form.source === 'profile_resume' ? 'Profile resume' : 'Custom upload'}</p>
                </div>
                <div className="rounded-[0.8rem] border border-brand-100 bg-white/90 px-2.5 py-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Attached</p>
                  <p className="mt-0.5 truncate text-[13px] font-bold text-navy">{selectedFileName || 'No file yet'}</p>
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-slate-700">Target role</span>
                <select
                  value={form.jobId}
                  onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value }))}
                  className={compactFieldClassName}
                >
                  <option value="">
                    {jobs.length === 0 ? 'No jobs available (Run preview)' : 'Run ATS Preview (No job selected)'}
                  </option>
                  {jobs.map((job) => {
                    const value = job.id || job._id;
                    return (
                      <option key={value} value={value}>
                        {job.jobTitle} - {job.companyName}
                      </option>
                    );
                  })}
                </select>
              </label>

              <div className="rounded-[0.9rem] border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">Selected Role</p>
                    <h3 className="mt-0.5 text-[15px] font-extrabold text-navy">{selectedJobTitle}</h3>
                    <p className="mt-0.5 text-[13px] text-slate-500">{selectedJobCompany}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    <FiTarget size={11} />
                    {form.jobId ? 'Job-linked check' : 'Manual target'}
                  </span>
                </div>
              </div>

              {!form.jobId ? (
                <label className="block">
                  <span className="mb-1 block text-[13px] font-bold text-slate-700">Target description</span>
                  <textarea
                    rows={2}
                    value={form.targetText}
                    onChange={(event) => setForm((current) => ({ ...current, targetText: event.target.value }))}
                    placeholder="Example: Frontend role requiring React, APIs, accessibility, and strong communication."
                    className={compactTextareaClassName}
                  />
                </label>
              ) : null}

              <div className="grid gap-2.5 md:grid-cols-2">
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
                    <option value="new_resume_upload">Use custom text or file</option>
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[13px] font-bold text-slate-700">Resume URL</span>
                  <input
                    value={form.resumeUrl}
                    onChange={(event) => setForm((current) => ({ ...current, resumeUrl: event.target.value }))}
                    placeholder="Optional remote file URL"
                    className={compactFieldClassName}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-slate-700">Resume file</span>
                <label className="group flex cursor-pointer items-center justify-between gap-2.5 rounded-[0.9rem] border border-dashed border-slate-300 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-3 py-2.5 transition hover:border-brand-300 hover:bg-brand-50/40">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[0.8rem] bg-[linear-gradient(135deg,#fff1d6,#ffffff)] text-brand-700 shadow-sm transition group-hover:scale-105">
                      <FiUploadCloud size={16} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-navy">Drop resume here</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">PDF, DOC, DOCX, or TXT up to 5 MB</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
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
                  onChange={(event) => setForm((current) => ({ ...current, resumeText: event.target.value }))}
                  placeholder="Paste resume content here if you want to test a custom version."
                  className={`${compactTextareaClassName} bg-white font-mono`}
                />
              </label>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  className={`${studentSecondaryButtonClassName} px-3.5 py-1.5 text-xs`}
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      source: 'profile_resume',
                      resumeText: '',
                      resumeUrl: '',
                      targetText: ''
                    }));
                    setSelectedFileName('');
                    setNotice({ type: '', text: '' });
                  }}
                >
                  <FiRefreshCw size={15} />
                  Reset
                </button>
                <button type="submit" className={`${studentPrimaryButtonClassName} px-4 py-1.5 text-xs`} disabled={isRunning}>
                  <FiActivity size={14} />
                  {isRunning ? 'Scanning...' : 'Run ATS Check'}
                </button>
              </div>
            </form>
          )}
        </StudentSurfaceCard>

        {result ? (
          <StudentSurfaceCard
            eyebrow="Live Result"
            title={`${selectedJobTitle} fit scan`}
            subtitle="Fast visual feedback so you know exactly what to improve next."
            className="w-full overflow-visible border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))] p-4 xl:p-4.5 [&>div:first-child]:mb-4 [&_h2]:text-[1.55rem] [&_h2]:leading-tight [&_p]:max-w-none"
          >
            <div className="space-y-3">
              <div className={`relative overflow-hidden rounded-[1rem] border ${scoreTone.surface} p-3`}>
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${scoreTone.accent}`} />
                <div className="absolute -right-10 -top-10 h-16 w-16 rounded-full bg-white/50 blur-2xl" />
                <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Overall Match</p>
                    <div className="mt-1 flex items-end gap-2">
                      <p className="font-heading text-[1.6rem] font-black text-navy">{result.score}%</p>
                      <span className={`mb-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${scoreTone.badge}`}>
                        {result.score >= 80 ? 'Strong fit' : result.score >= 60 ? 'Needs polish' : 'Needs work'}
                      </span>
                    </div>
                    <p className="mt-1 max-w-md text-[13px] leading-5 text-slate-600">
                      This score blends keyword coverage, role similarity, and formatting quality into one quick signal.
                    </p>
                  </div>

                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-gradient-to-br ${scoreTone.accent} text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]`}>
                    <FiTarget size={16} />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: 'Keyword', value: result.keywordScore, icon: FiZap },
                  { label: 'Similarity', value: result.similarityScore, icon: FiTrendingUp },
                  { label: 'Format', value: result.formatScore, icon: FiCheckCircle }
                ].map((item) => (
                  <div key={item.label} className="rounded-[0.9rem] border border-slate-200 bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                      <item.icon className="text-slate-400" size={14} />
                    </div>
                    <p className="mt-1.5 font-heading text-[1.2rem] font-black text-navy">{item.value}%</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full bg-gradient-to-r ${scoreTone.accent}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {result.aiSummary || (result.aiPriorityEdits || []).length > 0 || result.aiSuggestedSummary ? (
                <div className="rounded-[0.95rem] border border-sky-200 bg-[linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0.96))] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">AI ATS Coach</p>
                      <p className="mt-1 text-[13px] font-semibold text-navy">
                        {result.aiPowered ? 'Smarter resume fit guidance based on your target role.' : 'Fallback ATS guidance is active.'}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${result.aiPowered ? 'border-sky-200 bg-white text-sky-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                      {result.aiPowered ? 'AI on' : 'AI off'}
                    </span>
                  </div>

                  {result.aiSummary ? (
                    <p className="mt-2 text-xs leading-5 text-slate-600">{result.aiSummary}</p>
                  ) : null}

                  {(result.aiStrengths || []).length > 0 ? (
                    <div className="mt-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Strengths spotted</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {result.aiStrengths.map((item) => (
                          <span key={item} className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(result.aiPriorityEdits || []).length > 0 ? (
                    <div className="mt-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">Priority edits</p>
                      <ul className="mt-1.5 space-y-1 text-xs leading-5 text-slate-600">
                        {result.aiPriorityEdits.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  {result.aiSuggestedSummary ? (
                    <div className="mt-2 rounded-[0.8rem] border border-sky-100 bg-white/90 p-2.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">Suggested summary</p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-700">{result.aiSuggestedSummary}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="rounded-[0.9rem] border border-emerald-200 bg-emerald-50/70 p-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">You matched</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(result.matchedKeywords || []).length > 0 ? (
                      result.matchedKeywords.map((item) => (
                        <span key={item} className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {item}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-800">No strong keyword matches were returned yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[0.9rem] border border-rose-200 bg-rose-50/70 p-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">Missing next</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(result.missingKeywords || []).length > 0 ? (
                      result.missingKeywords.map((item) => (
                        <span key={item} className="rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                          {item}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-rose-800">No missing keywords detected.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="rounded-[0.9rem] border border-slate-200 bg-white p-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Glow-up suggestions</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                    {(result.suggestions || []).length === 0 ? <li>No suggestions returned.</li> : null}
                    {(result.suggestions || []).map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-[0.9rem] border border-slate-200 bg-white p-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Watch-outs</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                    {(result.warnings || []).length === 0 ? <li>No warnings returned.</li> : null}
                    {(result.warnings || []).map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </StudentSurfaceCard>
        ) : (
          <StudentSurfaceCard
            eyebrow="Live Result"
            title="No ATS result yet"
            subtitle="Your score, missing keywords, and next edits will appear here."
            className="w-full border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))] p-4 xl:p-4.5 [&>div:first-child]:mb-4 [&_h2]:text-[1.55rem] [&_h2]:leading-tight [&_p]:max-w-none"
          >
            <div className="rounded-[1rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(255,214,102,0.28),transparent_26%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-4">
              <StudentEmptyState
                icon={FiFileText}
                title="Ready when you are"
                description="Choose a role, drop your resume, and run one check to see how recruiter systems may read your profile."
                className="border-none bg-transparent px-0 py-5 [&_h3]:mt-4 [&_h3]:text-[1.45rem] [&_p]:mt-2 [&_p]:text-[13px] [&>div:first-child]:h-12 [&>div:first-child]:w-12"
              />
            </div>
          </StudentSurfaceCard>
        )}
      </div>

      <StudentSurfaceCard
        eyebrow="History"
        title="Past ATS checks"
        subtitle="Track whether your edits are actually pushing the score up."
        className="w-full p-4 xl:p-4.5 [&>div:first-child]:mb-4 [&_h2]:text-[1.5rem] [&_h2]:leading-tight [&_p]:max-w-none"
      >
        {history.length > 0 ? (
          <div className="mb-3 grid gap-2 md:grid-cols-3">
            {history.slice(0, 3).map((item, index) => {
              const tone = getScoreTone(item.score);
              const jobMatch = jobs.find((job) => String(job.id || job._id) === String(item.job_id || item.jobId));
              return (
                <div key={item.id || item.created_at || index} className="rounded-[0.85rem] border border-slate-200 bg-slate-50/80 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-navy">{jobMatch?.jobTitle || 'Custom preview'}</p>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone.badge}`}>
                      {item.score}%
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">{formatDateTime(item.created_at || item.createdAt)}</p>
                </div>
              );
            })}
          </div>
        ) : null}

        {history.length === 0 ? (
          <StudentEmptyState
            icon={FiActivity}
            title="No ATS history yet"
            description="Your first completed ATS scan will appear here with score, fit breakdown, and timestamp."
            className="border-none bg-slate-50/80 py-5 [&_h3]:mt-4 [&_h3]:text-[1.35rem] [&_p]:mt-2 [&_p]:text-xs [&>div:first-child]:h-12 [&>div:first-child]:w-12"
          />
        ) : (
          <DataTable columns={columns} rows={history.map((item) => ({ ...item, id: item.id || item.created_at }))} />
        )}
      </StudentSurfaceCard>
    </StudentPageShell>
  );
};

export default StudentAtsPage;
