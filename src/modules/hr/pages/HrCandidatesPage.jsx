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
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiStar,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import {
  addToShortlist,
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
  availableOnly: false,
  verifiedOnly: false
};

const DEFAULT_PAGE_SIZE = 6;

const statusStyles = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-red-200 bg-red-50 text-red-600'
};

const panelClass = 'rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.32)]';
const inputClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-secondary-300 focus:bg-white focus:ring-4 focus:ring-secondary-100/80';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-700 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_-16px_rgba(47,83,143,0.9)] transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-60';
const softButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-secondary-200 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-60';

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
  const [summary, setSummary] = useState({ total: 0, blurred: 0, connected: 0, availableNow: 0, verified: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1, count: 0 });
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  const [actionState, setActionState] = useState({});
  const [interestModal, setInterestModal] = useState(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestTemplateId, setInterestTemplateId] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTemplateId, setBulkTemplateId] = useState('');

  const runSearch = async (activeFilters = filters, requestedPage = 1) => {
    setLoading(true);
    setError('');
    const response = await searchHrCandidatesV2({
      ...activeFilters,
      page: requestedPage,
      limit: DEFAULT_PAGE_SIZE
    });
    const payload = response.data || {};
    setAccess(payload.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
    setSummary(payload.summary || { total: 0, blurred: 0, connected: 0, availableNow: 0, verified: 0 });
    setPagination(payload.pagination || { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1, count: 0 });
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
    runSearch(EMPTY_FILTERS, 1);
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
    <div className="space-y-5 pb-12 text-slate-700">
      {!access.hasPaidAccess ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[0_14px_34px_-30px_rgba(180,83,9,0.45)]">
          <div className="flex min-w-0 items-start gap-3">
            <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="max-w-4xl">
              You are seeing blurred candidate previews. Upgrade to a paid hiring plan to unlock full profiles, send direct interest requests, and access resumes after candidate acceptance.
            </p>
          </div>
          <Link
            to="/portal/hr/jobs"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 font-bold text-white transition hover:bg-amber-800"
          >
            <FiLayers size={14} />
            Upgrade plan
          </Link>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

      <section className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className={`${panelClass} space-y-4 lg:sticky lg:top-24 lg:self-start`}>
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
                  runSearch(EMPTY_FILTERS, 1);
                }}
                className="text-xs font-bold text-slate-500 transition hover:text-secondary-700"
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

            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-secondary-100 hover:bg-white">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(event) => updateFilter('availableOnly', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-secondary-700"
              />
              <span className="text-sm font-semibold text-slate-700">Available to hire only</span>
            </label>

            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-secondary-100 hover:bg-white">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(event) => updateFilter('verifiedOnly', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-secondary-700"
              />
              <span className="text-sm font-semibold text-slate-700">Verified candidates only</span>
            </label>

            <button
              type="button"
              onClick={() => runSearch(filters, 1)}
              className={`${primaryButtonClass} w-full`}
            >
              {loading ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSearch size={14} />}
              Search candidates
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          <div className={`${panelClass} flex flex-wrap items-center gap-3 py-4`}>
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={!access.hasPaidAccess || selectableCandidates.length === 0}
              className={softButtonClass}
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
              className={primaryButtonClass}
            >
              <FiSend size={14} />
              Send bulk interest
            </button>

            <span className="ml-auto text-sm font-semibold text-slate-500">
              {selectedCount} selected
            </span>
          </div>

          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-60 animate-pulse rounded-xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className={`${panelClass} flex min-h-[320px] flex-col items-center justify-center text-center`}>
              <FiUsers size={36} className="text-slate-300" />
              <p className="mt-4 text-base font-bold text-slate-500">No candidates match these filters.</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">Try broadening your search or removing a few constraints.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span>
                  Showing <strong className="text-navy">{candidates.length}</strong> of <strong className="text-navy">{pagination.total || summary.total}</strong> candidates
                </span>
                <span>
                  Verified <strong className="text-navy">{summary.verified || 0}</strong>
                </span>
                <span>
                  Page <strong className="text-navy">{pagination.page}</strong> of <strong className="text-navy">{pagination.totalPages}</strong>
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
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

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <button
                  type="button"
                  disabled={loading || pagination.page <= 1}
                  onClick={() => runSearch(filters, Math.max(1, pagination.page - 1))}
                  className="min-h-11 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="text-center text-sm text-slate-500">
                  Page <span className="font-bold text-navy">{pagination.page}</span> / <span className="font-bold text-navy">{pagination.totalPages}</span>
                </div>

                <button
                  type="button"
                  disabled={loading || pagination.page >= pagination.totalPages}
                  onClick={() => runSearch(filters, pagination.page + 1)}
                  className="min-h-11 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
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

function CandidateCard({ candidate, selected, selectingEnabled, actionState, onSelect, onShortlist, onInterest }) {
  const interestStatus = candidate.crm?.interestStatus;
  const shortlistLoading = actionState[`shortlist_${candidate.id}`] === 'saving';
  const interestLoading = actionState[candidate.id] === 'sending';
  const verification = candidate.verification || {};

  return (
    <article className={`rounded-xl border bg-white p-3.5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.26)] transition ${selected ? 'border-brand-300 shadow-[0_0_0_2px_rgba(37,99,235,0.16)]' : 'border-slate-100'}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={!selectingEnabled}
          onClick={onSelect}
          className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selected ? <FiCheckSquare size={14} className="text-brand-600" /> : null}
        </button>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-base font-black text-brand-700">
          {(candidate.user?.name || 'C').charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="max-w-[14rem] truncate text-base font-extrabold text-navy">{candidate.user?.name || 'Candidate'}</h3>
                {candidate.profile?.availableToHire ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    Available
                  </span>
                ) : null}
                {verification.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                    <FiShield size={11} />
                    Verified
                  </span>
                ) : null}
                {interestStatus ? (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyles[interestStatus] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    {interestStatus}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 max-w-[16rem] truncate text-xs font-semibold text-slate-600">{candidate.profile?.headline || 'Student profile'}</p>
            </div>

            <button
              type="button"
              onClick={onShortlist}
              disabled={shortlistLoading}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition ${candidate.crm?.isShortlisted ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} disabled:opacity-60`}
            >
              {shortlistLoading ? <FiRefreshCw size={12} className="animate-spin" /> : <FiStar size={12} />}
              {candidate.crm?.isShortlisted ? 'Shortlisted' : 'Shortlist'}
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <InfoLine icon={FiMapPin} label={candidate.profile?.location || 'Location hidden'} />
            <InfoLine icon={FiAward} label={candidate.education?.degree || 'Degree hidden'} />
            <InfoLine icon={FiBriefcase} label={candidate.education?.branch || 'Branch hidden'} />
            <InfoLine icon={FiLayers} label={candidate.education?.college || 'College hidden'} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(candidate.profile?.skills || []).slice(0, 4).map((skill) => (
              <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-3 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 sm:grid-cols-3">
            <Metric label="Batch year" value={candidate.education?.batchYear || '-'} />
            <Metric label="CGPA" value={candidate.education?.cgpa ?? '-'} />
            <Metric label="Resume" value={candidate.profile?.hasResume ? (candidate.access?.canViewResume ? 'Unlocked' : 'Locked') : 'Not uploaded'} />
          </div>

          {verification.isVerified ? (
            <div className="mt-3 grid gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5 sm:grid-cols-3">
              <Metric label="Identity" value={verification.identityVerified ? 'Verified' : 'Pending'} />
              <Metric label="Address" value={verification.addressVerified ? 'Verified' : 'Pending'} />
              <Metric label="Experience" value={verification.verifiedExperienceCount ? `${verification.verifiedExperienceCount} verified` : (verification.experienceVerified ? 'Verified' : 'Pending')} />
            </div>
          ) : null}

          <div className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-500">
            {candidate.access?.requiresUpgrade ? (
              <div className="flex items-start gap-2">
                <FiLock size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <p>{candidate.access.blurReason}</p>
              </div>
            ) : candidate.access?.canViewContact ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-slate-700"><FiUser size={13} /> {candidate.user?.email || 'Email unavailable'}</span>
                <span className="inline-flex items-center gap-1.5 text-slate-700"><FiSend size={13} /> {candidate.user?.mobile || 'Mobile unavailable'}</span>
                {candidate.profile?.resumeUrl ? (
                  <a href={candidate.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline">
                    <FiFileText size={13} />
                    View resume
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <FiEye size={14} className="mt-0.5 shrink-0 text-brand-600" />
                <p>{candidate.access?.blurReason || 'Contact details unlock after candidate acceptance.'}</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {interestStatus ? (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyles[interestStatus] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                <FiCheckCircle size={13} />
                Interest {interestStatus}
              </span>
            ) : (
              <button
                type="button"
                onClick={onInterest}
                disabled={!candidate.access?.canSendInterest || interestLoading}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2d5bff] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#2449d8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {interestLoading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiSend size={13} />}
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
    <div className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
      <Icon size={13} className="shrink-0 text-brand-600" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-navy">{value}</p>
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
