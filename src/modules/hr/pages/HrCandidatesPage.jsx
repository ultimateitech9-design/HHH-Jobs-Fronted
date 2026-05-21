import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  sendCandidateInterest,
  viewHrCandidateResume
} from '../services/hrApi';
import UpgradePlanModal from '../../../shared/components/UpgradePlanModal';

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
const CANDIDATE_PAGE_SIZES = [6, 12, 24, 48];

const statusStyles = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-red-200 bg-red-50 text-red-600'
};

const panelClass = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.32)]';
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-secondary-300 focus:bg-white focus:ring-4 focus:ring-secondary-100/80';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-700 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_12px_24px_-16px_rgba(47,83,143,0.9)] transition hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-60';
const softButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 transition hover:border-secondary-200 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-60';

const renderTemplateMessage = (template, candidate) => {
  if (!template?.message) return '';

  return template.message
    .replaceAll('{{candidateName}}', candidate?.user?.name || 'there')
    .replaceAll('{{companyName}}', 'our company')
    .replaceAll('{{collegeName}}', candidate?.education?.college || 'your college');
};

const isOpenableResumeUrl = (value = '') => /^https?:\/\//i.test(String(value || '')) || /^data:/i.test(String(value || ''));
const escapeHtml = (value = '') =>
  String(value || '').replace(/[<>&"]/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;'
  }[char]));

const getStudentDbUsage = (access = {}, summary = {}) => {
  const limit = access.studentDbViewLimit ?? summary.studentDbViewLimit;
  const numericLimit = Number(limit);
  if (!Number.isFinite(numericLimit)) return null;
  const used = Number(access.studentDbViewsUsed ?? summary.studentDbViewsUsed ?? 0);
  const remaining = Math.max(0, Number(access.studentDbViewsRemaining ?? summary.studentDbViewsRemaining ?? (numericLimit - used)));
  return { limit: numericLimit, used, remaining };
};

const writeResumeWindow = (targetWindow, html) => {
  if (!targetWindow || targetWindow.closed) return false;
  targetWindow.document.open();
  targetWindow.document.write(html);
  targetWindow.document.close();
  targetWindow.focus();
  return true;
};

