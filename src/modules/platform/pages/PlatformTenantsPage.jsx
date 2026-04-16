import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatCard from '../../../shared/components/StatCard';
import StatusPill from '../../../shared/components/StatusPill';
import {
  createPlatformTenant,
  deletePlatformTenant,
  getPlatformPlans,
  getPlatformTenants,
  updatePlatformTenant
} from '../services/platformApi';

const initialForm = {
  name: '',
  domain: '',
  plan: 'starter',
  status: 'pending',
  recruiterSeats: 10,
  jobLimit: 100,
  activeUsers: 0,
  renewalDate: '',
  complianceStatus: 'healthy',
  slaTier: 'Standard'
};

const initialFilters = {
  status: 'all',
  plan: 'all',
  search: ''
};

const PlatformTenantsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [tenantRes, plansRes] = await Promise.all([getPlatformTenants(), getPlatformPlans()]);
    setTenants(tenantRes.data || []);
    setPlans(plansRes.data || []);
    setIsDemo(tenantRes.isDemo || plansRes.isDemo);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTenants = useMemo(() => {
    const search = String(filters.search || '').toLowerCase().trim();
    return tenants.filter((tenant) => {
      const matchStatus = filters.status === 'all' || tenant.status === filters.status;
      const matchPlan = filters.plan === 'all' || tenant.plan === filters.plan;
      const matchSearch =
        !search || `${tenant.name || ''} ${tenant.domain || ''}`.toLowerCase().includes(search);
      return matchStatus && matchPlan && matchSearch;
    });
  }, [tenants, filters]);

  const stats = useMemo(() => {
    const active = tenants.filter((tenant) => tenant.status === 'active').length;
    const pending = tenants.filter((tenant) => tenant.status === 'pending').length;
    const suspended = tenants.filter((tenant) => tenant.status === 'suspended').length;
    const enterprise = tenants.filter((tenant) => tenant.plan === 'enterprise').length;
    return [
      { label: 'Total Tenants', value: String(tenants.length), helper: 'All onboarded organizations', tone: 'info' },
      { label: 'Active', value: String(active), helper: `${pending} pending onboarding`, tone: 'success' },
      { label: 'Suspended', value: String(suspended), helper: 'Requires platform action', tone: suspended > 0 ? 'danger' : 'default' },
      { label: 'Enterprise', value: String(enterprise), helper: 'High-touch accounts', tone: 'warning' }
    ];
  }, [tenants]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId('');
  };

  const handleSaveTenant = async (event) => {
    event.preventDefault();
    if (!String(form.name || '').trim()) {
      setError('Tenant name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        const updated = await updatePlatformTenant(editingId, {
          ...form,
          recruiterSeats: Number(form.recruiterSeats || 0),
          jobLimit: Number(form.jobLimit || 0),
          activeUsers: Number(form.activeUsers || 0)
        });
        setTenants((current) => current.map((tenant) => (tenant.id === editingId ? updated : tenant)));
        setMessage('Tenant updated.');
      } else {
        const created = await createPlatformTenant(form);
        setTenants((current) => [created, ...current]);
        setMessage('Tenant created.');
      }
      resetForm();
    } catch (actionError) {
      setError(actionError.message || 'Unable to save tenant.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tenant) => {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name || '',
      domain: tenant.domain || '',
      plan: tenant.plan || 'starter',
      status: tenant.status || 'pending',
      recruiterSeats: tenant.recruiterSeats || 0,
      jobLimit: tenant.jobLimit || 0,
      activeUsers: tenant.activeUsers || 0,
      renewalDate: tenant.renewalDate || '',
      complianceStatus: tenant.complianceStatus || 'healthy',
      slaTier: tenant.slaTier || 'Standard'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTenantStatus = async (tenant) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const updated = await updatePlatformTenant(tenant.id, { status: nextStatus });
    setTenants((current) => current.map((row) => (row.id === tenant.id ? updated : row)));
    setMessage(`Tenant ${tenant.name} marked ${nextStatus}.`);
  };

  const removeTenant = async (tenant) => {
    if (!window.confirm(`Remove tenant "${tenant.name}"?`)) return;
    await deletePlatformTenant(tenant.id);
    setTenants((current) => current.filter((row) => row.id !== tenant.id));
    setMessage(`Tenant ${tenant.name} removed.`);
  };

  const columns = [
    { key: 'name', label: 'Tenant' },
    { key: 'domain', label: 'Domain' },
    { key: 'plan', label: 'Plan' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value} />
    },
    { key: 'recruiterSeats', label: 'Seats' },
    { key: 'jobLimit', label: 'Job Limit' },
    { key: 'activeUsers', label: 'Active Users' },
    { key: 'renewalDate', label: 'Renewal' },
    {
      key: 'complianceStatus',
      label: 'Compliance',
      render: (value) => <StatusPill value={value} />
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="student-job-actions">
          <button type="button" className="btn-link" onClick={() => startEdit(row)}>Edit</button>
          <button type="button" className="btn-link" onClick={() => toggleTenantStatus(row)}>
            {row.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
          <button type="button" className="btn-link" onClick={() => removeTenant(row)}>Delete</button>
        </div>
      )
    }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Tenants"
        title="Multitenancy Lifecycle Management"
        subtitle="Onboard organizations, map plans, and control tenant state with operational safeguards."
      />

      {isDemo ? <p className="module-note">Showing fallback tenant data because the live backend is unavailable right now.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="stats-grid">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <section className="panel-card">
        <SectionHeader eyebrow={editingId ? 'Edit Tenant' : 'Create Tenant'} title="Tenant Profile and Plan Mapping" />
        <form className="form-grid" onSubmit={handleSaveTenant}>
          <label>
            Tenant Name
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            Domain
            <input value={form.domain} onChange={(event) => updateField('domain', event.target.value)} />
          </label>
          <label>
            Plan
            <select value={form.plan} onChange={(event) => updateField('plan', event.target.value)}>
              {plans.map((plan) => (
                <option key={plan.key} value={plan.key}>{plan.name}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label>
            Recruiter Seats
            <input type="number" value={form.recruiterSeats} onChange={(event) => updateField('recruiterSeats', event.target.value)} />
          </label>
          <label>
            Job Limit
            <input type="number" value={form.jobLimit} onChange={(event) => updateField('jobLimit', event.target.value)} />
          </label>
          <label>
            Active Users
            <input type="number" value={form.activeUsers} onChange={(event) => updateField('activeUsers', event.target.value)} />
          </label>
          <label>
            Renewal Date
            <input type="date" value={form.renewalDate} onChange={(event) => updateField('renewalDate', event.target.value)} />
          </label>
          <label>
            Compliance
            <select value={form.complianceStatus} onChange={(event) => updateField('complianceStatus', event.target.value)}>
              <option value="healthy">Healthy</option>
              <option value="degraded">Degraded</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label>
            SLA Tier
            <select value={form.slaTier} onChange={(event) => updateField('slaTier', event.target.value)}>
              <option value="Standard">Standard</option>
              <option value="Priority">Priority</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </label>
          <div className="student-job-actions full-row">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Tenant' : 'Create Tenant'}
            </button>
            {editingId ? <button type="button" className="btn-link" onClick={resetForm}>Cancel Edit</button> : null}
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="student-inline-controls">
          <label>
            Status
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label>
            Plan
            <select value={filters.plan} onChange={(event) => setFilters((current) => ({ ...current, plan: event.target.value }))}>
              <option value="all">All</option>
              {plans.map((plan) => (
                <option key={plan.key} value={plan.key}>{plan.name}</option>
              ))}
            </select>
          </label>
          <label className="full-width-control">
            Search
            <input
              value={filters.search}
              placeholder="Tenant or domain"
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
        </div>

        {loading ? <p className="module-note">Loading tenants...</p> : null}
        <DataTable columns={columns} rows={filteredTenants} />
      </section>
    </div>
  );
};

export default PlatformTenantsPage;
