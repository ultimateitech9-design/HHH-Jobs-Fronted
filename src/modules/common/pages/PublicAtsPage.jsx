import { useState } from 'react';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiUploadCloud } from 'react-icons/fi';
import { apiFetch } from '../../../utils/api';
import './PublicAtsPage.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ScoreCard = ({ label, value }) => (
  <article className="public-ats-metric-card">
    <p>{label}</p>
    <strong>{Number(value || 0)}%</strong>
    <div className="public-ats-meter">
      <span style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }} />
    </div>
  </article>
);

const PublicAtsPage = () => {
  const [form, setForm] = useState({
    jobTitle: '',
    targetText: '',
    resumeText: '',
    resumeUrl: '',
    fileName: ''
  });
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isRunning, setIsRunning] = useState(false);

  const runCheck = async (payload = form) => {
    if (!String(payload.resumeText || '').trim() && !String(payload.resumeUrl || '').trim()) {
      setMessage({ type: 'error', text: 'Upload your resume before running the ATS review.' });
      return;
    }

    if (!String(payload.jobTitle || '').trim() && !String(payload.targetText || '').trim()) {
      setMessage({ type: 'error', text: 'Add a target job title or job description before running the ATS review.' });
      return;
    }

    setIsRunning(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await apiFetch('/ats/public-preview', {
        method: 'POST',
        body: JSON.stringify({
          source: 'new_resume_upload',
          jobTitle: payload.jobTitle,
          targetText: payload.targetText,
          resumeText: payload.resumeText,
          resumeUrl: payload.resumeUrl
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.result) {
        throw new Error(data?.message || 'ATS review could not be completed right now.');
      }

      setResult(data.result);
      setMessage({
        type: 'success',
        text: `ATS review completed${payload.jobTitle ? ` for ${payload.jobTitle}` : ''}.`
      });
    } catch (error) {
      setResult(null);
      setMessage({ type: 'error', text: error.message || 'ATS review could not be completed right now.' });
    } finally {
      setIsRunning(false);
    }
  };

  const onFileChange = (event) => {
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
      setMessage({ type: 'error', text: 'Only PDF, DOC, DOCX, and TXT files are supported.' });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: 'Please keep the file size below 5MB.' });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;
      if (typeof content !== 'string') {
        setMessage({ type: 'error', text: 'The file could not be read. Please try another copy.' });
        return;
      }

      const isTxt = fileType.includes('text/plain') || fileName.endsWith('.txt');
      setForm((current) => ({
        ...current,
        resumeText: isTxt ? content : '',
        resumeUrl: isTxt ? '' : content,
        fileName: file.name
      }));
      setResult(null);
      setMessage({ type: 'success', text: 'Resume attached. Add the target role details and run the ATS review.' });
    };

    reader.onerror = () => {
      setMessage({ type: 'error', text: 'The file could not be read. Please try another copy.' });
    };

    if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="public-ats-wrap">
      <section className="public-ats-hero">
        <div>
          <p className="public-ats-tag">Free ATS Check</p>
          <h1>Upload Your Resume and Review Your ATS Readiness</h1>
          <p className="public-ats-sub">
            Score your resume against a target job title and get clear suggestions on what to improve before you apply.
          </p>
          <div className="public-ats-badges">
            <span>Role-based scoring</span>
            <span>No sign-up required</span>
            <span>Actionable improvements</span>
          </div>

          <div className="public-ats-criteria">
            <label className="public-ats-field">
              <span>Target Job Title</span>
              <input
                type="text"
                value={form.jobTitle}
                onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))}
                placeholder="Example: Frontend React Developer"
              />
            </label>

            <label className="public-ats-field public-ats-field--full">
              <span>Job Description or Key Requirements</span>
              <textarea
                rows={4}
                value={form.targetText}
                onChange={(event) => setForm((current) => ({ ...current, targetText: event.target.value }))}
                placeholder="Optional but recommended: add the main skills, tools, and responsibilities from the job description."
              />
            </label>
          </div>
        </div>

        <div className="public-ats-upload">
          <label htmlFor="public-ats-file" className="public-ats-drop">
            <FiUploadCloud />
            <span>{form.fileName || 'Upload Resume (PDF, DOC, DOCX, TXT)'}</span>
          </label>
          <p className="public-ats-upload-note">Supported: PDF, DOC, DOCX, TXT · Max size: 5MB</p>
          <input
            id="public-ats-file"
            type="file"
            onChange={onFileChange}
            accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />
          <button type="button" disabled={isRunning} onClick={() => runCheck()} className="public-ats-btn">
            <FiActivity />
            {isRunning ? 'Reviewing...' : 'Run ATS Review'}
          </button>
        </div>
      </section>

      {message.text ? <p className={`public-ats-message public-ats-message--${message.type || 'info'}`}>{message.text}</p> : null}

      {!result ? (
        <section className="public-ats-empty">
          <FiUploadCloud />
          <p>Your ATS summary will appear here after you upload the resume and enter the target role details.</p>
        </section>
      ) : null}

      {result ? (
        <section className="public-ats-result">
          <article className="public-ats-score">
            <strong>{Number(result.score || 0)}%</strong>
            <span>{result.targetRole ? `${result.targetRole} ATS Score` : 'Overall ATS Score'}</span>
          </article>
          <ScoreCard label="Keyword" value={result.keywordScore} />
          <ScoreCard label="Similarity" value={result.similarityScore} />
          <ScoreCard label="Project" value={result.projectEvidenceScore} />
          <ScoreCard label="Domain" value={result.domainFitScore} />
          <ScoreCard label="Format" value={result.formatScore} />
        </section>
      ) : null}

      {result ? (
        <section className="public-ats-lists">
          <article>
            <h3><FiCheckCircle /> Recommendations</h3>
            <ul>
              {(result.suggestions || []).length
                ? result.suggestions.map((item) => <li key={item}>{item}</li>)
                : <li>Your resume is already covering the major ATS basics for this role.</li>}
            </ul>
          </article>
          <article>
            <h3>Missing Keywords</h3>
            <div className="public-ats-chips">
              {(result.missingKeywords || []).length
                ? result.missingKeywords.map((item) => <span key={item}>{item}</span>)
                : <span>No major keyword gaps detected</span>}
            </div>
            <h3 className="public-ats-secondary-heading">Matched Keywords</h3>
            <div className="public-ats-chips public-ats-chips--matched">
              {(result.matchedKeywords || []).length
                ? result.matchedKeywords.map((item) => <span key={item}>{item}</span>)
                : <span>No strong role match yet</span>}
            </div>
            {(result.warnings || []).length ? (
              <>
                <h3 className="public-ats-secondary-heading"><FiAlertTriangle /> Warnings</h3>
                <ul>
                  {result.warnings.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </>
            ) : null}
          </article>
        </section>
      ) : null}
    </div>
  );
};

export default PublicAtsPage;
