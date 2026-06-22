import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import {
  deleteHrAtsHistoryItem,
  formatDateTime,
  getHrAtsHistory,
  getHrJobs,
  runHrAtsCheck,
  runHrAtsPreview
} from '../services/hrApi';

const HrAtsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [selectedFileName, setSelectedFileName] = useState('');
  const [form, setForm] = useState({ jobId: '', resumeText: '', resumeUrl: '', targetText: '' });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const [jobsRes, historyRes] = await Promise.all([
        getHrJobs(),
        getHrAtsHistory()
      ]);

      if (!mounted) return;

      const jobsList = jobsRes.data || [];
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
    return found?.jobTitle || 'Selected job';
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
            className="btn-link"
            onClick={async () => {
              try {
                await deleteHrAtsHistoryItem(rowId);
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
      setNotice({ type: 'error', text: 'Please upload PDF, DOC, DOCX, or TXT file.' });
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Resume file size must be 5MB or less.' });
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

  const runCheck = async (event) => {
    event.preventDefault();
    setNotice({ type: '', text: '' });

    if (!String(form.resumeText || '').trim() && !String(form.resumeUrl || '').trim()) {
      setNotice({ type: 'error', text: 'Please upload resume file or provide resume text/url.' });
      return;
    }

    try {
      setIsRunning(true);
      const payload = form.jobId
        ? await runHrAtsCheck({
          jobId: form.jobId,
          resumeText: form.resumeText,
          resumeUrl: form.resumeUrl
        })
        : await runHrAtsPreview({
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
        const historyRes = await getHrAtsHistory(form.jobId);
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
        type: payload?.saved || form.jobId ? 'success' : 'error',
        text: payload?.persistenceWarning || 'ATS check completed successfully.'
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to run ATS check.' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="module-page module-page--hr">
      <SectionHeader
        eyebrow="ATS Analyzer"
        title="Resume Score Check"
        subtitle="Upload any candidate resume and check ATS score against your selected job."
      />

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {notice.text ? <p className={notice.type === 'error' ? 'form-error' : 'form-success'}>{notice.text}</p> : null}
      {state.loading ? <p className="module-note">Loading ATS data...</p> : null}

      <section className="panel-card ats-score-strip">
        <article>
          <p>Total Checks</p>
          <strong>{historyStats.checks}</strong>
        </article>
        <article>
          <p>Average Score</p>
          <strong>{historyStats.avgScore}%</strong>
        </article>
        <article>
          <p>Latest Score</p>
          <strong>{historyStats.latestScore}%</strong>
        </article>
      </section>

      <section className="panel-card ats-panel">
        <form className="form-grid ats-form" onSubmit={runCheck}>
          <label className="full-row">
            Job
            <select value={form.jobId} onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value }))}>
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
            <label className="full-row">
              Target Role / Job Description (optional)
              <textarea
                rows={3}
                value={form.targetText}
                onChange={(event) => setForm((current) => ({ ...current, targetText: event.target.value }))}
                placeholder="Example: Backend role requiring Node.js, SQL, API architecture, and debugging skills."
              />
            </label>
          ) : null}

          <label className="full-row">
            Resume File (optional)
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleResumeFileUpload}
            />
          </label>

          <label>
            Resume URL (optional)
            <input
              value={form.resumeUrl}
              onChange={(event) => setForm((current) => ({ ...current, resumeUrl: event.target.value }))}
              placeholder="https://example.com/resume.pdf"
            />
          </label>

          <label className="full-row">
            Resume Text (optional)
            <textarea
              rows={5}
              value={form.resumeText}
              onChange={(event) => setForm((current) => ({ ...current, resumeText: event.target.value }))}
              placeholder="Paste candidate resume text"
            />
          </label>

          {selectedFileName ? <p className="module-note full-row">Attached file: {selectedFileName}</p> : null}

          <div className="full-row ats-form-actions">
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setForm((current) => ({ ...current, resumeText: '', resumeUrl: '', targetText: '' }));
                setSelectedFileName('');
                setNotice({ type: '', text: '' });
              }}
            >
              Reset Resume Input
            </button>
            <button type="submit" className="btn-primary" disabled={isRunning}>
              {isRunning ? 'Running...' : 'Run ATS Check'}
            </button>
          </div>
        </form>
      </section>

      {result ? (
        <section className="panel-card ats-result-card">
          <SectionHeader
            eyebrow="Latest Result"
            title={`${selectedJobTitle} - Score ${result.score}%`}
          />

          <div className="ats-score-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(result.score || 0)}>
            <span style={{ width: `${Number(result.score || 0)}%` }} />
          </div>

          <div className="split-grid ats-result-grid">
            <div>
              <p className="module-note">Keyword Score: {result.keywordScore}</p>
              <p className="module-note">Similarity Score: {result.similarityScore}</p>
              <p className="module-note">Project Evidence: {result.projectEvidenceScore}</p>
              <p className="module-note">Domain Fit: {result.domainFitScore}</p>
              <p className="module-note">Format Score: {result.formatScore}</p>
            </div>
            <div>
              <p className="module-note">Matched: {(result.matchedKeywords || []).join(', ') || '-'}</p>
              <p className="module-note">Missing: {(result.missingKeywords || []).join(', ') || '-'}</p>
            </div>
          </div>

          <div className="split-grid ats-result-grid">
            <div>
              <h4 className="ats-result-title">Suggestions</h4>
              <ul className="ats-result-list">
                {(result.suggestions || []).length === 0 ? <li>No suggestions.</li> : null}
                {(result.suggestions || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="ats-result-title">Warnings</h4>
              <ul className="ats-result-list">
                {(result.warnings || []).length === 0 ? <li>No warnings.</li> : null}
                {(result.warnings || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel-card">
        <SectionHeader eyebrow="History" title="Past ATS Checks" />
        <DataTable columns={columns} rows={history.map((item) => ({ ...item, id: item.id || item.created_at }))} />
      </section>
    </div>
  );
};

export default HrAtsPage;
