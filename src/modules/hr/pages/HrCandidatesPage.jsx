import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiCheckSquare,
  FiEye,
  FiFilter,
  FiFileText,
  FiLayers,
  FiLock,
  FiMapPin,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiStar,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import {
  addToShortlist,
  createHrCandidateMessageTemplate,
  deleteHrCandidateMessageTemplate,
  getHrCandidateMessageTemplates,
  removeFromShortlist,
  searchHrCandidatesV2,
  sendBulkCandidateInterest,
  sendCandidateInterest
} from '../services/hrApi';

const EMPTY_FILTERS = {
  search: '',
  skills: '',
  location: '',
  experience: '',
  minCgpa: '',
  degree: '',
  branch: '',
  college: '',
  batchYear: '',
  availableOnly: false
};

const EMPTY_TEMPLATE_FORM = {
  name: '',
  message: ''
};

const statusStyles = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-red-200 bg-red-50 text-red-600'
};

const summaryCard = 'rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_8px_30px_-22px_rgba(15,23,42,0.18)]';
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100';

const renderTemplateMessage = (template, candidate) => {
  if (!template?.message) return '';

  return template.message
    .replaceAll('{{candidateName}}', candidate?.user?.name || 'there')
    .replaceAll('{{companyName}}', 'our company')
    .replaceAll('{{collegeName}}', candidate?.education?.college || 'your college');
};

