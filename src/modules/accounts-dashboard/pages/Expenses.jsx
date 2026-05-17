import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../shared/components/DataTable';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import ExpenseForm from '../components/ExpenseForm';
import RevenueCards from '../components/RevenueCards';
import { createExpense, getExpenses } from '../services/accountsApi';
import { formatCurrency } from '../utils/currencyFormat';
import { formatDate } from '../utils/dateFormat';

const initialDraft = {
  title: '',
  category: '',
  department: '',
  amount: '',
  spentOn: '',
  status: 'pending',
  note: ''
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    const load = async () => {
      const response = await getExpenses();
      setExpenses(response.data || []);
      setError(response.error || '');
      setLoading(false);
    };

    load();
  }, []);

  const cards = useMemo(() => {
    const approved = expenses.filter((item) => item.status === 'approved');
    const pending = expenses.filter((item) => item.status === 'pending');

    return [
      { label: 'Total Expenses', value: formatCurrency(expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: 'All visible expense rows', tone: 'info' },
      { label: 'Approved Spend', value: formatCurrency(approved.reduce((sum, item) => sum + Number(item.amount || 0), 0)), helper: `${approved.length} approved items`, tone: 'success' },
      { label: 'Pending Approvals', value: String(pending.length), helper: 'Awaiting review', tone: 'warning' },
      { label: 'Departments', value: String(new Set(expenses.map((item) => item.department)).size), helper: 'Cost centers in use', tone: 'default' }
    ];
  }, [expenses]);

  const columns = [
    { key: 'title', label: 'Expense' },
    { key: 'category', label: 'Category' },
    { key: 'department', label: 'Department' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'pending'} />
    },
    {
      key: 'spentOn',
      label: 'Spent On',
      render: (value) => formatDate(value)
    },
    { key: 'note', label: 'Note' }
  ];

  const handleDraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.title || !draft.amount) {
      setError('Expense title and amount are required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      ...draft,
      amount: Number(draft.amount || 0)
    };

    try {
      const saved = await createExpense(payload);
      setExpenses((current) => [{ id: `EXP-${Date.now()}`, ...payload, ...saved }, ...current]);
      setMessage('Expense added successfully.');
      setDraft(initialDraft);
    } catch (actionError) {
      setError(actionError.message || 'Unable to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page module-page--platform">
      <SectionHeader
        eyebrow="Accounts"
        title="Expenses"
        subtitle="Track spend across growth, infrastructure, operations, and internal support for HHH Jobs."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      <RevenueCards cards={cards} />

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Create expense entry</h2>
            <p className="admin-ops-panel-note">Record operational spend with department, category, amount, and approval state.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <ExpenseForm
            draft={draft}
            saving={saving}
            onChange={handleDraftChange}
            onSubmit={handleSubmit}
            onReset={() => setDraft(initialDraft)}
          />
        </div>
      </section>

      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">Expense register</h2>
            <p className="admin-ops-panel-note">Audit spend lines by department, category, approval state, and spend date.</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          {loading ? <p className="module-note">Loading expenses...</p> : null}
          <DataTable columns={columns} rows={expenses} searchable pagination itemsPerPage={8} searchPlaceholder="Search expense, category, department, note, or status" />
        </div>
      </section>
    </div>
  );
};

export default Expenses;
