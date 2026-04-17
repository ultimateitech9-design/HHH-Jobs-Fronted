import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import {
  getPlatformCustomization,
  getPlatformTenants,
  savePlatformCustomization
} from '../services/platformApi';

const defaultCustomization = {
  logoUrl: '',
  primaryColor: '#215479',
  accentColor: '#1f7a61',
  customDomain: '',
  enableWidgets: true,
  enableRolePermissions: true,
  enableCareerSite: true,
  dashboardWidgets: ['applications', 'jobs'],
  footerText: ''
};

const widgetOptions = ['applications', 'pipeline', 'jobs', 'interviews', 'offers', 'compliance', 'alerts'];

const PlatformCustomizationPage = () => {
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [customization, setCustomization] = useState(defaultCustomization);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCustomization = async (nextTenantId) => {
    if (!nextTenantId) return;
    const response = await getPlatformCustomization(nextTenantId);
    setCustomization(response.data || defaultCustomization);
    setIsDemo(response.isDemo);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const response = await getPlatformTenants();
      if (!mounted) return;

      const rows = response.data || [];
      setTenants(rows);
      setIsDemo(response.isDemo);

      if (rows.length > 0) {
        const firstId = rows[0].id;
        setTenantId(firstId);
        await loadCustomization(firstId);
      }
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId) || null,
    [tenants, tenantId]
  );

  const setField = (key, value) => {
    setCustomization((current) => ({ ...current, [key]: value }));
  };

  const toggleWidget = (widget) => {
    setCustomization((current) => {
      const active = Array.isArray(current.dashboardWidgets) ? current.dashboardWidgets : [];
      const has = active.includes(widget);
      return {
        ...current,
        dashboardWidgets: has ? active.filter((item) => item !== widget) : [...active, widget]
      };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!tenantId) {
      setError('Select tenant first.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const saved = await savePlatformCustomization(tenantId, customization);
      setCustomization(saved || customization);
      setMessage('Customization saved.');
    } catch (actionError) {
      setError(actionError.message || 'Unable to save customization.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Customization"
        title="Tenant Portal Branding and Behavior"
        subtitle="Control logo, colors, domain, widgets, and role-permission related UI switches."
      />

      {isDemo ? <p className="module-note">Showing fallback customization data because the live backend is unavailable right now.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {loading ? <p className="module-note">Loading customization...</p> : null}

      <section className="panel-card">
        <div className="student-inline-controls">
          <label>
            Tenant
            <select
              value={tenantId}
              onChange={async (event) => {
                const nextId = event.target.value;
                setTenantId(nextId);
                await loadCustomization(nextId);
              }}
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </label>
        </div>

        <form className="form-grid" onSubmit={handleSave}>
          <label>
            Logo URL
            <input value={customization.logoUrl} onChange={(event) => setField('logoUrl', event.target.value)} />
          </label>
          <label>
            Custom Domain
            <input value={customization.customDomain} onChange={(event) => setField('customDomain', event.target.value)} />
          </label>
          <label>
            Primary Color
            <input type="color" value={customization.primaryColor} onChange={(event) => setField('primaryColor', event.target.value)} />
          </label>
          <label>
            Accent Color
            <input type="color" value={customization.accentColor} onChange={(event) => setField('accentColor', event.target.value)} />
          </label>
          <label>
            Widgets
            <select
              value={customization.enableWidgets ? 'enabled' : 'disabled'}
              onChange={(event) => setField('enableWidgets', event.target.value === 'enabled')}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label>
            Role Permission UI
            <select
              value={customization.enableRolePermissions ? 'enabled' : 'disabled'}
              onChange={(event) => setField('enableRolePermissions', event.target.value === 'enabled')}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label>
            Career Site
            <select
              value={customization.enableCareerSite ? 'enabled' : 'disabled'}
              onChange={(event) => setField('enableCareerSite', event.target.value === 'enabled')}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="full-row">
            Footer Text
            <input value={customization.footerText} onChange={(event) => setField('footerText', event.target.value)} />
          </label>

          <div className="full-row">
            <p className="module-note">Dashboard Widgets</p>
            <div className="student-chip-row">
              {widgetOptions.map((widget) => {
                const active = (customization.dashboardWidgets || []).includes(widget);
                return (
                  <button
                    key={widget}
                    type="button"
                    className={active ? 'btn-primary' : 'btn-link'}
                    onClick={() => toggleWidget(widget)}
                  >
                    {widget}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="student-job-actions full-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Customization'}</button>
          </div>
        </form>
      </section>

      {selectedTenant ? (
        <section className="panel-card">
          <SectionHeader eyebrow="Preview" title={`${selectedTenant.name} - Theme Snapshot`} />
          <div className="student-job-card" style={{ borderColor: customization.primaryColor }}>
            <h3>{selectedTenant.name}</h3>
            <p>Domain: {customization.customDomain || selectedTenant.domain || '-'}</p>
            <p>Primary: {customization.primaryColor} • Accent: {customization.accentColor}</p>
            <p>Footer: {customization.footerText || '-'}</p>
            <div className="student-chip-row">
              {(customization.dashboardWidgets || []).map((item) => (
                <span key={item} className="student-chip">{item}</span>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default PlatformCustomizationPage;
