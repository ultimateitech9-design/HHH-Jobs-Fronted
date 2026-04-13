import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiTarget,
  FiUploadCloud
} from 'react-icons/fi';
import DataTable from '../../../shared/components/DataTable';
import StudentMarketplaceShell from '../components/StudentMarketplaceShell';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentFieldClassName,
  studentGhostButtonClassName,
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

  const selectedJobTitle = useMemo(() => {
    const found = jobs.find((job) => (job.id || job._id) === form.jobId);
    return found?.jobTitle || 'Selected role';
  }, [jobs, form.jobId]);

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

  const columns = [
    {
      key: 'job',
      label: 'Job',
      render: (_, row) => {
        const targetJobId = row.job_id || row.jobId;
        const match = jobs.find((job) => (job.id || job._id) === targetJobId);
        return match?.jobTitle || targetJobId || '-';
      }
    },
    { key: 'score', label: 'Score' },
    { key: 'keyword_score', label: 'Keyword' },
    { key: 'similarity_score', label: 'Similarity' },
    { key: 'format_score', label: 'Format' },
    {
      key: 'created_at',
      label: 'Checked At',
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

  const stats = [
    {
      label: 'Total Checks',
      value: String(historyStats.checks),
      helper: 'ATS comparisons logged in history',
      icon: FiActivity
    },
    {
      label: 'Average Score',
      value: `${historyStats.avgScore}%`,
      helper: 'Typical match strength across runs',
      icon: FiTarget
    },
    {
      label: 'Latest Score',
      value: `${historyStats.latestScore}%`,
      helper: 'Most recent ATS quality signal',
      icon: FiCheckCircle
    }
  ];

  return (
    <StudentMarketplaceShell>
      <StudentPageShell bodyClassName="pt-0" showHero={false}>
        {state.error ? <StudentNotice type="error" text={state.error} /> : null}
        {notice.text ? <StudentNotice type={notice.type || 'info'} text={notice.text} /> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <StudentSurfaceCard
            eyebrow="Run Check"
            title="Launch a fresh ATS comparison"
            subtitle="Choose a live role or run a preview against any custom target description."
          >
          {state.loading ? (
            <div className="h-72 animate-pulse rounded-[1.8rem] bg-slate-100" />
          ) : (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={runCheck}>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">Target Job</span>
                <select
                  value={form.jobId}
                  onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value }))}
                  className={studentFieldClassName}
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

              {!form.jobId ? (
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Target Description</span>
                  <textarea
                    rows={4}
                    value={form.targetText}
                    onChange={(event) => setForm((current) => ({ ...current, targetText: event.target.value }))}
                    placeholder="Example: Frontend role requiring React, APIs, accessibility, and strong communication."
                    className={studentTextareaClassName}
                  />
                </label>
              ) : null}

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Resume Source</span>
                <select
                  value={form.source}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    source: event.target.value,
                    ...(event.target.value === 'profile_resume' ? { resumeText: '', resumeUrl: '' } : {})
                  }))}
                  className={studentFieldClassName}
                >
                  <option value="profile_resume">Use profile resume</option>
                  <option value="new_resume_upload">Use custom text or file</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Resume URL</span>
                <input
                  value={form.resumeUrl}
                  onChange={(event) => setForm((current) => ({ ...current, resumeUrl: event.target.value }))}
                  placeholder="Optional remote file URL"
                  className={studentFieldClassName}
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">Resume File</span>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-7 text-center transition hover:border-brand-300 hover:bg-brand-50/40">
                  <FiUploadCloud className="text-brand-600" size={26} />
                  <span className="mt-3 text-sm font-semibold text-slate-700">
                    Upload PDF, DOC, DOCX, or TXT
                  </span>
                  <span className="mt-1 text-xs text-slate-500">Maximum 5 MB</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleResumeFileUpload}
                    className="hidden"
                  />
                </label>
                {selectedFileName ? (
                  <p className="mt-2 text-sm font-semibold text-slate-500">Attached file: {selectedFileName}</p>
                ) : null}
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">Resume Text</span>
                <textarea
                  rows={7}
                  value={form.resumeText}
                  onChange={(event) => setForm((current) => ({ ...current, resumeText: event.target.value }))}
                  placeholder="Paste resume content here if you want to test a custom version."
                  className={`${studentTextareaClassName} font-mono text-[13px]`}
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  className={studentSecondaryButtonClassName}
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
                  Reset Inputs
                </button>
                <button type="submit" className={studentPrimaryButtonClassName} disabled={isRunning}>
                  <FiActivity size={15} />
                  {isRunning ? 'Running ATS Check...' : 'Run ATS Check'}
                </button>
              </div>
            </form>
          )}
          </StudentSurfaceCard>

          {result ? (
            <StudentSurfaceCard
              eyebrow="Latest Result"
              title={`${selectedJobTitle} match overview`}
              subtitle="Use these ATS signals to tighten your resume before the next application."
            >
            <div className="grid gap-5">
              <div className="rounded-[1.8rem] border border-brand-200 bg-brand-50/70 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-700">Overall Score</p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-heading text-5xl font-black text-navy">{result.score}%</p>
                    <p className="mt-2 text-sm text-slate-500">Keyword, similarity, and formatting combined</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
                    <FiTarget size={24} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Keyword', value: result.keywordScore },
                  { label: 'Similarity', value: result.similarityScore },
                  { label: 'Format', value: result.formatScore }
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-3 font-heading text-3xl font-black text-navy">{item.value}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-secondary-500" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Matched Keywords</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(result.matchedKeywords || []).length > 0 ? (
                      result.matchedKeywords.map((item) => (
                        <span key={item} className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                          {item}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-emerald-800">No matched keywords were returned.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-red-200 bg-red-50/70 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Missing Keywords</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(result.missingKeywords || []).length > 0 ? (
                      result.missingKeywords.map((item) => (
                        <span key={item} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                          {item}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-red-800">No missing keywords detected.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Suggestions</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    {(result.suggestions || []).length === 0 ? <li>No suggestions returned.</li> : null}
                    {(result.suggestions || []).map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Warnings</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    {(result.warnings || []).length === 0 ? <li>No warnings returned.</li> : null}
                    {(result.warnings || []).map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            </StudentSurfaceCard>
          ) : (
            <StudentSurfaceCard
              eyebrow="Latest Result"
              title="No ATS result yet"
              subtitle="Run a check to get keyword coverage, similarity scoring, and improvement suggestions."
            >
            <StudentEmptyState
              icon={FiFileText}
              title="Ready when you are"
              description="Choose a role on the left, then run an ATS scan to see exactly how recruiter systems may read your resume."
              className="border-none bg-slate-50/80"
            />
            </StudentSurfaceCard>
          )}
        </div>

        <StudentSurfaceCard
          eyebrow="History"
          title="Past ATS checks"
          subtitle="Compare previous runs so you can see whether profile edits are actually improving your score."
        >
          {history.length === 0 ? (
            <StudentEmptyState
              icon={FiActivity}
              title="No ATS history yet"
              description="Your first completed ATS scan will appear here with score, keyword fit, and timestamp."
              className="border-none bg-slate-50/80"
            />
          ) : (
            <DataTable columns={columns} rows={history.map((item) => ({ ...item, id: item.id || item.created_at }))} />
          )}
        </StudentSurfaceCard>
      </StudentPageShell>
    </StudentMarketplaceShell>
  );
};

export default StudentAtsPage;
