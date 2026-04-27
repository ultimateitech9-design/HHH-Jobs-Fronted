import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiClock,
  FiMail,
  FiPauseCircle,
  FiPlayCircle,
  FiRefreshCw,
  FiSend,
  FiSettings,
  FiShield,
  FiTarget,
  FiZap
} from 'react-icons/fi';
import {
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentFieldClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';
import {
  getStudentAutoApplyState,
  runStudentAutoApplyNow,
  sendStudentAutoApplyDigest,
  updateStudentAutoApply
} from '../services/studentApi';

const defaultSummary = {
  appliedThisWeek: 0,
  skippedThisWeek: 0,
  failedThisWeek: 0,
  shortlistedThisWeek: 0,
  premiumSlotsUsedThisWeek: 0
};

const defaultForm = {
  isActive: false,
  targetRoles: '',
  preferredLocations: '',
  remoteAllowed: true,
  minSalary: '',
  experienceMin: 0,
  experienceMax: 3,
  companySizeFilters: '',
  excludeCompanyTypes: '',
  excludeCompanyNames: '',
  excludeAgencies: false,
  atsThreshold: 60,
  aiCoverLetterEnabled: true,
  coverLetterTone: 'professional',
  dailyDigestEnabled: true,
  weeklyDigestEnabled: true,
  digestHour: 9,
  weeklyDigestWeekday: 1,
  premiumJobLimitEnabled: false,
  premiumJobWeeklyLimit: 3
};

const toCsv = (items = []) => (Array.isArray(items) ? items.join(', ') : '');
const toArray = (value = '') =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const statusPillClassName = {
  applied: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  skipped: 'border-amber-200 bg-amber-50 text-amber-700',
  failed: 'border-red-200 bg-red-50 text-red-700'
};

const StudentAutoApplyPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [stateError, setStateError] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [summary, setSummary] = useState(defaultSummary);
  const [recentActivity, setRecentActivity] = useState([]);
  const [form, setForm] = useState(defaultForm);

  const loadState = async () => {
    setLoading(true);
    const response = await getStudentAutoApplyState();

    setLoading(false);
    if (response.error) {
      setStateError(response.error);
      return;
    }

    const payload = response.data || {};
    const preference = payload.preference || {};
    setStateError('');
    setSummary(payload.summary || defaultSummary);
    setRecentActivity(payload.recentActivity || []);
    setForm({
      isActive: Boolean(preference.isActive),
      targetRoles: toCsv(preference.targetRoles),
      preferredLocations: toCsv(preference.preferredLocations),
      remoteAllowed: preference.remoteAllowed !== false,
      minSalary: preference.minSalary ?? '',
      experienceMin: Number(preference.experienceMin ?? 0),
      experienceMax: Number(preference.experienceMax ?? 3),
      companySizeFilters: toCsv(preference.companySizeFilters),
      excludeCompanyTypes: toCsv(preference.excludeCompanyTypes),
      excludeCompanyNames: toCsv(preference.excludeCompanyNames),
      excludeAgencies: Boolean(preference.excludeAgencies),
      atsThreshold: Number(preference.atsThreshold ?? 60),
      aiCoverLetterEnabled: preference.aiCoverLetterEnabled !== false,
      coverLetterTone: preference.coverLetterTone || 'professional',
      dailyDigestEnabled: preference.dailyDigestEnabled !== false,
      weeklyDigestEnabled: preference.weeklyDigestEnabled !== false,
      digestHour: Number(preference.digestHour ?? 9),
      weeklyDigestWeekday: Number(preference.weeklyDigestWeekday ?? 1),
      premiumJobLimitEnabled: Boolean(preference.premiumJobLimitEnabled),
      premiumJobWeeklyLimit: Number(preference.premiumJobWeeklyLimit ?? 3)
    });
  };

  useEffect(() => {
    loadState();
  }, []);

  const stats = useMemo(() => ([
    { label: 'Applied this week', value: summary.appliedThisWeek },
    { label: 'Shortlists', value: summary.shortlistedThisWeek },
    { label: 'Skipped by ATS', value: summary.skippedThisWeek },
    { label: 'Premium slots used', value: summary.premiumSlotsUsedThisWeek }
  ]), [summary]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const buildPayload = (runNow = false) => ({
    isActive: form.isActive,
    targetRoles: toArray(form.targetRoles),
    preferredLocations: toArray(form.preferredLocations),
    remoteAllowed: Boolean(form.remoteAllowed),
    minSalary: form.minSalary === '' ? null : Number(form.minSalary),
    experienceMin: Number(form.experienceMin),
    experienceMax: Number(form.experienceMax),
    companySizeFilters: toArray(form.companySizeFilters),
    excludeCompanyTypes: toArray(form.excludeCompanyTypes),
    excludeCompanyNames: toArray(form.excludeCompanyNames),
    excludeAgencies: Boolean(form.excludeAgencies),
    atsThreshold: Number(form.atsThreshold),
    aiCoverLetterEnabled: Boolean(form.aiCoverLetterEnabled),
    coverLetterTone: form.coverLetterTone,
    dailyDigestEnabled: Boolean(form.dailyDigestEnabled),
    weeklyDigestEnabled: Boolean(form.weeklyDigestEnabled),
    digestHour: Number(form.digestHour),
    weeklyDigestWeekday: Number(form.weeklyDigestWeekday),
    premiumJobLimitEnabled: Boolean(form.premiumJobLimitEnabled),
    premiumJobWeeklyLimit: Number(form.premiumJobWeeklyLimit),
    runNow
  });

  const handleSave = async (runNow = false) => {
    setSaving(true);
    setNotice({ type: '', text: '' });

    try {
      const result = await updateStudentAutoApply(buildPayload(runNow));
      setSummary(result?.autoApply?.summary || defaultSummary);
      setRecentActivity(result?.autoApply?.recentActivity || []);
      setNotice({
        type: 'success',
        text: runNow
          ? `Auto-Apply settings saved and processed ${result?.runResult?.appliedCount || 0} matching jobs right away.`
          : 'Auto-Apply settings saved successfully.'
      });
      if (runNow) {
        toast.success(`Processed ${result?.runResult?.appliedCount || 0} applications now.`);
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to save auto-apply settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setNotice({ type: '', text: '' });

    try {
      const result = await runStudentAutoApplyNow(20);
      setSummary(result?.autoApply?.summary || defaultSummary);
      setRecentActivity(result?.autoApply?.recentActivity || []);
      setNotice({
        type: 'success',
        text: `Run complete: ${result?.runResult?.appliedCount || 0} applied, ${result?.runResult?.skippedCount || 0} skipped.`
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to run auto-apply right now.' });
    } finally {
      setRunning(false);
    }
  };

  const handleDigest = async (cadence) => {
    try {
      const result = await sendStudentAutoApplyDigest(cadence);
      if (result?.sent) {
        toast.success(`${cadence === 'weekly' ? 'Weekly' : 'Daily'} digest sent.`);
        return;
      }

      toast(result?.reason === 'disabled_or_missing_email'
        ? 'Digest is disabled or no email is available for this account.'
        : 'No digest email was sent.');
    } catch (error) {
      toast.error(error.message || 'Unable to send digest right now.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  return (
    <StudentPageShell
      eyebrow="Automation"
      badge="Auto Apply"
      title="Let HHH Jobs apply on your behalf"
      subtitle="Set your role criteria once, gate every job with ATS, personalize the cover letter, and keep premium-job usage under control."
      stats={stats.map((item) => ({ ...item, tone: 'default' }))}
      actions={(
        <>
          <button
            type="button"
            onClick={() => updateField('isActive', !form.isActive)}
            className={studentSecondaryButtonClassName}
          >
            {form.isActive ? <FiPauseCircle size={16} /> : <FiPlayCircle size={16} />}
            {form.isActive ? 'Pause Auto-Apply' : 'Activate Auto-Apply'}
          </button>
          <button
            type="button"
            onClick={handleRunNow}
            disabled={running}
            className={studentPrimaryButtonClassName}
          >
            <FiZap size={16} />
            {running ? 'Running...' : 'Run Now'}
          </button>
        </>
      )}
      heroSize="compact"
    >
      {stateError ? <StudentNotice type="error" text={stateError} /> : null}
      {notice.text ? <StudentNotice type={notice.type} text={notice.text} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <StudentSurfaceCard
          eyebrow="Criteria Builder"
          title="Who should Auto-Apply target?"
          subtitle="Use comma-separated values where relevant. Only jobs that clear your ATS threshold will be submitted."
          className="p-5 xl:p-6"
          action={(
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className={studentPrimaryButtonClassName}
            >
              <FiSettings size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Target roles</span>
              <input
                className={studentFieldClassName}
                value={form.targetRoles}
                onChange={(event) => updateField('targetRoles', event.target.value)}
                placeholder="Frontend Developer, React Engineer"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Preferred locations</span>
              <input
                className={studentFieldClassName}
                value={form.preferredLocations}
                onChange={(event) => updateField('preferredLocations', event.target.value)}
                placeholder="Mumbai, Pune, Remote"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Minimum salary</span>
              <input
                type="number"
                className={studentFieldClassName}
                value={form.minSalary}
                onChange={(event) => updateField('minSalary', event.target.value)}
                placeholder="300000"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Min experience</span>
                <input
                  type="number"
                  min="0"
                  className={studentFieldClassName}
                  value={form.experienceMin}
                  onChange={(event) => updateField('experienceMin', event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Max experience</span>
                <input
                  type="number"
                  min="0"
                  className={studentFieldClassName}
                  value={form.experienceMax}
                  onChange={(event) => updateField('experienceMax', event.target.value)}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Company sizes</span>
              <input
                className={studentFieldClassName}
                value={form.companySizeFilters}
                onChange={(event) => updateField('companySizeFilters', event.target.value)}
                placeholder="1-10, 11-50, 51-200"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Exclude company types</span>
              <input
                className={studentFieldClassName}
                value={form.excludeCompanyTypes}
                onChange={(event) => updateField('excludeCompanyTypes', event.target.value)}
                placeholder="Agency, Consultancy"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-700">Exclude company names</span>
              <input
                className={studentFieldClassName}
                value={form.excludeCompanyNames}
                onChange={(event) => updateField('excludeCompanyNames', event.target.value)}
                placeholder="Example Agency, Sample Staffing"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.remoteAllowed}
                onChange={(event) => updateField('remoteAllowed', event.target.checked)}
                className="accent-brand-500"
              />
              Include remote jobs
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.excludeAgencies}
                onChange={(event) => updateField('excludeAgencies', event.target.checked)}
                className="accent-brand-500"
              />
              Exclude agencies automatically
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.aiCoverLetterEnabled}
                onChange={(event) => updateField('aiCoverLetterEnabled', event.target.checked)}
                className="accent-brand-500"
              />
              Generate AI cover letters
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Cover letter tone</span>
              <select
                className={studentFieldClassName}
                value={form.coverLetterTone}
                onChange={(event) => updateField('coverLetterTone', event.target.value)}
              >
                <option value="professional">Professional</option>
                <option value="concise">Concise</option>
                <option value="confident">Confident</option>
              </select>
            </label>
          </div>
        </StudentSurfaceCard>

        <div className="space-y-5">
          <StudentSurfaceCard
            eyebrow="Safeguards"
            title="ATS and premium limits"
            subtitle="Only roles that pass your quality bar will be submitted automatically."
            className="p-5"
          >
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <FiShield size={15} />
                  ATS threshold
                </span>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="1"
                  value={form.atsThreshold}
                  onChange={(event) => updateField('atsThreshold', Number(event.target.value))}
                  className="w-full accent-brand-500"
                />
                <p className="text-sm font-semibold text-brand-700">{form.atsThreshold}+ required to apply</p>
              </label>

              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.premiumJobLimitEnabled}
                  onChange={(event) => updateField('premiumJobLimitEnabled', event.target.checked)}
                  className="accent-brand-500"
                />
                Limit premium jobs each week
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Premium weekly limit</span>
                <input
                  type="number"
                  min="0"
                  className={studentFieldClassName}
                  value={form.premiumJobWeeklyLimit}
                  onChange={(event) => updateField('premiumJobWeeklyLimit', event.target.value)}
                />
                <p className="text-xs font-medium text-slate-500">
                  Premium jobs are currently treated as featured or paid jobs inside HHH Jobs.
                </p>
              </label>
            </div>
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Digests"
            title="Daily and weekly inbox updates"
            subtitle="Keep summaries on, or trigger one manually whenever you want a snapshot."
            className="p-5"
          >
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.dailyDigestEnabled}
                    onChange={(event) => updateField('dailyDigestEnabled', event.target.checked)}
                    className="accent-brand-500"
                  />
                  Daily digest enabled
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.weeklyDigestEnabled}
                    onChange={(event) => updateField('weeklyDigestEnabled', event.target.checked)}
                    className="accent-brand-500"
                  />
                  Weekly digest enabled
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <FiClock size={15} />
                    Digest hour
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className={studentFieldClassName}
                    value={form.digestHour}
                    onChange={(event) => updateField('digestHour', event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">Weekly digest day</span>
                  <select
                    className={studentFieldClassName}
                    value={form.weeklyDigestWeekday}
                    onChange={(event) => updateField('weeklyDigestWeekday', Number(event.target.value))}
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleDigest('daily')} className={studentSecondaryButtonClassName}>
                  <FiMail size={15} />
                  Send daily digest
                </button>
                <button type="button" onClick={() => handleDigest('weekly')} className={studentSecondaryButtonClassName}>
                  <FiSend size={15} />
                  Send weekly digest
                </button>
              </div>
            </div>
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Quick Actions"
            title="Commit and launch"
            subtitle="Save criteria, then let the engine start watching live jobs automatically."
            className="p-5"
          >
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className={studentPrimaryButtonClassName}
              >
                <FiSettings size={16} />
                Save settings
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className={studentSecondaryButtonClassName}
              >
                <FiTarget size={16} />
                Save and run against current jobs
              </button>
              <button
                type="button"
                onClick={loadState}
                className={studentSecondaryButtonClassName}
              >
                <FiRefreshCw size={16} />
                Refresh activity
              </button>
            </div>
          </StudentSurfaceCard>
        </div>
      </div>

      <StudentSurfaceCard
        eyebrow="Recent Activity"
        title="What Auto-Apply did recently"
        subtitle="Every decision is logged so you can see what was applied, skipped, or blocked."
        className="p-5 xl:p-6"
      >
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50/70 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusPillClassName[item.status] || 'border-slate-200 bg-white text-slate-600'}`}>
                      {item.status}
                    </span>
                    {item.isPremiumJob ? (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
                        Premium
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-base font-extrabold text-navy">
                    {item.job?.jobTitle || 'Role unavailable'}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {item.job?.companyName || 'HHH Jobs'}
                    {item.atsScore ? ` • ATS ${Math.round(item.atsScore)}` : ''}
                    {item.reason ? ` • ${item.reason.replace(/_/g, ' ')}` : ''}
                  </p>
                </div>

                <div className="text-sm font-semibold text-slate-500">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
            <p className="text-base font-bold text-navy">No auto-apply activity yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save your criteria, activate Auto-Apply, and run it once to start building history here.
            </p>
          </div>
        )}
      </StudentSurfaceCard>
    </StudentPageShell>
  );
};

export default StudentAutoApplyPage;
