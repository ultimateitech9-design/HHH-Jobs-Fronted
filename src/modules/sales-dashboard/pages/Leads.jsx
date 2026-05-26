import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import FilterBar from '../components/FilterBar';
import LeadTable from '../components/LeadTable';
import SalesStatCards from '../components/SalesStatCards';
import { getLeads, markLeadCalled, syncCommercialLeads } from '../services/leadApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({ stage: '', targetRole: '', onboardingStatus: '', search: '', page: 1, limit: 100 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [leadMeta, setLeadMeta] = useState({
    total: 0,
    page: 1,
    limit: 100,
    summary: { totalLeads: 0, planTaken: 0, planPending: 0, expectedValue: 0 }
  });

  const loadLeads = async (nextFilters = filters, { hydrateIfEmpty = false, silent = false } = {}) => {
    if (!silent) setLoading(true);
    const response = await getLeads(nextFilters);
    let nextData = response.data || { leads: [], total: 0, page: 1, limit: 100, summary: { totalLeads: 0, planTaken: 0, planPending: 0, expectedValue: 0 } };
    let nextLeads = nextData.leads || [];
    let nextError = response.error || '';

    if (hydrateIfEmpty && nextLeads.length === 0 && !nextError) {
      try {
        const syncResponse = await syncCommercialLeads(['hr', 'campus_connect', 'student']);
        setMessage(`Commercial data synced: ${syncResponse?.syncedCount || 0} new leads, ${syncResponse?.assignedExistingCount || 0} assigned leads, ${syncResponse?.customerSyncedCount || 0} customers`);
        const refreshed = await getLeads(nextFilters);
        nextData = refreshed.data || nextData;
        nextLeads = nextData.leads || [];
        nextError = refreshed.error || '';
      } catch (syncError) {
        nextError = String(syncError.message || 'Unable to sync commercial data.');
      }
    }

    setLeads(nextLeads);
    setLeadMeta(nextData);
    setError(nextError);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadLeads(filters, { hydrateIfEmpty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const search = String(filters.search || '').toLowerCase();
    return leads.filter((item) => {
      const matchesStage = !filters.stage || String(item.stage || '').toLowerCase() === filters.stage;
      const matchesRole = !filters.targetRole || String(item.targetRole || '').toLowerCase() === filters.targetRole;
      const matchesOnboarding = !filters.onboardingStatus || String(item.onboardingStatus || '').toLowerCase() === filters.onboardingStatus;
      const matchesSearch = !search || `${item.company} ${item.contactName} ${item.email} ${item.phone} ${item.zone} ${item.location}`.toLowerCase().includes(search);
      return matchesStage && matchesRole && matchesOnboarding && matchesSearch;
    });
  }, [leads, filters]);

  const summary = leadMeta.summary || {};
  const totalPages = Math.max(1, Math.ceil((leadMeta.total || 0) / (leadMeta.limit || 100)));
  const cards = useMemo(() => [
    { label: 'Total Leads', value: String(summary.totalLeads || leadMeta.total || rows.length), helper: `${rows.length} loaded on this page`, tone: 'info' },
    { label: 'Plan Taken', value: String(summary.planTaken || 0), helper: 'Client onboarded', tone: 'success' },
    { label: 'Plan Pending', value: String(summary.planPending || 0), helper: 'Send plan or coupon', tone: 'warning' },
    { label: 'Expected Value', value: formatCompactCurrency(summary.expectedValue || 0), helper: 'Potential pipeline value', tone: 'default' }
  ], [leadMeta.total, rows.length, summary]);

  const handleMarkCalled = async (lead, nextFollowupAt) => {
    setError('');
    setMessage('');
    if (!nextFollowupAt) {
      setError('Select a future follow-up date and time before logging the call.');
      return;
    }

    setUpdatingId(lead.id);
    try {
      const updatedLead = await markLeadCalled(lead.id, {
        next_followup_at: nextFollowupAt
      });
      setLeads((current) => current.map((item) => (item.id === lead.id ? updatedLead : item)));
      setMessage(`Call logged for ${updatedLead.contactName || updatedLead.company || 'lead'} and next follow-up scheduled.`);
      await loadLeads(filters, { silent: true });
    } catch (updateError) {
      setError(String(updateError.message || 'Unable to mark lead as called.'));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow="Sales" title="Leads" subtitle="Manage assigned HR, campus, and student leads by plan status, owner, zone, and next follow-up." />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="module-note">{message}</p> : null}
      <SalesStatCards cards={cards} />
      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Commercial lead pipeline</h2>
            <p className="admin-ops-panel-note">Review audience mix, stage progression, zone, owner, and onboarding readiness from one list.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <FilterBar
            filters={[
              { key: 'stage', label: 'Stage', type: 'select', options: [{ value: '', label: 'All' }, { value: 'new', label: 'New' }, { value: 'qualified', label: 'Qualified' }, { value: 'proposal', label: 'Proposal' }] },
              { key: 'targetRole', label: 'Audience', type: 'select', options: [{ value: '', label: 'All' }, { value: 'hr', label: 'HR' }, { value: 'campus_connect', label: 'Campus Connect' }, { value: 'student', label: 'Student' }] },
              { key: 'onboardingStatus', label: 'Onboarding', type: 'select', options: [{ value: '', label: 'All' }, { value: 'prospect', label: 'Prospect' }, { value: 'negotiation', label: 'Negotiation' }, { value: 'active', label: 'Active' }, { value: 'onboarding', label: 'Onboarding' }] },
              { key: 'search', label: 'Search', type: 'text', placeholder: 'Company, contact, email, zone', fullWidth: true }
            ]}
            values={filters}
            onChange={(key, value) => {
              const nextFilters = { ...filters, [key]: value };
              nextFilters.page = 1;
              setFilters(nextFilters);
              loadLeads(nextFilters);
            }}
          />
          {loading ? <p className="module-note">Loading leads...</p> : null}
          <LeadTable rows={rows} onMarkCalled={handleMarkCalled} updatingId={updatingId} />
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold">
              Showing {rows.length} of {leadMeta.total || rows.length} leads · Page {leadMeta.page || 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={(leadMeta.page || 1) <= 1 || loading}
                onClick={() => {
                  const nextFilters = { ...filters, page: Math.max(1, (leadMeta.page || 1) - 1), limit: leadMeta.limit || 100 };
                  setFilters(nextFilters);
                  loadLeads(nextFilters);
                }}
                className="rounded-full border border-slate-200 px-4 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={(leadMeta.page || 1) >= totalPages || loading}
                onClick={() => {
                  const nextFilters = { ...filters, page: (leadMeta.page || 1) + 1, limit: leadMeta.limit || 100 };
                  setFilters(nextFilters);
                  loadLeads(nextFilters);
                }}
                className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Leads;