const buildResumeDocument = ({ title = 'Candidate Resume', bodyHtml = '' } = {}) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    main { max-width: 900px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; padding: 28px; }
    h1 { margin: 0 0 18px; font-size: 24px; }
    p { color: #475569; font-size: 14px; line-height: 1.6; }
    pre { white-space: pre-wrap; word-break: break-word; font: 14px/1.6 Arial, sans-serif; }
  </style>
</head>
<body><main><h1>${escapeHtml(title)}</h1>${bodyHtml}</main></body>
</html>`;

const openResumeText = ({ candidateName = 'Candidate', resumeText = '', targetWindow = null } = {}) => {
  if (!resumeText) return;

  const title = `${candidateName || 'Candidate'} Resume`;
  const doc = buildResumeDocument({ title, bodyHtml: `<pre>${escapeHtml(resumeText)}</pre>` });
  if (writeResumeWindow(targetWindow, doc)) return true;

  const blobUrl = URL.createObjectURL(new Blob([doc], { type: 'text/html;charset=utf-8' }));
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  return true;
};

const openResume = ({ candidate, resume, targetWindow = null }) => {
  const candidateName = resume?.candidateName || candidate?.user?.name || 'Candidate';
  const resumeUrl = resume?.resumeUrl || candidate?.profile?.resumeUrl || '';
  const resumeText = String(resume?.resumeText || candidate?.profile?.resumeText || '').trim();

  if (isOpenableResumeUrl(resumeUrl)) {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.href = resumeUrl;
    } else {
      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
    }
    return true;
  }

  if (resumeText) return openResumeText({ candidateName, resumeText, targetWindow });

  writeResumeWindow(targetWindow, buildResumeDocument({
    title: `${candidateName} Resume`,
    bodyHtml: '<p>Resume file is not available in a browser-openable format for this candidate.</p>'
  }));
  return false;
};

function ResumeAction({ candidate, loading, onViewResume }) {
  if (!candidate?.access?.canViewResume || !candidate?.profile?.hasResume) return null;

  return (
    <button type="button" onClick={onViewResume} disabled={loading} className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60">
      {loading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiFileText size={13} />}
      View resume
    </button>
  );
}

export default function HrCandidatesPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [access, setAccess] = useState({ hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
  const [summary, setSummary] = useState({ total: 0, blurred: 0, connected: 0, availableNow: 0, verified: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1, count: 0 });
  const [candidates, setCandidates] = useState([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  const [actionState, setActionState] = useState({});
  const [interestModal, setInterestModal] = useState(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestTemplateId, setInterestTemplateId] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTemplateId, setBulkTemplateId] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const searchRequestRef = useRef(0);

  const runSearch = useCallback(async (activeFilters = EMPTY_FILTERS, requestedPage = 1, requestedLimit = DEFAULT_PAGE_SIZE) => {
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setLoading(true);
    setError('');
    const response = await searchHrCandidatesV2({
      ...activeFilters,
      page: requestedPage,
      limit: requestedLimit
    });
    if (requestId !== searchRequestRef.current) return;
    const payload = response.data || {};
    const nextPagination = payload.pagination || { page: requestedPage, limit: requestedLimit, total: 0, totalPages: 1, count: 0 };
    setAccess(payload.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
    setSummary(payload.summary || { total: 0, blurred: 0, connected: 0, availableNow: 0, verified: 0 });
    setPagination(nextPagination);
    setPageSize(Number(nextPagination.limit || requestedLimit));
    setCandidates(payload.candidates || []);
    setError(response.error || '');
    setLoading(false);
    setSelectedIds(new Set());
  }, []);

  const loadTemplates = async () => {
    const response = await getHrCandidateMessageTemplates();
    setTemplates(response.data?.templates || []);
    if (response.data?.access) setAccess((current) => ({ ...current, ...response.data.access }));
  };

  useEffect(() => {
    runSearch(EMPTY_FILTERS, 1, DEFAULT_PAGE_SIZE);
    loadTemplates();
  }, [runSearch]);

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([key, value]) => (key === 'availableOnly' ? value : String(value).trim())).length,
    [filters]
  );

  const selectableCandidates = candidates.filter((candidate) => !candidate.crm?.interestStatus && candidate.access?.canSendInterest);
  const selectedCount = selectedIds.size;
  const visibleStart = (pagination.total || summary.total) && candidates.length
    ? ((pagination.page - 1) * (pagination.limit || pageSize)) + 1
    : 0;
  const visibleEnd = candidates.length ? visibleStart + candidates.length - 1 : 0;
  const studentDbUsage = getStudentDbUsage(access, summary);

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
      const interest = await sendCandidateInterest(candidate.id, {
        message: interestMessage,
        templateId: interestTemplateId,
        campaignLabel: 'candidate_database_single'
      });
      if (interest?.access) {
        setAccess((current) => ({ ...current, ...interest.access }));
        setSummary((current) => ({
          ...current,
          studentDbViewsUsed: interest.access.studentDbViewsUsed,
          studentDbViewsRemaining: interest.access.studentDbViewsRemaining,
          studentDbViewLimit: interest.access.studentDbViewLimit
        }));
      }

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
      const response = await sendBulkCandidateInterest([...selectedIds], {
        message: bulkMessage,
        templateId: bulkTemplateId,
        campaignLabel: 'candidate_database_bulk'
      });
      if (response?.access) {
        setAccess((current) => ({ ...current, ...response.access }));
        setSummary((current) => ({
          ...current,
          studentDbViewsUsed: response.access.studentDbViewsUsed,
          studentDbViewsRemaining: response.access.studentDbViewsRemaining,
          studentDbViewLimit: response.access.studentDbViewLimit
        }));
      }

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

  const handleViewResume = async (candidate) => {
    if (!candidate?.id) return;

    const hasEmbeddedResume = isOpenableResumeUrl(candidate.profile?.resumeUrl) || String(candidate.profile?.resumeText || '').trim();
    if (hasEmbeddedResume && !candidate.access?.resumeRequiresTracking) {
      const resumeWindow = window.open('', '_blank');
      openResume({ candidate, targetWindow: resumeWindow });
      return;
    }

    const resumeWindow = window.open('', '_blank');
    writeResumeWindow(resumeWindow, buildResumeDocument({
      title: `${candidate.user?.name || 'Candidate'} Resume`,
      bodyHtml: '<p>Loading resume...</p>'
    }));
    setActionState((current) => ({ ...current, [`resume_${candidate.id}`]: 'opening' }));
    setError('');

    try {
      const response = await viewHrCandidateResume(candidate.id);
      if (response.access) {
        setAccess((current) => ({ ...current, ...response.access }));
        setSummary((current) => ({
          ...current,
          studentDbViewsUsed: response.access.studentDbViewsUsed,
          studentDbViewsRemaining: response.access.studentDbViewsRemaining,
          studentDbViewLimit: response.access.studentDbViewLimit
        }));
      }

      setCandidates((current) =>
        current.map((item) =>
          item.id === candidate.id
            ? {
                ...item,
                profile: {
                  ...item.profile,
                  resumeUrl: response.resume?.resumeUrl || item.profile?.resumeUrl || null,
                  resumeText: response.resume?.resumeText || item.profile?.resumeText || ''
                },
                access: {
                  ...item.access,
                  resumeRequiresTracking: false,
                  canViewResume: true
                }
              }
            : item
        )
      );
      openResume({ candidate, resume: response.resume, targetWindow: resumeWindow });
    } catch (resumeError) {
      setError(resumeError.message || 'Unable to open resume.');
      writeResumeWindow(resumeWindow, buildResumeDocument({
        title: `${candidate.user?.name || 'Candidate'} Resume`,
        bodyHtml: `<p>${escapeHtml(resumeError.message || 'Unable to open resume.')}</p>`
      }));
    } finally {
      setActionState((current) => ({ ...current, [`resume_${candidate.id}`]: '' }));
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
    <div className="admin-ops-page text-slate-700">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.32)]">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Candidate Database</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-navy sm:text-3xl">Candidate DB</h1>
        <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
          Search student profiles, shortlist verified talent, and send candidate connection requests.
        </p>
      </div>

      {!access.hasPaidAccess ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-[13px] font-medium text-amber-800">
            <FiAlertCircle size={16} className="shrink-0" />
            <span>Candidate profiles are available. Contact details unlock after the student accepts your request.</span>
          </div>
          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FiLayers size={12} />
            Upgrade
          </button>
        </div>
      ) : null}

      {studentDbUsage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-[13px] font-semibold text-indigo-800 shadow-sm">
          <span>
            {access.activePlanName || 'Current plan'} candidate views: {studentDbUsage.used}/{studentDbUsage.limit}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-indigo-700">
            {studentDbUsage.remaining} left
          </span>
        </div>
      ) : null}

      <UpgradePlanModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureKey="hr.candidate_search"
        featureLabel="Candidate Database Access"
        currentTier={0}
        requiredTier={1}
        audienceRole="hr"
      />

      {error ? <div className="admin-ops-alert admin-ops-alert--error text-sm">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className={`${panelClass} space-y-4 lg:sticky lg:top-24 lg:self-start`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-navy">
              <FiFilter size={16} />
              Search filters
            </h2>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  runSearch(EMPTY_FILTERS, 1, pageSize);
                }}
                className="text-xs font-bold text-slate-500 transition hover:text-secondary-700"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <Field label="Keyword" value={filters.search} onChange={(value) => updateFilter('search', value)} placeholder="React developer, final year..." />
            <Field label="Skills" value={filters.skills} onChange={(value) => updateFilter('skills', value)} placeholder="React, JavaScript, REST APIs" />
            <Field label="Location" value={filters.location} onChange={(value) => updateFilter('location', value)} placeholder="Mumbai, Remote" />
            <Field label="Experience" value={filters.experience} onChange={(value) => updateFilter('experience', value)} placeholder="Fresher, internship" />
            <Field label="Degree" value={filters.degree} onChange={(value) => updateFilter('degree', value)} placeholder="B.Tech, BCA" />
            <Field label="Branch" value={filters.branch} onChange={(value) => updateFilter('branch', value)} placeholder="CSE, IT, ECE" />
            <Field label="College" value={filters.college} onChange={(value) => updateFilter('college', value)} placeholder="College name" />
            <Field label="Batch year" value={filters.batchYear} onChange={(value) => updateFilter('batchYear', value)} placeholder="2026" />
            <Field label="Min CGPA" type="number" value={filters.minCgpa} onChange={(value) => updateFilter('minCgpa', value)} placeholder="7.5" />

            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition hover:border-secondary-100 hover:bg-white">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(event) => updateFilter('availableOnly', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-secondary-700"
              />
              <span className="text-[13px] font-semibold text-slate-700">Available to hire only</span>
            </label>

            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition hover:border-secondary-100 hover:bg-white">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(event) => updateFilter('verifiedOnly', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-secondary-700"
              />
              <span className="text-[13px] font-semibold text-slate-700">Verified candidates only</span>
            </label>

            <button
              type="button"
              onClick={() => runSearch(filters, 1, pageSize)}
              className={`${primaryButtonClass} w-full`}
            >
              {loading ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSearch size={14} />}
              Search candidates
            </button>
          </div>
        </aside>

        <div className="space-y-3.5">
          <div className={`${panelClass} flex flex-wrap items-center gap-3 py-3.5`}>
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
              Send bulk request
            </button>

            {studentDbUsage ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[12px] font-bold text-indigo-800">
                <FiEye size={13} />
                Candidate views {studentDbUsage.used}/{studentDbUsage.limit}
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-indigo-700">{studentDbUsage.remaining} left</span>
              </span>
            ) : access.hasPaidAccess ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700">
                <FiEye size={13} />
                Candidate views unlimited
              </span>
            ) : null}

            <span className="ml-auto text-[13px] font-semibold text-slate-500">
              {selectedCount} selected
            </span>
          </div>

          {loading ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className={`${panelClass} flex min-h-[320px] flex-col items-center justify-center text-center`}>
              <FiUsers size={36} className="text-slate-300" />
              <p className="mt-4 text-base font-bold text-slate-500">No candidates match these filters.</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">Try broadening your search or removing a few constraints.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="admin-ops-pagination rounded-2xl border border-slate-200 bg-slate-50 text-[13px] text-slate-500">
                <span>
                  Showing <strong className="text-navy">{visibleStart}-{visibleEnd}</strong> of <strong className="text-navy">{pagination.total || summary.total}</strong> candidates
                </span>
                <span>
                  Verified <strong className="text-navy">{summary.verified || 0}</strong>
                </span>
                <span>
                  Page <strong className="text-navy">{pagination.page}</strong> of <strong className="text-navy">{pagination.totalPages}</strong>
                </span>
                <label className="inline-flex items-center gap-2 font-semibold text-slate-500">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      const nextLimit = Number(event.target.value);
                      setPageSize(nextLimit);
                      runSearch(filters, 1, nextLimit);
                    }}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-700 outline-none transition focus:border-secondary-300 focus:ring-4 focus:ring-secondary-100/80"
                  >
                    {CANDIDATE_PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    selected={selectedIds.has(candidate.id)}
                    selectingEnabled={candidate.access?.canSendInterest && !candidate.crm?.interestStatus}
                    actionState={actionState}
                    onSelect={() => handleSelect(candidate.id)}
                    onShortlist={() => toggleShortlist(candidate)}
                    onViewResume={() => handleViewResume(candidate)}
                    onInterest={() => {
                      setInterestModal(candidate);
                      setInterestMessage('');
                      setInterestTemplateId('');
                    }}
                  />
                ))}
              </div>

              <div className="admin-ops-pagination rounded-2xl border border-slate-200 bg-white">
                <button
                  type="button"
                  disabled={loading || pagination.page <= 1}
                  onClick={() => runSearch(filters, Math.max(1, pagination.page - 1), pageSize)}
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
                  onClick={() => runSearch(filters, pagination.page + 1, pageSize)}
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
        <Modal title={`Send connection request to ${interestModal.user?.name || 'candidate'}`} onClose={() => setInterestModal(null)}>
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
              placeholder="Tell the student why you want to connect."
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
                Send request
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {bulkOpen ? (
        <Modal title={`Bulk connection request to ${selectedCount} candidates`} onClose={() => setBulkOpen(false)}>
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
              placeholder="Message for the selected students."
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
                Send requests
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

function CandidateCard({ candidate, selected, selectingEnabled, actionState, onSelect, onShortlist, onViewResume, onInterest }) {
  const interestStatus = candidate.crm?.interestStatus;
  const shortlistLoading = actionState[`shortlist_${candidate.id}`] === 'saving';
  const interestLoading = actionState[candidate.id] === 'sending';
  const resumeLoading = actionState[`resume_${candidate.id}`] === 'opening';
  const verification = candidate.verification || {};

  return (
    <article className={`rounded-xl border bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.26)] transition ${selected ? 'border-brand-300 shadow-[0_0_0_2px_rgba(37,99,235,0.16)]' : 'border-slate-100'}`}>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          disabled={!selectingEnabled}
          onClick={onSelect}
          className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selected ? <FiCheckSquare size={14} className="text-brand-600" /> : null}
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-sm font-black text-brand-700">
          {(candidate.user?.name || 'C').charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="max-w-[14rem] truncate text-sm font-extrabold text-navy">{candidate.user?.name || 'Candidate'}</h3>
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
              <p className="mt-0.5 max-w-[16rem] truncate text-[11px] font-semibold text-slate-600">{candidate.profile?.headline || 'Student profile'}</p>
            </div>

            <button
              type="button"
              onClick={onShortlist}
              disabled={shortlistLoading}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${candidate.crm?.isShortlisted ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} disabled:opacity-60`}
            >
              {shortlistLoading ? <FiRefreshCw size={12} className="animate-spin" /> : <FiStar size={12} />}
              {candidate.crm?.isShortlisted ? 'Shortlisted' : 'Shortlist'}
            </button>
          </div>

          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <InfoLine icon={FiMapPin} label={candidate.profile?.location || 'Location hidden'} />
            <InfoLine icon={FiAward} label={candidate.education?.degree || 'Degree hidden'} />
            <InfoLine icon={FiBriefcase} label={candidate.education?.branch || 'Branch hidden'} />
            <InfoLine icon={FiLayers} label={candidate.education?.college || 'College hidden'} />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {(candidate.profile?.skills || []).slice(0, 4).map((skill) => (
              <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-2 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 sm:grid-cols-3">
            <Metric label="Batch year" value={candidate.education?.batchYear || '-'} />
            <Metric label="CGPA" value={candidate.education?.cgpa ?? '-'} />
            <Metric label="Resume" value={candidate.profile?.hasResume ? (candidate.access?.canViewResume ? 'Unlocked' : 'Locked') : 'Not uploaded'} />
          </div>

          {verification.isVerified ? (
            <div className="mt-2 grid gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-2.5 py-2 sm:grid-cols-3">
              <Metric label="Identity" value={verification.identityVerified ? 'Verified' : 'Pending'} />
              <Metric label="Address" value={verification.addressVerified ? 'Verified' : 'Pending'} />
              <Metric label="Experience" value={verification.verifiedExperienceCount ? `${verification.verifiedExperienceCount} verified` : (verification.experienceVerified ? 'Verified' : 'Pending')} />
            </div>
          ) : null}

          <div className="mt-2 rounded-lg border border-dashed border-slate-200 px-2.5 py-2 text-[11px] leading-4 text-slate-500">
            {candidate.access?.requiresUpgrade || !candidate.access?.canBrowseFullProfile ? (
              <div className="flex items-start gap-2">
                <FiLock size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <p>{candidate.access.blurReason}</p>
              </div>
            ) : candidate.access?.canViewContact ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-slate-700"><FiUser size={13} /> {candidate.user?.email || 'Email unavailable'}</span>
                <span className="inline-flex items-center gap-1.5 text-slate-700"><FiSend size={13} /> {candidate.user?.mobile || 'Mobile unavailable'}</span>
                <ResumeAction candidate={candidate} loading={resumeLoading} onViewResume={onViewResume} />
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <FiEye size={14} className="mt-0.5 shrink-0 text-brand-600" />
                <div className="space-y-1">
                  <p>{candidate.access?.blurReason || 'Contact details unlock after the student accepts your connection request.'}</p>
                  <ResumeAction candidate={candidate} loading={resumeLoading} onViewResume={onViewResume} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
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
                Send request
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
