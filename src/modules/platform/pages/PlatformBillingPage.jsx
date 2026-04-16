import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatCard from '../../../shared/components/StatCard';
import StatusPill from '../../../shared/components/StatusPill';
import {
  formatDateTime,
  getPlatformInvoices,
  getPlatformPlans,
  savePlatformPlan,
  updatePlatformInvoiceStatus
} from '../services/platformApi';

const initialPlanDraft = {
  key: '',
  name: '',
  monthlyPrice: '',
  recruiterSeats: '',
  jobLimit: '',
  featuresInput: ''
};

const PlatformBillingPage = () => {
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState(initialPlanDraft);
  const [savingPlan, setSavingPlan] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [plansRes, invoiceRes] = await Promise.all([getPlatformPlans(), getPlatformInvoices()]);
    setPlans(plansRes.data || []);
    setInvoices(invoiceRes.data || []);
    setIsDemo(plansRes.isDemo || invoiceRes.isDemo);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const paid = invoices.filter((invoice) => invoice.status === 'paid');
    const pending = invoices.filter((invoice) => invoice.status === 'pending');
    const failed = invoices.filter((invoice) => invoice.status === 'failed');
    const totalRevenue = paid.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    return [
      { label: 'Plans', value: String(plans.length), helper: 'Active pricing tiers', tone: 'info' },
      { label: 'Paid Invoices', value: String(paid.length), helper: `Revenue ${totalRevenue}`, tone: 'success' },
      { label: 'Pending', value: String(pending.length), helper: 'Awaiting collection', tone: pending.length > 0 ? 'warning' : 'default' },
      { label: 'Failed', value: String(failed.length), helper: 'Needs retry/reconcile', tone: failed.length > 0 ? 'danger' : 'default' }
    ];
  }, [plans, invoices]);

  const applyInvoiceStatus = async (invoiceId, status) => {
    const updated = await updatePlatformInvoiceStatus(invoiceId, status);
    setInvoices((current) => current.map((invoice) => (invoice.id === invoiceId ? { ...invoice, ...updated } : invoice)));
    setMessage(`Invoice ${invoiceId} marked ${status}.`);
  };

  const handleSavePlan = async (event) => {
    event.preventDefault();
    const key = String(draft.key || '').trim().toLowerCase();
    const name = String(draft.name || '').trim();
    if (!key || !name) {
      setError('Plan key and name are required.');
      return;
    }

    setSavingPlan(true);
    setError('');
    setMessage('');

    const payload = {
      key,
      name,
      monthlyPrice: Number(draft.monthlyPrice || 0),
      recruiterSeats: Number(draft.recruiterSeats || 0),
      jobLimit: Number(draft.jobLimit || 0),
      features: String(draft.featuresInput || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      const saved = await savePlatformPlan(payload);
      setPlans((current) => {
        const exists = current.some((item) => item.key === saved.key);
        if (exists) {
          return current.map((item) => (item.key === saved.key ? saved : item));
        }
        return [saved, ...current];
      });
      setMessage(`Plan ${saved.name} saved.`);
      setDraft(initialPlanDraft);
    } catch (actionError) {
      setError(actionError.message || 'Unable to save plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  const startPlanEdit = (plan) => {
    setDraft({
      key: plan.key || '',
      name: plan.name || '',
      monthlyPrice: String(plan.monthlyPrice || ''),
      recruiterSeats: String(plan.recruiterSeats || ''),
      jobLimit: String(plan.jobLimit || ''),
      featuresInput: Array.isArray(plan.features) ? plan.features.join(', ') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const planColumns = [
    { key: 'name', label: 'Plan' },
    { key: 'key', label: 'Key' },
    { key: 'monthlyPrice', label: 'Monthly Price' },
    { key: 'recruiterSeats', label: 'Seats' },
    { key: 'jobLimit', label: 'Job Limit' },
    {
      key: 'features',
      label: 'Features',
      render: (value) => (Array.isArray(value) ? value.join(', ') : '-')
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <button type="button" className="btn-link" onClick={() => startPlanEdit(row)}>Edit</button>
      )
    }
  ];

  const invoiceColumns = [
    { key: 'id', label: 'Invoice ID' },
    { key: 'tenantName', label: 'Tenant' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'issuedAt',
      label: 'Issued',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'dueAt',
      label: 'Due',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="student-job-actions">
          <button type="button" className="btn-link" onClick={() => applyInvoiceStatus(row.id, 'paid')}>Paid</button>
          <button type="button" className="btn-link" onClick={() => applyInvoiceStatus(row.id, 'pending')}>Pending</button>
          <button type="button" className="btn-link" onClick={() => applyInvoiceStatus(row.id, 'failed')}>Failed</button>
        </div>
      )
    }
  ];

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Billing"
        title="Plans and Invoice Operations"
        subtitle="Maintain pricing tiers, track invoice outcomes, and monitor collection health."
      />

      {isDemo ? <p className="module-note">Showing fallback billing data because the live backend is unavailable right now.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="stats-grid">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <section className="panel-card">
        <SectionHeader eyebrow="Plan Manager" title="Create or Update Pricing Plan" />
        <form className="form-grid" onSubmit={handleSavePlan}>
          <label>
            Plan Key
            <input value={draft.key} onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))} />
          </label>
          <label>
            Plan Name
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            Monthly Price
            <input type="number" value={draft.monthlyPrice} onChange={(event) => setDraft((current) => ({ ...current, monthlyPrice: event.target.value }))} />
          </label>
          <label>
            Recruiter Seats
            <input type="number" value={draft.recruiterSeats} onChange={(event) => setDraft((current) => ({ ...current, recruiterSeats: event.target.value }))} />
          </label>
          <label>
            Job Limit
            <input type="number" value={draft.jobLimit} onChange={(event) => setDraft((current) => ({ ...current, jobLimit: event.target.value }))} />
          </label>
          <label className="full-row">
            Features (comma separated)
            <input value={draft.featuresInput} onChange={(event) => setDraft((current) => ({ ...current, featuresInput: event.target.value }))} />
          </label>
          <div className="student-job-actions full-row">
            <button type="submit" className="btn-primary" disabled={savingPlan}>{savingPlan ? 'Saving...' : 'Save Plan'}</button>
            <button type="button" className="btn-link" onClick={() => setDraft(initialPlanDraft)}>Reset</button>
          </div>
        </form>
      </section>

      <div className="split-grid">
        <section className="panel-card">
          <SectionHeader eyebrow="Plans" title="Pricing Tier Matrix" />
          {loading ? <p className="module-note">Loading plans...</p> : null}
          <DataTable columns={planColumns} rows={plans} />
        </section>

        <section className="panel-card">
          <SectionHeader eyebrow="Invoices" title="Recent Billing Entries" />
          {loading ? <p className="module-note">Loading invoices...</p> : null}
          <DataTable columns={invoiceColumns} rows={invoices} />
        </section>
      </div>
    </div>
  );
};

export default PlatformBillingPage;
