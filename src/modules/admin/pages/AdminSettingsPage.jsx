import { useEffect, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import {
  getAdminPricingPlans,
  getAdminSettings,
  saveAdminSettings,
  updateAdminPricingPlan
} from '../services/adminApi';

const defaultSettings = {
  rolePermissionsV2: true,
  otpProvider: 'Twilio',
  resumeParser: 'AI Parser v2',
  notificationsMode: 'multi-channel',
  antiFraudRules: true,
  auditRetentionDays: 180,
  approvalSlaHours: 12,
  paymentAutoReconcile: false
};

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planSavingSlug, setPlanSavingSlug] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [settingsRes, plansRes] = await Promise.all([
        getAdminSettings(),
        getAdminPricingPlans()
      ]);

      if (!mounted) return;

      setSettings(settingsRes.data || defaultSettings);
      setPricingPlans(plansRes.data || []);
      setError(settingsRes.error || plansRes.error || '');
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleBoolean = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleValue = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      ...settings,
      auditRetentionDays: Number(settings.auditRetentionDays || 0),
      approvalSlaHours: Number(settings.approvalSlaHours || 0)
    };

    const response = await saveAdminSettings(payload);
    if (response.error) {
      setError(response.error);
      setSaving(false);
      return;
    }

    setSettings(response.data || payload);
    setError('');
    setMessage('Settings saved successfully.');
    setSaving(false);
  };

  const updatePlanField = (slug, key, value) => {
    setPricingPlans((current) =>
      current.map((plan) => (plan.slug === slug ? { ...plan, [key]: value } : plan))
    );
  };

  const savePlan = async (plan) => {
    setPlanSavingSlug(plan.slug);
    setError('');
    setMessage('');

    const payload = {
      name: plan.name,
      price: toNumberOrNull(plan.price),
      gstRate: toNumberOrNull(plan.gstRate),
      bulkDiscountMinQty: toNumberOrNull(plan.bulkDiscountMinQty),
      bulkDiscountPercent: toNumberOrNull(plan.bulkDiscountPercent),
      maxDescriptionChars: toNumberOrNull(plan.maxDescriptionChars),
      maxLocations: toNumberOrNull(plan.maxLocations),
      maxApplications: toNumberOrNull(plan.maxApplications),
      applicationsExpiryDays: toNumberOrNull(plan.applicationsExpiryDays),
      jobValidityDays: toNumberOrNull(plan.jobValidityDays),
      contactDetailsVisible: Boolean(plan.contactDetailsVisible),
      boostOnSearch: Boolean(plan.boostOnSearch),
      jobBranding: Boolean(plan.jobBranding),
      isActive: Boolean(plan.isActive)
    };

    try {
      const updated = await updateAdminPricingPlan(plan.slug, payload);
      setPricingPlans((current) => current.map((item) => (item.slug === plan.slug ? { ...item, ...updated } : item)));
      setMessage(`${plan.name} pricing updated.`);
    } catch (planError) {
      setError(planError.message || `Unable to update ${plan.name}.`);
    } finally {
      setPlanSavingSlug('');
    }
  };

  return (
    <div className="module-page module-page--admin">
      <SectionHeader
        eyebrow="System Settings"
        title="Roles, Security, OTP, and Pricing Controls"
        subtitle="Configure platform-wide behavior and update job posting plans used by HR checkout."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {loading ? <p className="module-note">Loading settings...</p> : null}

      <section className="panel-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            OTP Provider
            <select value={settings.otpProvider} onChange={(event) => handleValue('otpProvider', event.target.value)}>
              <option value="Twilio">Twilio</option>
              <option value="MSG91">MSG91</option>
              <option value="Firebase">Firebase</option>
              <option value="Custom Gateway">Custom Gateway</option>
            </select>
          </label>

          <label>
            Resume Parser
            <input value={settings.resumeParser} onChange={(event) => handleValue('resumeParser', event.target.value)} />
          </label>

          <label>
            Notifications Mode
            <select value={settings.notificationsMode} onChange={(event) => handleValue('notificationsMode', event.target.value)}>
              <option value="multi-channel">Multi-channel</option>
              <option value="email-only">Email only</option>
              <option value="in-app-only">In-app only</option>
            </select>
          </label>

          <label>
            Audit Retention (days)
            <input
              type="number"
              min="30"
              value={settings.auditRetentionDays}
              onChange={(event) => handleValue('auditRetentionDays', event.target.value)}
            />
          </label>

          <label>
            Approval SLA (hours)
            <input
              type="number"
              min="1"
              value={settings.approvalSlaHours}
              onChange={(event) => handleValue('approvalSlaHours', event.target.value)}
            />
          </label>

          <label>
            Role Permissions V2
            <select
              value={settings.rolePermissionsV2 ? 'enabled' : 'disabled'}
              onChange={(event) => handleBoolean('rolePermissionsV2', event.target.value === 'enabled')}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <label>
            Anti-Fraud Rules
            <select
              value={settings.antiFraudRules ? 'enabled' : 'disabled'}
              onChange={(event) => handleBoolean('antiFraudRules', event.target.value === 'enabled')}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <label>
            Payment Auto Reconcile
            <select
              value={settings.paymentAutoReconcile ? 'enabled' : 'disabled'}
              onChange={(event) => handleBoolean('paymentAutoReconcile', event.target.value === 'enabled')}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <div className="student-job-actions full-row">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel-card">
        <SectionHeader
          eyebrow="Pricing Plans"
          title="Configure Job Posting Plans"
          subtitle="These plans directly control HR posting limits and billing quote logic."
        />

        <div className="student-job-grid">
          {pricingPlans.map((plan) => (
            <article className="student-job-card" key={plan.slug}>
              <div className="student-job-card-header">
                <h3>{plan.name}</h3>
                <span className="role-chip">{plan.slug}</span>
              </div>

              <label>
                Price
                <input
                  type="number"
                  value={plan.price ?? ''}
                  onChange={(event) => updatePlanField(plan.slug, 'price', event.target.value)}
                />
              </label>

              <label>
                Max Locations
                <input
                  type="number"
                  value={plan.maxLocations ?? ''}
                  onChange={(event) => updatePlanField(plan.slug, 'maxLocations', event.target.value)}
                />
              </label>

              <label>
                Max Applications
                <input
                  type="number"
                  value={plan.maxApplications ?? ''}
                  onChange={(event) => updatePlanField(plan.slug, 'maxApplications', event.target.value)}
                />
              </label>

              <label>
                Job Validity Days
                <input
                  type="number"
                  value={plan.jobValidityDays ?? ''}
                  onChange={(event) => updatePlanField(plan.slug, 'jobValidityDays', event.target.value)}
                />
              </label>

              <label>
                Applications Expiry Days
                <input
                  type="number"
                  value={plan.applicationsExpiryDays ?? ''}
                  onChange={(event) => updatePlanField(plan.slug, 'applicationsExpiryDays', event.target.value)}
                />
              </label>

              <label>
                Max Description Chars
                <input
                  type="number"
                  value={plan.maxDescriptionChars ?? ''}
                  onChange={(event) => updatePlanField(plan.slug, 'maxDescriptionChars', event.target.value)}
                />
              </label>

              <label>
                Contact Details Visible
                <select
                  value={plan.contactDetailsVisible ? 'yes' : 'no'}
                  onChange={(event) => updatePlanField(plan.slug, 'contactDetailsVisible', event.target.value === 'yes')}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label>
                Boost on Search
                <select
                  value={plan.boostOnSearch ? 'yes' : 'no'}
                  onChange={(event) => updatePlanField(plan.slug, 'boostOnSearch', event.target.value === 'yes')}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label>
                Job Branding
                <select
                  value={plan.jobBranding ? 'yes' : 'no'}
                  onChange={(event) => updatePlanField(plan.slug, 'jobBranding', event.target.value === 'yes')}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <div className="student-job-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={planSavingSlug === plan.slug}
                  onClick={() => savePlan(plan)}
                >
                  {planSavingSlug === plan.slug ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminSettingsPage;
