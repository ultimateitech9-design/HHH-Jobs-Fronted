import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import { getCurrentUser } from '../../../utils/auth';
import FilterBar from '../components/FilterBar';
import LeadTable from '../components/LeadTable';
import SalesStatCards from '../components/SalesStatCards';
import { getLeads, syncCommercialLeads } from '../services/leadApi';
import { formatCompactCurrency } from '../utils/currencyFormat';

const Leads = () => {
  const currentUser = getCurrentUser();
  const canSync = ['admin', 'super_admin'].includes(String(currentUser?.role || '').toLowerCase());
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({ stage: '', targetRole: '', onboardingStatus: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLeads = async (nextFilters = filters) => {
    setLoading(true);
    const response = await getLeads(nextFilters);
    setLeads(response.data || []);
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    loadLeads(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const search = String(filters.search || '').toLowerCase();
    return leads.filter((item) => {
      const matchesStage = !filters.stage || String(item.stage || '').toLowerCase() === filters.stage;
      const matchesRole = !filters.targetRole || String(item.targetRole || '').toLowerCase() === filters.targetRole;
      const matchesOnboarding = !filters.onboardingStatus || String(item.onboardingStatus || '').toLowerCase() === filters.onboardingStatus;
      const matchesSearch = !search || `${item.company} ${item.contactName} ${item.email}`.toLowerCase().includes(search);
      return matchesStage && matchesRole && matchesOnboarding && matchesSearch;
    });
  }, [leads, filters]);

  const cards = useMemo(() => [
    { label: 'Visible Leads', value: String(rows.length), helper: 'Current lead queue', tone: 'info' },
    { label: 'Qualified', value: String(rows.filter((item) => item.stage === 'qualified').length), helper: 'Ready for proposal', tone: 'success' },
    { label: 'Proposals', value: String(rows.filter((item) => item.stage === 'proposal').length), helper: 'Commercial follow-up', tone: 'warning' },
    { label: 'Expected Value', value: formatCompactCurrency(rows.reduce((sum, item) => sum + Number(item.expectedValue || 0), 0)), helper: 'Potential pipeline value', tone: 'default' }
  ], [rows]);

  const handleSync = async () => {
    setError('');
    setMessage('');
    try {
      const response = await syncCommercialLeads(['hr', 'campus_connect', 'student']);
      setMessage(`Commercial leads synced: ${response?.syncedCount || 0}`);
      await loadLeads(filters);
    } catch (syncError) {
      setError(String(syncError.message || 'Unable to sync leads.'));
    }
  };

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow="Sales" title="Leads" subtitle="Manage inbound sales opportunities, stage progression, and expected revenue potential." />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="module-note">{message}</p> : null}
      <SalesStatCards cards={cards} />
      <section className="panel-card">
        {canSync ? (
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={handleSync} className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100">
              Sync Commercial Leads
            </button>
          </div>
        ) : null}
        <FilterBar
          filters={[
            { key: 'stage', label: 'Stage', type: 'select', options: [{ value: '', label: 'All' }, { value: 'new', label: 'New' }, { value: 'qualified', label: 'Qualified' }, { value: 'proposal', label: 'Proposal' }] },
            { key: 'targetRole', label: 'Audience', type: 'select', options: [{ value: '', label: 'All' }, { value: 'hr', label: 'HR' }, { value: 'campus_connect', label: 'Campus Connect' }, { value: 'student', label: 'Student' }] },
            { key: 'onboardingStatus', label: 'Onboarding', type: 'select', options: [{ value: '', label: 'All' }, { value: 'prospect', label: 'Prospect' }, { value: 'negotiation', label: 'Negotiation' }, { value: 'active', label: 'Active' }, { value: 'onboarding', label: 'Onboarding' }] },
            { key: 'search', label: 'Search', type: 'text', placeholder: 'Company, contact, email', fullWidth: true }
          ]}
          values={filters}
          onChange={(key, value) => {
            const nextFilters = { ...filters, [key]: value };
            setFilters(nextFilters);
            loadLeads(nextFilters);
          }}
        />
        {loading ? <p className="module-note">Loading leads...</p> : null}
        <LeadTable rows={rows} />
      </section>
    </div>
  );
};

export default Leads;
