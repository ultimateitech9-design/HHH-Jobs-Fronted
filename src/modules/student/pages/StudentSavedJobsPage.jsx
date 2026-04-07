import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../../../shared/components/SectionHeader';
import {
  applyToJob,
  formatDateTime,
  getFriendlyApplyErrorMessage,
  getStudentSavedJobs,
  removeSavedJobForStudent
} from '../services/studentApi';

const StudentSavedJobsPage = () => {
  const [state, setState] = useState({ loading: true, error: '', jobs: [] });
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadSaved = async () => {
      const response = await getStudentSavedJobs();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error || '',
        jobs: response.data || []
      });
    };

    loadSaved();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRemove = async (jobId) => {
    setMessage('');

    try {
      await removeSavedJobForStudent(jobId);
    } catch (error) {
      setMessage(error.message || 'Unable to remove saved job.');
      return;
    }

    setState((current) => ({
      ...current,
      jobs: current.jobs.filter((item) => (item.jobId || item.job_id) !== jobId)
    }));
    setMessage('Removed from saved jobs.');
  };

  const handleApply = async (jobId) => {
    setMessage('');

    try {
      await applyToJob({ jobId, coverLetter: '' });
      setMessage('Application submitted successfully.');
    } catch (error) {
      setMessage(getFriendlyApplyErrorMessage(error));
    }
  };

  return (
    <div className="module-page module-page--student">
      <SectionHeader
        eyebrow="Saved Jobs"
        title="Your Saved Opportunities"
        subtitle="Manage saved jobs and apply when ready."
      />

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      {state.loading ? <p className="module-note">Loading saved jobs...</p> : null}

      <div className="student-job-grid">
        {state.jobs.map((item) => {
          const job = item.job || {};
          const jobId = item.jobId || item.job_id || job.id || job._id;

          return (
            <article className="student-job-card" key={item.id || jobId}>
              <h3>{job.jobTitle || 'Job'}</h3>
              <p>{job.companyName || '-'}</p>
              <p>{job.jobLocation || '-'} • {job.experienceLevel || '-'}</p>
              <p>Saved on: {formatDateTime(item.createdAt || item.created_at)}</p>

              <div className="student-job-actions">
                <Link to={`/portal/student/jobs/${jobId}`} className="btn-link">Details</Link>
                <button type="button" className="btn-link" onClick={() => handleRemove(jobId)}>Remove</button>
                <button type="button" className="btn-primary" onClick={() => handleApply(jobId)}>Apply</button>
              </div>
            </article>
          );
        })}
      </div>

      {(!state.loading && state.jobs.length === 0) ? (
        <section className="panel-card">
          <p className="module-note">No saved jobs yet.</p>
          <Link to="/portal/student/jobs" className="inline-link">Browse jobs</Link>
        </section>
      ) : null}
    </div>
  );
};

export default StudentSavedJobsPage;