export default function HrCandidatesPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [access, setAccess] = useState({ hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
  const [summary, setSummary] = useState({ total: 0, blurred: 0, connected: 0, availableNow: 0 });
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [actionState, setActionState] = useState({});
  const [interestModal, setInterestModal] = useState(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestTemplateId, setInterestTemplateId] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTemplateId, setBulkTemplateId] = useState('');

  const runSearch = async (activeFilters = filters) => {
    setLoading(true);
    setError('');
    const response = await searchHrCandidatesV2(activeFilters);
    const payload = response.data || {};
    setAccess(payload.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
    setSummary(payload.summary || { total: 0, blurred: 0, connected: 0, availableNow: 0 });
    setCandidates(payload.candidates || []);
    setError(response.error || '');
    setLoading(false);
    setSelectedIds(new Set());
  };

  const loadTemplates = async () => {
    const response = await getHrCandidateMessageTemplates();
    setTemplates(response.data?.templates || []);
    if (response.data?.access) setAccess((current) => ({ ...current, ...response.data.access }));
  };

  useEffect(() => {
    runSearch(EMPTY_FILTERS);
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([key, value]) => (key === 'availableOnly' ? value : String(value).trim())).length,
    [filters]
  );

  const selectableCandidates = candidates.filter((candidate) => !candidate.crm?.interestStatus && candidate.access?.canSendInterest);
  const selectedCount = selectedIds.size;

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const handleSelect = (candidateId) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableCandidates.length) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(selectableCandidates.map((candidate) => candidate.id)));
  };

  const submitInterest = async (candidate) => {
    if (!candidate?.id) return;
    setActionState((current) => ({ ...current, [candidate.id]: 'sending' }));

    try {
      await sendCandidateInterest(candidate.id, {
        message: interestMessage,
        templateId: interestTemplateId,
        campaignLabel: 'candidate_database_single'
      });

      setCandidates((current) =>
        current.map((item) =>
          item.id === candidate.id
            ? { ...item, crm: { ...item.crm, interestStatus: 'pending' } }
            : item
        )
      );
      setInterestModal(null);
      setInterestMessage('');
      setInterestTemplateId('');
    } catch (submitError) {
      setError(submitError.message || 'Unable to send interest.');
    } finally {
      setActionState((current) => ({ ...current, [candidate.id]: '' }));
    }
  };

  const submitBulkInterest = async () => {
    if (selectedIds.size === 0) return;
    setActionState((current) => ({ ...current, bulk: 'sending' }));

    try {
      await sendBulkCandidateInterest([...selectedIds], {
        message: bulkMessage,
        templateId: bulkTemplateId,
        campaignLabel: 'candidate_database_bulk'
      });

      setCandidates((current) =>
        current.map((item) =>
          selectedIds.has(item.id)
            ? { ...item, crm: { ...item.crm, interestStatus: 'pending' } }
            : item
        )
      );
      setSelectedIds(new Set());
      setBulkOpen(false);
      setBulkMessage('');
      setBulkTemplateId('');
    } catch (submitError) {
      setError(submitError.message || 'Unable to send bulk interest.');
    } finally {
      setActionState((current) => ({ ...current, bulk: '' }));
    }
  };

  const toggleShortlist = async (candidate) => {
    if (!candidate?.id) return;
    setActionState((current) => ({ ...current, [`shortlist_${candidate.id}`]: 'saving' }));

    try {
      if (candidate.crm?.isShortlisted) {
        await removeFromShortlist(candidate.id);
      } else {
        await addToShortlist(candidate.id);
      }

      setCandidates((current) =>
        current.map((item) =>
          item.id === candidate.id
            ? { ...item, crm: { ...item.crm, isShortlisted: !item.crm?.isShortlisted } }
            : item
        )
      );
    } catch (shortlistError) {
      setError(shortlistError.message || 'Unable to update shortlist.');
    } finally {
      setActionState((current) => ({ ...current, [`shortlist_${candidate.id}`]: '' }));
    }
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.message.trim()) return;
    setTemplateSaving(true);

    try {
      const template = await createHrCandidateMessageTemplate(templateForm);
      setTemplates((current) => [template, ...current]);
      setTemplateForm(EMPTY_TEMPLATE_FORM);
    } catch (templateError) {
      setError(templateError.message || 'Unable to save template.');
    } finally {
      setTemplateSaving(false);
    }
  };

  const removeTemplate = async (template) => {
    if (!template?.id || template.isSystemTemplate) return;
    setActionState((current) => ({ ...current, [`template_${template.id}`]: 'deleting' }));

    try {
      await deleteHrCandidateMessageTemplate(template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
    } catch (templateError) {
      setError(templateError.message || 'Unable to delete template.');
    } finally {
      setActionState((current) => ({ ...current, [`template_${template.id}`]: '' }));
    }
  };

  const applyTemplateToSingle = (templateId) => {
    setInterestTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    setInterestMessage(template && interestModal ? renderTemplateMessage(template, interestModal) : '');
  };

  const applyTemplateToBulk = (templateId) => {
    setBulkTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    setBulkMessage(template ? template.message : '');
  };

  return (
    <div className="space-y-6 pb-12">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.75rem] border border-slate-100 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_60%,#f97316_140%)] p-6 text-white shadow-[0_25px_60px_-35px_rgba(15,23,42,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-sky-100">Proactive sourcing</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Candidate Database</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200">
                Search discoverable student profiles by skills, CGPA, location, college, and batch year. Paid plans unlock full profile visibility and direct outreach.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">Current access</p>
              <p className="mt-1 text-xl font-black">{access.activePlanName || 'Free'}</p>
              <p className="mt-1 text-xs text-slate-200">
                {access.hasPaidAccess ? 'Full candidate profiles unlocked' : 'Blurred preview mode'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FiUsers} label="Profiles" value={summary.total} helper="Matching search filters" />
            <StatCard icon={FiLock} label="Blurred" value={summary.blurred} helper="Upgrade to unlock" />
            <StatCard icon={FiCheckCircle} label="Connected" value={summary.connected} helper="Accepted interests" />
            <StatCard icon={FiBriefcase} label="Available now" value={summary.availableNow} helper="Ready-to-hire candidates" />
          </div>
        </div>

        <aside className={`${summaryCard} space-y-4`}>
          <div>
            <h2 className="text-lg font-extrabold text-navy">Message templates</h2>
            <p className="mt-1 text-sm text-slate-500">Save reusable outreach copy for single or bulk sourcing.</p>
          </div>

          <div className="space-y-3">
            <input
              value={templateForm.name}
              onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Template name"
              className={inputClass}
            />
            <textarea
              rows={4}
              value={templateForm.message}
              onChange={(event) => setTemplateForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Hi {{candidateName}}, your profile stood out..."
              className={`${inputClass} resize-none`}
            />
            <button
              type="button"
              disabled={templateSaving}
              onClick={saveTemplate}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef5c30] disabled:opacity-60"
            >
              {templateSaving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiMessageSquare size={14} />}
              Save template
            </button>
          </div>

          <div className="space-y-2">
            {templates.slice(0, 6).map((template) => (
              <div key={template.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-navy">{template.name}</p>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-3">{template.message}</p>
                  </div>
                  {!template.isSystemTemplate ? (
                    <button
                      type="button"
                      disabled={actionState[`template_${template.id}`] === 'deleting'}
                      onClick={() => removeTemplate(template)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">System</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {!access.hasPaidAccess ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>
              You are seeing blurred candidate previews. Upgrade to a paid hiring plan to unlock full profiles, send direct interest requests, and access resumes after candidate acceptance.
            </p>
          </div>
          <Link
            to="/portal/hr/jobs"
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 font-bold text-white transition hover:bg-amber-700"
          >
            <FiLayers size={14} />
            Upgrade plan
          </Link>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

      <section className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className={`${summaryCard} space-y-4 lg:sticky lg:top-24 lg:self-start`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy">
              <FiFilter size={16} />
              Search filters
            </h2>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  runSearch(EMPTY_FILTERS);
                }}
                className="text-xs font-bold text-slate-500 hover:text-brand-600"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <Field label="Keyword" value={filters.search} onChange={(value) => updateFilter('search', value)} placeholder="React developer, final year..." />
            <Field label="Skills" value={filters.skills} onChange={(value) => updateFilter('skills', value)} placeholder="React, JavaScript, REST APIs" />
            <Field label="Location" value={filters.location} onChange={(value) => updateFilter('location', value)} placeholder="Mumbai, Remote" />
            <Field label="Experience" value={filters.experience} onChange={(value) => updateFilter('experience', value)} placeholder="Fresher, internship" />
            <Field label="Degree" value={filters.degree} onChange={(value) => updateFilter('degree', value)} placeholder="B.Tech, BCA" />
            <Field label="Branch" value={filters.branch} onChange={(value) => updateFilter('branch', value)} placeholder="CSE, IT, ECE" />
            <Field label="College" value={filters.college} onChange={(value) => updateFilter('college', value)} placeholder="College name" />
            <Field label="Batch year" value={filters.batchYear} onChange={(value) => updateFilter('batchYear', value)} placeholder="2026" />
            <Field label="Min CGPA" type="number" value={filters.minCgpa} onChange={(value) => updateFilter('minCgpa', value)} placeholder="7.5" />

            <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(event) => updateFilter('availableOnly', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              <span className="text-sm font-semibold text-slate-700">Available to hire only</span>
            </label>

            <button
              type="button"
              onClick={() => runSearch(filters)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-500"
            >
              {loading ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSearch size={14} />}
              Search candidates
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          <div className={`${summaryCard} flex flex-wrap items-center gap-3`}>
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={!access.hasPaidAccess || selectableCandidates.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheckSquare size={14} />
              {selectedCount === selectableCandidates.length && selectableCandidates.length > 0
                ? 'Deselect all'
                : `Select all (${selectableCandidates.length})`}
            </button>

            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              disabled={!access.hasPaidAccess || selectedCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-[#2d5bff] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2449d8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSend size={14} />
              Send bulk interest
            </button>

            <span className="ml-auto text-sm font-semibold text-slate-500">
              {selectedCount} selected
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-72 animate-pulse rounded-[1.75rem] border border-slate-100 bg-white" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className={`${summaryCard} flex min-h-[320px] flex-col items-center justify-center text-center`}>
              <FiUsers size={36} className="text-slate-300" />
              <p className="mt-4 text-base font-bold text-slate-500">No discoverable candidates match these filters.</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">Try broadening your search or removing a few constraints.</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  selected={selectedIds.has(candidate.id)}
                  selectingEnabled={candidate.access?.canSendInterest && !candidate.crm?.interestStatus}
                  actionState={actionState}
                  onSelect={() => handleSelect(candidate.id)}
                  onShortlist={() => toggleShortlist(candidate)}
                  onInterest={() => {
                    setInterestModal(candidate);
                    setInterestMessage('');
                    setInterestTemplateId('');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {interestModal ? (
        <Modal title={`Send interest to ${interestModal.user?.name || 'candidate'}`} onClose={() => setInterestModal(null)}>
          <div className="space-y-4">
            <select
              value={interestTemplateId}
              onChange={(event) => applyTemplateToSingle(event.target.value)}
              className={inputClass}
            >
              <option value="">Write a custom message</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <textarea
              rows={5}
              value={interestMessage}
              onChange={(event) => setInterestMessage(event.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Tell the candidate why you are reaching out."
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setInterestModal(null)} className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submitInterest(interestModal)}
                disabled={actionState[interestModal.id] === 'sending'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60"
              >
                {actionState[interestModal.id] === 'sending' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSend size={14} />}
                Send interest
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {bulkOpen ? (
        <Modal title={`Bulk outreach to ${selectedCount} candidates`} onClose={() => setBulkOpen(false)}>
          <div className="space-y-4">
            <select
              value={bulkTemplateId}
              onChange={(event) => applyTemplateToBulk(event.target.value)}
              className={inputClass}
            >
              <option value="">Choose a template or write custom</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <textarea
              rows={5}
              value={bulkMessage}
              onChange={(event) => setBulkMessage(event.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Message for the selected candidates."
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setBulkOpen(false)} className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitBulkInterest}
                disabled={actionState.bulk === 'sending'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#2d5bff] py-2.5 text-sm font-bold text-white hover:bg-[#2449d8] disabled:opacity-60"
              >
                {actionState.bulk === 'sending' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSend size={14} />}
                Send to selected
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">{label}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-200">{helper}</p>
    </div>
  );
}

function CandidateCard({ candidate, selected, selectingEnabled, actionState, onSelect, onShortlist, onInterest }) {
  const interestStatus = candidate.crm?.interestStatus;
  const shortlistLoading = actionState[`shortlist_${candidate.id}`] === 'saving';
  const interestLoading = actionState[candidate.id] === 'sending';

  return (
    <article className={`rounded-[1.75rem] border bg-white p-5 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.22)] transition ${selected ? 'border-brand-300 shadow-[0_0_0_2px_rgba(37,99,235,0.16)]' : 'border-slate-100'}`}>
      <div className="flex items-start gap-4">
        <button
          type="button"
          disabled={!selectingEnabled}
          onClick={onSelect}
          className="mt-1 flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selected ? <FiCheckSquare size={16} className="text-brand-600" /> : null}
        </button>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-brand-100 bg-brand-50 text-lg font-black text-brand-700">
          {(candidate.user?.name || 'C').charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold text-navy">{candidate.user?.name || 'Candidate'}</h3>
                {candidate.profile?.availableToHire ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    Available
                  </span>
                ) : null}
                {interestStatus ? (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyles[interestStatus] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    {interestStatus}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-600">{candidate.profile?.headline || 'Student profile'}</p>
            </div>

            <button
              type="button"
              onClick={onShortlist}
              disabled={shortlistLoading}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${candidate.crm?.isShortlisted ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} disabled:opacity-60`}
            >
              {shortlistLoading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiStar size={13} />}
              {candidate.crm?.isShortlisted ? 'Shortlisted' : 'Shortlist'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoLine icon={FiMapPin} label={candidate.profile?.location || 'Location hidden'} />
            <InfoLine icon={FiAward} label={candidate.education?.degree || 'Degree hidden'} />
            <InfoLine icon={FiBriefcase} label={candidate.education?.branch || 'Branch hidden'} />
            <InfoLine icon={FiLayers} label={candidate.education?.college || 'College hidden'} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(candidate.profile?.skills || []).slice(0, 6).map((skill) => (
              <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50 px-4 py-3 sm:grid-cols-3">
            <Metric label="Batch year" value={candidate.education?.batchYear || '-'} />
            <Metric label="CGPA" value={candidate.education?.cgpa ?? '-'} />
            <Metric label="Resume" value={candidate.profile?.hasResume ? (candidate.access?.canViewResume ? 'Unlocked' : 'Locked') : 'Not uploaded'} />
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
            {candidate.access?.requiresUpgrade ? (
              <div className="flex items-start gap-2">
                <FiLock size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p>{candidate.access.blurReason}</p>
              </div>
            ) : candidate.access?.canViewContact ? (
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 text-slate-700"><FiUser size={14} /> {candidate.user?.email || 'Email unavailable'}</span>
                <span className="inline-flex items-center gap-2 text-slate-700"><FiSend size={14} /> {candidate.user?.mobile || 'Mobile unavailable'}</span>
                {candidate.profile?.resumeUrl ? (
                  <a href={candidate.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-brand-700 hover:underline">
                    <FiFileText size={14} />
                    View resume
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <FiEye size={16} className="mt-0.5 shrink-0 text-brand-600" />
                <p>{candidate.access?.blurReason || 'Contact details unlock after candidate acceptance.'}</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {interestStatus ? (
              <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${statusStyles[interestStatus] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                <FiCheckCircle size={14} />
                Interest {interestStatus}
              </span>
            ) : (
              <button
                type="button"
                onClick={onInterest}
                disabled={!candidate.access?.canSendInterest || interestLoading}
                className="inline-flex items-center gap-2 rounded-full bg-[#2d5bff] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2449d8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {interestLoading ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSend size={14} />}
                Send interest
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoLine({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
      <Icon size={14} className="text-brand-600" />
      <span>{label}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[1.75rem] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-navy">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
            <FiX size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
