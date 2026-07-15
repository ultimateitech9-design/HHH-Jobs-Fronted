import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FilePlus2,
  Filter,
  LoaderCircle,
  MailCheck,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRoundCheck,
  UsersRound
} from 'lucide-react';
import DateTimeCell from '../../../shared/components/DateTimeCell';
import GooglePagination from '../../../shared/components/GooglePagination';
import useDebouncedValue from '../../../shared/hooks/useDebouncedValue';
import {
  addConsultancyActivity,
  addConsultancyRequirement,
  getConsultancyCase,
  getConsultancyCases,
  getConsultancySummary,
  getConsultancyTeam,
  issueConsultancyInvoice,
  sendConsultancyQuotation,
  updateConsultancyCase,
  updateConsultancyRequirement
} from '../services/consultancyApi';
import './consultancy.css';

const caseStatuses = [
  'new',
  'contacted',
  'meeting_scheduled',
  'meeting_completed',
  'discovery',
  'quotation_sent',
  'negotiation',
  'won',
  'onboarding',
  'active',
  'lost',
  'closed'
];

const requirementStatuses = [
  'submitted',
  'reviewing',
  'sourcing',
  'shortlisted',
  'interviews',
  'fulfilled',
  'on_hold',
  'closed'
];

const tabs = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'requirements', label: 'Requirements', icon: ClipboardList },
  { key: 'commercial', label: 'Commercial', icon: CircleDollarSign },
  { key: 'activity', label: 'Activity', icon: MessageSquareText }
];

const emptyRequirement = {
  title: '',
  department: '',
  openings: '1',
  location: '',
  employmentType: 'full_time',
  experienceMin: '0',
  experienceMax: '0',
  skills: '',
  budgetAmount: '',
  targetDate: '',
  description: ''
};

const newLineItem = () => ({ description: '', quantity: 1, rate: '' });
const emptyCommercial = () => ({
  items: [newLineItem()],
  taxRate: '18',
  currency: 'INR',
  notes: '',
  validUntil: '',
  dueDate: '',
  requirementId: ''
});

const titleCase = (value = '') => String(value || '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: currency || 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const summaryCards = (summary = {}, internal = false) => [
  { label: 'Open cases', value: Number(summary.open ?? summary.total ?? 0), helper: `${summary.new || 0} new`, icon: BriefcaseBusiness },
  { label: 'Meetings', value: Number(summary.meetings || 0), helper: 'Scheduled or completed', icon: CalendarClock },
  { label: 'Proposals', value: Number(summary.proposals || 0), helper: formatCurrency(summary.pipelineValue || 0), icon: FileCheck2 },
  internal
    ? { label: 'Unassigned', value: Number(summary.unassigned || 0), helper: 'Needs an owner', icon: UserRoundCheck }
    : { label: 'Active partnership', value: Number(summary.active || 0), helper: `${summary.onboarding || 0} onboarding`, icon: UsersRound }
];

const LineItemsEditor = ({ value, onChange }) => {
  const updateItem = (index, field, nextValue) => {
    onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: nextValue } : item));
  };

  const removeItem = (index) => {
    const next = value.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : [newLineItem()]);
  };

  return (
    <div className="consultancy-line-items">
      {value.map((item, index) => (
        <div key={`${index}-${value.length}`} className="consultancy-line-item">
          <label>
            Service
            <input value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} placeholder="Recruitment retainer" />
          </label>
          <label>
            Qty
            <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} />
          </label>
          <label>
            Rate
            <input type="number" min="0" step="0.01" value={item.rate} onChange={(event) => updateItem(index, 'rate', event.target.value)} placeholder="25000" />
          </label>
          <button type="button" onClick={() => removeItem(index)} aria-label="Remove line item" title="Remove line item">
            <Trash2 />
          </button>
        </div>
      ))}
      <button type="button" className="consultancy-inline-command" onClick={() => onChange([...value, newLineItem()])}>
        <Plus /> Add line item
      </button>
    </div>
  );
};

