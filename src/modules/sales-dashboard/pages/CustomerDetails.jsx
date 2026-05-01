import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import { getCustomerDetails } from '../services/customerApi';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDateTime } from '../utils/dateFormat';

const CustomerDetails = () => {
  const { customerId: customerIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const customerId = customerIdParam || searchParams.get('customerId') || searchParams.get('id') || '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getCustomerDetails(customerId);
      setCustomer(response.data || null);
      setError(response.error || '');
      setLoading(false);
    };
    load();
  }, [customerId]);

  return (
    <div className="module-page module-page--platform">
      <SectionHeader eyebrow="Sales" title="Customer Details" subtitle="View ownership, account value, status, and open order context for a selected customer." />
      {error ? <p className="form-error">{error}</p> : null}
      {!loading && !customerId ? (
        <p className="module-note">No customer ID was provided. Showing the first available customer from the queue.</p>
      ) : null}
      {loading ? <p className="module-note">Loading customer details...</p> : null}
      {!loading && customer ? (
        <section className="panel-card">
          <div className="dash-list">
            <li><strong>Customer ID</strong><span>{customer.id}</span></li>
            <li><strong>Company</strong><span>{customer.company}</span></li>
            <li><strong>Contact</strong><span>{customer.contactName}</span></li>
            <li><strong>Email</strong><span>{customer.email}</span></li>
            <li><strong>Phone</strong><span>{customer.phone}</span></li>
            <li><strong>Audience</strong><span>{customer.audienceRole || '-'}</span></li>
            <li><strong>Plan</strong><span>{customer.plan}</span></li>
            <li><strong>Subscription ID</strong><span>{customer.subscriptionId || '-'}</span></li>
            <li><strong>Lifetime Value</strong><span>{formatCurrency(customer.lifetimeValue)}</span></li>
            <li><strong>Status</strong><span><StatusPill value={customer.status} /></span></li>
            <li><strong>Created</strong><span>{formatDateTime(customer.createdAt)}</span></li>
          </div>
        </section>
      ) : !loading ? (
        <section className="panel-card">
          <p className="text-sm text-slate-500">No customer details are available for the selected customer.</p>
        </section>
      ) : null}
    </div>
  );
};

export default CustomerDetails;
