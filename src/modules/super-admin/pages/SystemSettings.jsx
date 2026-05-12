import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import { getSystemSettings, saveSystemSettings } from '../services/settingsApi';
import { dispatchMaintenanceModeUpdate } from '../../../shared/utils/maintenanceMode';

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getSystemSettings();
      setSettings(response.data || null);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };
    load();
  }, []);

  const cards = useMemo(() => {
    if (!settings) return [];
    return [
      { label: 'Maintenance Mode', value: settings.maintenanceMode ? 'On' : 'Off', helper: 'Platform availability switch', tone: settings.maintenanceMode ? 'danger' : 'success' },
      { label: 'Employer Signup', value: settings.allowNewEmployerSignup ? 'Enabled' : 'Disabled', helper: 'Controls new employer acquisition', tone: settings.allowNewEmployerSignup ? 'success' : 'warning' },
      { label: 'Resume Search', value: settings.enableResumeSearch ? 'Enabled' : 'Disabled', helper: 'Talent search capability', tone: 'info' },
      { label: 'Support SLA', value: `${settings.supportSlaHours || 0} hrs`, helper: 'Target response commitment', tone: 'default' }
    ];
  }, [settings]);

  const handleChange = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const saved = await saveSystemSettings(settings);
      const nextSettings = { ...settings, ...saved };
      setSettings(nextSettings);
      dispatchMaintenanceModeUpdate(Boolean(nextSettings.maintenanceMode));
      setIsDemo(false);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="System Settings" subtitle="Control platform-wide feature switches, approval policy, support targets, and operational guardrails." />
      {isDemo ? <p className="module-note">Demo settings are shown because super admin settings endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {cards.length > 0 ? <DashboardStatsCards cards={cards} /> : null}
      <section className="panel-card">
        {loading ? <p className="module-note">Loading system settings...</p> : null}
        {settings ? (
          <div className="student-inline-controls">
            <label>
              Maintenance Mode
              <select value={String(settings.maintenanceMode)} onChange={(event) => handleChange('maintenanceMode', event.target.value === 'true')}>
                <option value="false">Off</option>
                <option value="true">On</option>
              </select>
            </label>
            <label>
              New Employer Signup
              <select value={String(settings.allowNewEmployerSignup)} onChange={(event) => handleChange('allowNewEmployerSignup', event.target.value === 'true')}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </label>
            <label>
              Resume Search
              <select value={String(settings.enableResumeSearch)} onChange={(event) => handleChange('enableResumeSearch', event.target.value === 'true')}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </label>
            <label>
              HR Approval Required
              <select value={String(settings.requireHrApproval)} onChange={(event) => handleChange('requireHrApproval', event.target.value === 'true')}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label>
              Payment Retry Policy
              <input value={settings.paymentRetryPolicy || ''} onChange={(event) => handleChange('paymentRetryPolicy', event.target.value)} />
            </label>
            <label>
              Support SLA Hours
              <input type="number" value={settings.supportSlaHours || 0} onChange={(event) => handleChange('supportSlaHours', Number(event.target.value))} />
            </label>
            <label className="full-width-control">
              Security Alert Emails
              <input value={(settings.securityAlertEmails || []).join(', ')} onChange={(event) => handleChange('securityAlertEmails', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} />
            </label>
            <div className="student-job-actions">
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default SystemSettings;