const ConsultancyWorkspacePage = ({ audience = 'internal' }) => {
  const internal = audience === 'internal';
  const listRef = useRef(null);
  const detailRequestRef = useRef(0);
  const [summary, setSummary] = useState({});
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [team, setTeam] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [action, setAction] = useState('');
  const [opsForm, setOpsForm] = useState({ status: '', assignedTo: '', meetingAt: '', meetingMode: 'video', meetingLink: '', meetingNotes: '' });
  const [requirementForm, setRequirementForm] = useState(emptyRequirement);
  const [quotationForm, setQuotationForm] = useState(emptyCommercial);
  const [invoiceForm, setInvoiceForm] = useState(emptyCommercial);
  const [noteForm, setNoteForm] = useState({ title: '', notes: '', visibility: 'company' });
  const debouncedSearch = useDebouncedValue(search, 260);

  const loadSummary = useCallback(async () => {
    const payload = await getConsultancySummary();
    setSummary(payload.summary || {});
  }, []);

  const loadCases = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const payload = await getConsultancyCases({
        page,
        limit: 18,
        search: debouncedSearch,
        status: statusFilter,
        assignedTo: internal ? assigneeFilter : ''
      });
      const nextCases = payload.cases || [];
      setCases(nextCases);
      setPagination(payload.pagination || { page, total: nextCases.length, totalPages: 1 });
      setSelectedCaseId((current) => current && nextCases.some((item) => item.id === current)
        ? current
        : nextCases[0]?.id || '');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load consultancy cases.');
      setCases([]);
    } finally {
      setLoadingList(false);
    }
  }, [assigneeFilter, debouncedSearch, internal, page, statusFilter]);

  const loadDetail = useCallback(async (caseId) => {
    if (!caseId) {
      setDetail(null);
      return;
    }
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setLoadingDetail(true);
    try {
      const payload = await getConsultancyCase(caseId);
      if (detailRequestRef.current !== requestId) return;
      setDetail(payload);
      const row = payload.consultancyCase || {};
      setOpsForm({
        status: row.status || 'new',
        assignedTo: row.assigned_to || '',
        meetingAt: toDateTimeLocal(row.meeting_at),
        meetingMode: row.meeting_mode || 'video',
        meetingLink: row.meeting_link || '',
        meetingNotes: row.meeting_notes || ''
      });
    } catch (loadError) {
      if (detailRequestRef.current === requestId) setError(loadError.message || 'Unable to load case details.');
    } finally {
      if (detailRequestRef.current === requestId) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    Promise.allSettled([
      loadSummary(),
      internal ? getConsultancyTeam().then((payload) => setTeam(payload.team || [])) : Promise.resolve()
    ]).then((results) => {
      const failed = results.find((result) => result.status === 'rejected');
      if (failed) setError(failed.reason?.message || 'Some consultancy data could not be loaded.');
    });
  }, [internal, loadSummary]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadDetail(selectedCaseId);
  }, [loadDetail, selectedCaseId]);

  useEffect(() => {
    setPage(1);
  }, [assigneeFilter, debouncedSearch, statusFilter]);

  const refreshAll = useCallback(async (message = '') => {
    await Promise.all([loadSummary(), loadCases(), selectedCaseId ? loadDetail(selectedCaseId) : Promise.resolve()]);
    if (message) setNotice(message);
  }, [loadCases, loadDetail, loadSummary, selectedCaseId]);

  const runAction = async (key, worker, successMessage) => {
    setAction(key);
    setError('');
    setNotice('');
    try {
      await worker();
      await refreshAll(successMessage);
      return true;
    } catch (actionError) {
      setError(actionError.message || 'Action failed.');
      return false;
    } finally {
      setAction('');
    }
  };

  const selectedCase = detail?.consultancyCase || null;
  const requirements = detail?.requirements || [];
  const activities = detail?.activities || [];
  const invoices = detail?.invoices || [];

  const serviceLabels = useMemo(
    () => (selectedCase?.service_types || []).map(titleCase),
    [selectedCase?.service_types]
  );

  const quotationTotal = useMemo(() => quotationForm.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
    0
  ) * (1 + Number(quotationForm.taxRate || 0) / 100), [quotationForm.items, quotationForm.taxRate]);

  const invoiceTotal = useMemo(() => invoiceForm.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
    0
  ) * (1 + Number(invoiceForm.taxRate || 0) / 100), [invoiceForm.items, invoiceForm.taxRate]);

  const updateRequirementField = (field) => (event) => {
    setRequirementForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submitRequirement = async (event) => {
    event.preventDefault();
    if (!selectedCase) return;
    const created = await runAction('requirement-create', () => addConsultancyRequirement(selectedCase.id, {
      ...requirementForm,
      skills: requirementForm.skills.split(',').map((item) => item.trim()).filter(Boolean)
    }), 'Requirement added to the shared MIS.');
    if (created) setRequirementForm(emptyRequirement);
  };

  const saveOperations = async (event) => {
    event.preventDefault();
    if (!selectedCase) return;
    await runAction('case-update', () => updateConsultancyCase(selectedCase.id, opsForm), 'Case operations updated.');
  };

  const sendQuotation = async (event) => {
    event.preventDefault();
    if (!selectedCase) return;
    const sent = await runAction('quotation', () => sendConsultancyQuotation(selectedCase.id, quotationForm), 'Quotation saved and email delivery attempted.');
    if (sent) setQuotationForm(emptyCommercial());
  };

  const issueInvoice = async (event) => {
    event.preventDefault();
    if (!selectedCase) return;
    const sent = await runAction('invoice', () => issueConsultancyInvoice(selectedCase.id, invoiceForm), 'Invoice added to the MIS and email delivery attempted.');
    if (sent) setInvoiceForm(emptyCommercial());
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!selectedCase) return;
    const created = await runAction('activity', () => addConsultancyActivity(selectedCase.id, noteForm), 'Timeline update added.');
    if (created) setNoteForm({ title: '', notes: '', visibility: 'company' });
  };

  return (
    <div className="module-page consultancy-workspace">
      <header className="consultancy-workspace__header">
        <div>
          <p className="consultancy-workspace__eyebrow">{internal ? 'HHH Consultancy Command Desk' : 'Company Hiring MIS'}</p>
          <h1>{internal ? 'From enquiry to active partnership' : 'Your consultancy requirements, in one view'}</h1>
          <p>{internal
            ? 'Own meetings, proposals, requirements, onboarding, and commercial follow-through without losing the company story.'
            : 'Track meetings, quotations, requirements, candidate movement, invoices, and the next committed action.'}</p>
        </div>
        <div className="consultancy-workspace__header-actions">
          {!internal ? <Link to="/consultancy"><Plus /> New enquiry</Link> : null}
          <button type="button" onClick={() => runAction('refresh', async () => {}, 'Consultancy data refreshed.')} disabled={action === 'refresh'} title="Refresh data">
            <RefreshCw className={action === 'refresh' ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error ? <div className="consultancy-workspace__alert consultancy-workspace__alert--error" role="alert">{error}</div> : null}
      {notice ? <div className="consultancy-workspace__alert consultancy-workspace__alert--success" role="status"><Check /> {notice}</div> : null}

      <section className="consultancy-workspace__metrics" aria-label="Consultancy summary">
        {summaryCards(summary, internal).map((card) => (
          <article key={card.label}>
            <card.icon />
            <div><span>{card.label}</span><strong>{card.value}</strong><small>{card.helper}</small></div>
          </article>
        ))}
      </section>

      {internal && team.length ? (
        <section className="consultancy-workspace__team" aria-label="Consultancy team">
          <div><UsersRound /><span>Consultancy team</span></div>
          <ul>
            {team.slice(0, 8).map((member) => (
              <li key={member.id} title={`${member.name || member.email} - ${member.role}`}>
                <span>{String(member.name || member.email || '?').slice(0, 1).toUpperCase()}</span>
                <div><strong>{member.name || member.email}</strong><small>{titleCase(member.role)}</small></div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section ref={listRef} className="consultancy-workspace__filters">
        <label className="consultancy-workspace__search">
          <Search />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, reference, email, or phone" />
        </label>
        <label>
          <Filter />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {caseStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
          </select>
        </label>
        {internal ? (
          <label>
            <UserRoundCheck />
            <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} aria-label="Filter by owner">
              <option value="">All owners</option>
              <option value="unassigned">Unassigned</option>
              {team.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}
            </select>
          </label>
        ) : null}
      </section>

      <div className="consultancy-workspace__body">
        <aside className="consultancy-case-list" aria-label="Consultancy cases">
          <div className="consultancy-case-list__heading">
            <span>{pagination.total || 0} cases</span>
            {loadingList ? <LoaderCircle className="animate-spin" /> : null}
          </div>
          {!loadingList && cases.length === 0 ? (
            <div className="consultancy-case-list__empty">
              <BriefcaseBusiness />
              <h2>{internal ? 'No matching cases' : 'No consultancy case yet'}</h2>
              <p>{internal ? 'Change the filters or wait for a new enquiry.' : 'Start with a hiring brief and the case will appear here.'}</p>
              {!internal ? <Link to="/consultancy">Request consultation <ArrowRight /></Link> : null}
            </div>
          ) : null}
          <div className="consultancy-case-list__items">
            {cases.map((item) => (
              <button
                key={item.id}
                type="button"
                className={selectedCaseId === item.id ? 'is-active' : ''}
                onClick={() => {
                  setSelectedCaseId(item.id);
                  setActiveTab('overview');
                }}
              >
                <span className="consultancy-status" data-status={item.status}>{titleCase(item.status)}</span>
                <strong>{item.company_name}</strong>
                <small>{item.reference_code}</small>
                <div>
                  <span>{item.assigned_name || (internal ? 'Unassigned' : 'Consultancy team')}</span>
                  <DateTimeCell value={item.updated_at || item.created_at} />
                </div>
                <ChevronRight />
              </button>
            ))}
          </div>
          <GooglePagination
            page={page}
            totalPages={pagination.totalPages}
            onChange={setPage}
            scrollTarget={listRef}
            className="consultancy-case-list__pagination"
          />
        </aside>

        <main className="consultancy-case-detail">
          {loadingDetail ? (
            <div className="consultancy-case-detail__loading"><LoaderCircle className="animate-spin" /><span>Loading case timeline...</span></div>
          ) : selectedCase ? (
            <>
              <header className="consultancy-case-detail__header">
                <div>
                  <span className="consultancy-status" data-status={selectedCase.status}>{titleCase(selectedCase.status)}</span>
                  <h2>{selectedCase.company_name}</h2>
                  <p>{selectedCase.reference_code} · {selectedCase.contact_name} · {selectedCase.contact_email}</p>
                </div>
                <div>
                  <span>Pipeline value</span>
                  <strong>{formatCurrency(selectedCase.quotation_total, selectedCase.quotation_currency)}</strong>
                </div>
              </header>

              <nav className="consultancy-case-tabs" aria-label="Case views">
                {tabs.map((tab) => (
                  <button key={tab.key} type="button" className={activeTab === tab.key ? 'is-active' : ''} onClick={() => setActiveTab(tab.key)}>
                    <tab.icon /> {tab.label}
                    {tab.key === 'requirements' ? <span>{requirements.length}</span> : null}
                    {tab.key === 'commercial' ? <span>{invoices.length}</span> : null}
                  </button>
                ))}
              </nav>

              {activeTab === 'overview' ? (
                <div className="consultancy-case-view">
                  <section className="consultancy-case-snapshot">
                    <div><span>Services</span><strong>{serviceLabels.join(', ') || '-'}</strong></div>
                    <div><span>Hiring volume</span><strong>{selectedCase.hiring_volume || '-'}</strong></div>
                    <div><span>Locations</span><strong>{selectedCase.hiring_locations || '-'}</strong></div>
                    <div><span>Owner</span><strong>{selectedCase.assigned_name || 'Pending assignment'}</strong></div>
                    <div><span>Meeting</span><DateTimeCell value={selectedCase.meeting_at} emptyLabel="Not scheduled" /></div>
                    <div><span>Onboarding</span><DateTimeCell value={selectedCase.onboarding_completed_at} emptyLabel="Not completed" /></div>
                  </section>

                  <section className="consultancy-case-brief">
                    <div><h3>Company brief</h3><p>{selectedCase.message || 'No brief was added.'}</p></div>
                    {selectedCase.meeting_link ? (
                      <a href={selectedCase.meeting_link} target="_blank" rel="noreferrer">Open meeting <ArrowRight /></a>
                    ) : null}
                  </section>

                  {internal ? (
                    <form className="consultancy-ops-form" onSubmit={saveOperations}>
                      <div className="consultancy-subsection-heading">
                        <div><CalendarClock /><span>Case operations</span></div>
                        <p>Keep the next decision visible to both teams.</p>
                      </div>
                      <div className="consultancy-ops-form__grid">
                        <label>Status<select value={opsForm.status} onChange={(event) => setOpsForm((current) => ({ ...current, status: event.target.value }))}>{caseStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
                        <label>Owner<select value={opsForm.assignedTo} onChange={(event) => setOpsForm((current) => ({ ...current, assignedTo: event.target.value }))}><option value="">Unassigned</option>{team.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}</select></label>
                        <label>Meeting date & time<input type="datetime-local" value={opsForm.meetingAt} onChange={(event) => setOpsForm((current) => ({ ...current, meetingAt: event.target.value }))} /></label>
                        <label>Meeting mode<select value={opsForm.meetingMode} onChange={(event) => setOpsForm((current) => ({ ...current, meetingMode: event.target.value }))}><option value="video">Video call</option><option value="phone">Phone</option><option value="in_person">In person</option></select></label>
                        <label className="consultancy-ops-form__wide">Meeting link<input type="url" value={opsForm.meetingLink} onChange={(event) => setOpsForm((current) => ({ ...current, meetingLink: event.target.value }))} placeholder="https://meet.google.com/..." /></label>
                        <label className="consultancy-ops-form__wide">Meeting notes<textarea rows="4" value={opsForm.meetingNotes} onChange={(event) => setOpsForm((current) => ({ ...current, meetingNotes: event.target.value }))} placeholder="Outcome, objections, next action..." /></label>
                      </div>
                      <button type="submit" className="consultancy-workspace-command" disabled={action === 'case-update'}>{action === 'case-update' ? <LoaderCircle className="animate-spin" /> : <Check />} Save operations</button>
                    </form>
                  ) : null}
                </div>
              ) : null}

              {activeTab === 'requirements' ? (
                <div className="consultancy-case-view">
                  <form className="consultancy-requirement-form" onSubmit={submitRequirement}>
                    <div className="consultancy-subsection-heading">
                      <div><FilePlus2 /><span>Add a hiring requirement</span></div>
                      <p>Every role gets its own fulfillment counters and status.</p>
                    </div>
                    <div className="consultancy-ops-form__grid">
                      <label>Role title *<input required value={requirementForm.title} onChange={updateRequirementField('title')} placeholder="Senior Sales Executive" /></label>
                      <label>Department<input value={requirementForm.department} onChange={updateRequirementField('department')} placeholder="Revenue" /></label>
                      <label>Openings<input type="number" min="1" required value={requirementForm.openings} onChange={updateRequirementField('openings')} /></label>
                      <label>Employment type<select value={requirementForm.employmentType} onChange={updateRequirementField('employmentType')}><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></label>
                      <label>Min experience<input type="number" min="0" step="0.5" value={requirementForm.experienceMin} onChange={updateRequirementField('experienceMin')} /></label>
                      <label>Max experience<input type="number" min="0" step="0.5" value={requirementForm.experienceMax} onChange={updateRequirementField('experienceMax')} /></label>
                      <label>Target date<input type="date" value={requirementForm.targetDate} onChange={updateRequirementField('targetDate')} /></label>
                      <label>Budget<input type="number" min="0" value={requirementForm.budgetAmount} onChange={updateRequirementField('budgetAmount')} placeholder="Monthly or agreed budget" /></label>
                      <label className="consultancy-ops-form__wide">Location<input value={requirementForm.location} onChange={updateRequirementField('location')} placeholder="State, city, work mode" /></label>
                      <label className="consultancy-ops-form__wide">Skills<input value={requirementForm.skills} onChange={updateRequirementField('skills')} placeholder="Comma separated" /></label>
                      <label className="consultancy-ops-form__wide">Requirement brief *<textarea required minLength="20" rows="5" value={requirementForm.description} onChange={updateRequirementField('description')} placeholder="Responsibilities, evidence required, team context, screening questions..." /></label>
                    </div>
                    <button type="submit" className="consultancy-workspace-command" disabled={action === 'requirement-create'}>{action === 'requirement-create' ? <LoaderCircle className="animate-spin" /> : <Plus />} Add requirement</button>
                  </form>

                  <div className="consultancy-requirements">
                    {requirements.map((requirement) => (
                      <article key={requirement.id}>
                        <header>
                          <div><span className="consultancy-status" data-status={requirement.status}>{titleCase(requirement.status)}</span><h3>{requirement.title}</h3><p>{requirement.openings} opening(s) · {requirement.location || 'Location flexible'}</p></div>
                          <DateTimeCell value={requirement.target_date} emptyLabel="No target date" />
                        </header>
                        <div className="consultancy-requirement-funnel">
                          <span><strong>{requirement.candidates_submitted || 0}</strong>Submitted</span>
                          <span><strong>{requirement.candidates_shortlisted || 0}</strong>Shortlisted</span>
                          <span><strong>{requirement.candidates_interviewed || 0}</strong>Interviewed</span>
                          <span><strong>{requirement.candidates_hired || 0}</strong>Hired</span>
                        </div>
                        <p>{requirement.progress_notes || requirement.description}</p>
                        {internal ? (
                          <RequirementProgressForm
                            requirement={requirement}
                            busy={action === `requirement-${requirement.id}`}
                            onSave={(payload) => runAction(`requirement-${requirement.id}`, () => updateConsultancyRequirement(requirement.id, payload), 'Fulfillment progress updated.')}
                          />
                        ) : null}
                      </article>
                    ))}
                    {!requirements.length ? <p className="consultancy-empty-note">No hiring requirements have been added to this case.</p> : null}
                  </div>
                </div>
              ) : null}

              {activeTab === 'commercial' ? (
                <div className="consultancy-case-view">
                  {selectedCase.quotation_number ? (
                    <section className="consultancy-commercial-summary">
                      <div><MailCheck /><span>Latest quotation</span><strong>{selectedCase.quotation_number}</strong></div>
                      <div><span>Total</span><strong>{formatCurrency(selectedCase.quotation_total, selectedCase.quotation_currency)}</strong></div>
                      <div><span>Sent</span><DateTimeCell value={selectedCase.quotation_sent_at} /></div>
                      <div><span>Valid until</span><DateTimeCell value={selectedCase.quotation_valid_until} /></div>
                    </section>
                  ) : null}

                  {internal ? (
                    <div className="consultancy-commercial-forms">
                      <form onSubmit={sendQuotation}>
                        <div className="consultancy-subsection-heading"><div><FileCheck2 /><span>Prepare quotation</span></div><p>Email and MIS delivery</p></div>
                        <LineItemsEditor value={quotationForm.items} onChange={(items) => setQuotationForm((current) => ({ ...current, items }))} />
                        <CommercialFields value={quotationForm} onChange={setQuotationForm} mode="quotation" requirements={requirements} />
                        <div className="consultancy-commercial-total"><span>Estimated total</span><strong>{formatCurrency(quotationTotal, quotationForm.currency)}</strong></div>
                        <button type="submit" className="consultancy-workspace-command" disabled={action === 'quotation'}>{action === 'quotation' ? <LoaderCircle className="animate-spin" /> : <Send />} Save and email quotation</button>
                      </form>
                      <form onSubmit={issueInvoice}>
                        <div className="consultancy-subsection-heading"><div><BadgeIndianRupee /><span>Issue invoice</span></div><p>Accounts register, email, and MIS</p></div>
                        <LineItemsEditor value={invoiceForm.items} onChange={(items) => setInvoiceForm((current) => ({ ...current, items }))} />
                        <CommercialFields value={invoiceForm} onChange={setInvoiceForm} mode="invoice" requirements={requirements} />
                        <div className="consultancy-commercial-total"><span>Invoice total</span><strong>{formatCurrency(invoiceTotal, invoiceForm.currency)}</strong></div>
                        <button type="submit" className="consultancy-workspace-command" disabled={action === 'invoice'}>{action === 'invoice' ? <LoaderCircle className="animate-spin" /> : <Send />} Issue and email invoice</button>
                      </form>
                    </div>
                  ) : null}

                  <section className="consultancy-invoices">
                    <div className="consultancy-subsection-heading"><div><CircleDollarSign /><span>Invoice register</span></div><p>{invoices.length} document(s)</p></div>
                    {invoices.map((invoice) => (
                      <article key={invoice.id}>
                        <div><span className="consultancy-status" data-status={invoice.status}>{titleCase(invoice.status)}</span><strong>{invoice.invoice_number}</strong><small>{invoice.sent_at ? 'Email sent' : 'Saved in MIS'}</small></div>
                        <div><span>Due</span><DateTimeCell value={invoice.due_date} /></div>
                        <strong>{formatCurrency(invoice.total, invoice.currency)}</strong>
                      </article>
                    ))}
                    {!invoices.length ? <p className="consultancy-empty-note">No invoice has been issued for this case.</p> : null}
                  </section>
                </div>
              ) : null}

              {activeTab === 'activity' ? (
                <div className="consultancy-case-view">
                  <form className="consultancy-note-form" onSubmit={addNote}>
                    <div className="consultancy-subsection-heading"><div><MessageSquareText /><span>Add timeline update</span></div><p>Keep context attached to the case.</p></div>
                    <div className="consultancy-note-form__row">
                      <label>Title<input value={noteForm.title} onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))} placeholder="Follow-up outcome" /></label>
                      {internal ? <label>Visibility<select value={noteForm.visibility} onChange={(event) => setNoteForm((current) => ({ ...current, visibility: event.target.value }))}><option value="company">Company + team</option><option value="internal">Internal only</option></select></label> : null}
                    </div>
                    <label>Notes<textarea required rows="4" value={noteForm.notes} onChange={(event) => setNoteForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Decision, blocker, owner, and next action..." /></label>
                    <button type="submit" className="consultancy-workspace-command" disabled={action === 'activity'}>{action === 'activity' ? <LoaderCircle className="animate-spin" /> : <Plus />} Add update</button>
                  </form>
                  <div className="consultancy-timeline">
                    {activities.map((activity) => (
                      <article key={activity.id}>
                        <span className="consultancy-timeline__dot" />
                        <div><header><strong>{activity.title}</strong><DateTimeCell value={activity.occurred_at} /></header><p>{activity.notes || titleCase(activity.activity_type)}</p><small>{activity.actor_name || titleCase(activity.actor_role || 'System')} · {activity.visibility === 'company' ? 'Shared' : 'Internal'}</small></div>
                      </article>
                    ))}
                    {!activities.length ? <p className="consultancy-empty-note">No timeline updates yet.</p> : null}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="consultancy-case-detail__empty"><BriefcaseBusiness /><h2>Select a consultancy case</h2><p>The complete requirement, meeting, commercial, and fulfillment history will appear here.</p></div>
          )}
        </main>
      </div>
    </div>
  );
};

const RequirementProgressForm = ({ requirement, busy, onSave }) => {
  const [form, setForm] = useState({
    status: requirement.status,
    candidatesSubmitted: requirement.candidates_submitted || 0,
    candidatesShortlisted: requirement.candidates_shortlisted || 0,
    candidatesInterviewed: requirement.candidates_interviewed || 0,
    candidatesHired: requirement.candidates_hired || 0,
    progressNotes: requirement.progress_notes || ''
  });

  useEffect(() => {
    setForm({
      status: requirement.status,
      candidatesSubmitted: requirement.candidates_submitted || 0,
      candidatesShortlisted: requirement.candidates_shortlisted || 0,
      candidatesInterviewed: requirement.candidates_interviewed || 0,
      candidatesHired: requirement.candidates_hired || 0,
      progressNotes: requirement.progress_notes || ''
    });
  }, [requirement]);

  return (
    <form className="consultancy-progress-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <label>Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>{requirementStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
      {['Submitted', 'Shortlisted', 'Interviewed', 'Hired'].map((label) => {
        const key = `candidates${label}`;
        return <label key={key}>{label}<input type="number" min="0" value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></label>;
      })}
      <label className="consultancy-progress-form__notes">Progress notes<input value={form.progressNotes} onChange={(event) => setForm((current) => ({ ...current, progressNotes: event.target.value }))} placeholder="Current progress and next action" /></label>
      <button type="submit" disabled={busy} title="Save fulfillment progress">{busy ? <LoaderCircle className="animate-spin" /> : <Check />}</button>
    </form>
  );
};

const CommercialFields = ({ value, onChange, mode, requirements }) => (
  <div className="consultancy-commercial-fields">
    <label>Tax %<input type="number" min="0" max="100" step="0.01" value={value.taxRate} onChange={(event) => onChange((current) => ({ ...current, taxRate: event.target.value }))} /></label>
    <label>Currency<select value={value.currency} onChange={(event) => onChange((current) => ({ ...current, currency: event.target.value }))}><option value="INR">INR</option><option value="USD">USD</option></select></label>
    {mode === 'quotation' ? (
      <label>Valid until<input type="date" value={value.validUntil} onChange={(event) => onChange((current) => ({ ...current, validUntil: event.target.value }))} /></label>
    ) : (
      <label>Due date<input type="date" value={value.dueDate} onChange={(event) => onChange((current) => ({ ...current, dueDate: event.target.value }))} /></label>
    )}
    {mode === 'invoice' ? (
      <label>Requirement<select value={value.requirementId} onChange={(event) => onChange((current) => ({ ...current, requirementId: event.target.value }))}><option value="">General invoice</option>{requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.title}</option>)}</select></label>
    ) : null}
    <label className="consultancy-commercial-fields__notes">Notes<input value={value.notes} onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))} placeholder="Commercial terms or payment note" /></label>
  </div>
);

export default ConsultancyWorkspacePage;
