import { useEffect, useState } from 'react';
import {
  FiBell,
  FiMapPin,
  FiSearch,
  FiSliders,
  FiTrash2,
  FiZap
} from 'react-icons/fi';
import StatusPill from '../../../shared/components/StatusPill';
import {
  StudentEmptyState,
  StudentNotice,
  StudentSurfaceCard,
  studentFieldClassName,
  studentGhostButtonClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from './StudentExperience';
import {
  createStudentAlert,
  deleteStudentAlert,
  getStudentAlerts,
  updateStudentAlert
} from '../services/studentApi';

const initialAlertForm = {
  keywords: '',
  location: '',
  experienceLevel: '',
  employmentType: '',
  minSalary: '',
  maxSalary: ''
};

const detailRowClassName =
  'rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600';

const StudentAlertsWorkspace = ({ sectionId = 'student-alerts-workspace' }) => {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(initialAlertForm);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      const response = await getStudentAlerts();
      if (!mounted) return;

      setAlerts(response.data || []);
      setNotice(response.error ? { type: 'error', text: response.error } : { type: '', text: '' });
      setLoading(false);
    };

    loadAlerts();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setNotice({ type: '', text: '' });

    const payload = {
      keywords: form.keywords
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      location: form.location || null,
      experienceLevel: form.experienceLevel || null,
      employmentType: form.employmentType || null,
      minSalary: form.minSalary ? Number(form.minSalary) : null,
      maxSalary: form.maxSalary ? Number(form.maxSalary) : null,
      isActive: true
    };

    try {
      const created = await createStudentAlert(payload);
      setAlerts((current) => [created, ...current]);
      setForm(initialAlertForm);
      setNotice({ type: 'success', text: 'Alert created successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Failed to create alert.' });
    }
  };

  const toggleAlert = async (alert) => {
    const nextActiveState = !alert.is_active;
    setNotice({ type: '', text: '' });

    try {
      const updated = await updateStudentAlert(alert.id, { isActive: nextActiveState });
      setAlerts((current) => current.map((item) => (item.id === alert.id ? updated : item)));
      setNotice({
        type: 'success',
        text: nextActiveState ? 'Alert activated successfully.' : 'Alert paused successfully.'
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Failed to update alert.' });
    }
  };

  const removeAlert = async (alertId) => {
    setNotice({ type: '', text: '' });

    try {
      await deleteStudentAlert(alertId);
      setAlerts((current) => current.filter((item) => item.id !== alertId));
      setNotice({ type: 'success', text: 'Alert removed successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Failed to remove alert.' });
    }
  };

  return (
    <section id={sectionId} className="space-y-6 scroll-mt-28">
      {notice.text ? <StudentNotice type={notice.type || 'info'} text={notice.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <StudentSurfaceCard
          eyebrow="Dashboard Alert Rule"
          title="Design a targeted alert"
          subtitle="Use keyword combinations and salary boundaries to keep alerts useful instead of noisy."
          className="h-fit"
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">Keywords</span>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.keywords}
                  onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))}
                  placeholder="react, frontend, typescript"
                  className={`${studentFieldClassName} pl-11`}
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Location</span>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Pune, Bengaluru, Remote"
                  className={`${studentFieldClassName} pl-11`}
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Experience</span>
              <input
                value={form.experienceLevel}
                onChange={(event) => setForm((current) => ({ ...current, experienceLevel: event.target.value }))}
                placeholder="Fresher, 0-2 years"
                className={studentFieldClassName}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Employment Type</span>
              <input
                value={form.employmentType}
                onChange={(event) => setForm((current) => ({ ...current, employmentType: event.target.value }))}
                placeholder="Full-time, Internship"
                className={studentFieldClassName}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Minimum Salary</span>
              <input
                type="number"
                value={form.minSalary}
                onChange={(event) => setForm((current) => ({ ...current, minSalary: event.target.value }))}
                placeholder="300000"
                className={studentFieldClassName}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Maximum Salary</span>
              <input
                type="number"
                value={form.maxSalary}
                onChange={(event) => setForm((current) => ({ ...current, maxSalary: event.target.value }))}
                placeholder="900000"
                className={studentFieldClassName}
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button type="submit" className={studentPrimaryButtonClassName}>
                <FiZap size={15} />
                Create Alert
              </button>
              <button
                type="button"
                className={studentSecondaryButtonClassName}
                onClick={() => setForm(initialAlertForm)}
              >
                Reset Form
              </button>
            </div>
          </form>
        </StudentSurfaceCard>

        <StudentSurfaceCard
          eyebrow="Alert Library"
          title="Active and standby rules"
          subtitle="Pause, resume, or remove alerts as your focus changes during the week."
        >
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-40 animate-pulse rounded-[1.7rem] bg-slate-100" />
              ))}
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const keywords = Array.isArray(alert.keywords) ? alert.keywords : [];
                const salaryText =
                  alert.min_salary || alert.max_salary || alert.minSalary || alert.maxSalary
                    ? `INR ${alert.min_salary || alert.minSalary || 0} - ${alert.max_salary || alert.maxSalary || 'Any'}`
                    : 'Salary open';

                return (
                  <article
                    key={alert.id}
                    className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-heading text-xl font-bold text-navy">
                            {keywords.join(', ') || 'Alert rule'}
                          </h3>
                          <StatusPill value={alert.is_active ? 'active' : 'inactive'} />
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className={detailRowClassName}>
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                              <FiMapPin size={13} />
                              Location
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">{alert.location || 'Any location'}</p>
                          </div>
                          <div className={detailRowClassName}>
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                              <FiSliders size={13} />
                              Filters
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                              {[
                                alert.experience_level || alert.experienceLevel || 'Any experience',
                                alert.employment_type || alert.employmentType || 'Any type'
                              ].join(' | ')}
                            </p>
                          </div>
                          <div className={`${detailRowClassName} md:col-span-2`}>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Salary Range</p>
                            <p className="mt-2 font-semibold text-slate-800">{salaryText}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 md:w-[220px] md:flex-col">
                        <button
                          type="button"
                          className={studentGhostButtonClassName}
                          onClick={() => toggleAlert(alert)}
                        >
                          <FiBell size={14} />
                          {alert.is_active ? 'Pause Alert' : 'Activate Alert'}
                        </button>
                        <button
                          type="button"
                          className={studentSecondaryButtonClassName}
                          onClick={() => removeAlert(alert.id)}
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <StudentEmptyState
              icon={FiBell}
              title="No alerts created yet"
              description="Create your first rule to automatically capture roles that match the keywords and salary range you actually want."
              className="border-none bg-slate-50/80"
            />
          )}
        </StudentSurfaceCard>
      </div>
    </section>
  );
};

export default StudentAlertsWorkspace;
