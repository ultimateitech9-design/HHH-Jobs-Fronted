import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiLink,
  FiMail,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import {
  createHrCampusConnection,
  fetchHrCampusConnectionDirectory,
  fetchHrCampusConnections
} from '../services/hrApi';

const STATUS_STYLE = {
  available: 'border-slate-200 bg-white text-slate-600',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-600'
};

const REQUEST_TYPE_OPTIONS = [
  { value: 'drive', label: 'Campus drive' },
  { value: 'pool', label: 'Campus pool' },
  { value: 'both', label: 'Drive + pool' }
];

const buildCollegeSearchText = (college = {}) => [
  college.collegeName,
  college.location,
  college.city,
  college.state,
  college.placementOfficerName,
  college.contactEmail,
  college.website
].join(' ').toLowerCase();

const normalizeSearchText = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

const tokenizeSearch = (value = '') => normalizeSearchText(value).split(' ').filter(Boolean);

const scoreCollegeMatch = (entry, rawTerm, tokens) => {
  if (!rawTerm) return 1;

  let score = 0;
  if (entry.collegeName.startsWith(rawTerm)) score += 120;
  else if (entry.collegeName.includes(rawTerm)) score += 80;

  if (entry.searchText.includes(rawTerm)) score += 30;

  for (const token of tokens) {
    if (entry.collegeName.startsWith(token)) score += 24;
    else if (entry.collegeName.includes(token)) score += 16;
    else if (entry.searchText.includes(token)) score += 8;
    else return 0;
  }

  return score;
};

const buildRequestDraft = (colleges = [], requestType = 'both') => {
  const singular = colleges.length <= 1;

  if (requestType === 'drive') {
    return singular
      ? 'We would like to explore a dedicated campus drive collaboration with your placement team. Our hiring team can share role requirements, interview timelines, and evaluation workflows to run a focused campus drive smoothly.'
      : 'We would like to explore dedicated campus drive collaborations with your placement team. Our hiring team can share role requirements, interview timelines, and evaluation workflows to run focused campus drives smoothly.';
  }

  if (requestType === 'pool') {
    return singular
      ? 'We would like to access your campus talent pool for upcoming hiring needs. Our team can review relevant student profiles, shortlist candidates, and coordinate next steps with your placement office professionally.'
      : 'We would like to access your campus talent pool for upcoming hiring needs. Our team can review relevant student profiles, shortlist candidates, and coordinate next steps with your placement office professionally.';
  }

  return singular
    ? 'We would like to explore both a campus drive collaboration and ongoing access to your campus talent pool. Our hiring team can align on hiring requirements, review relevant student profiles, and coordinate the complete workflow with your placement office.'
    : 'We would like to explore both campus drive collaborations and ongoing access to your campus talent pool. Our hiring team can align on hiring requirements, review relevant student profiles, and coordinate the complete workflow with your placement office.';
};

export default function HrCampusConnectionsPage() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [directory, setDirectory] = useState({ colleges: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCollegeIds, setSelectedCollegeIds] = useState([]);
  const [requestModal, setRequestModal] = useState({ open: false, collegeIds: [] });
  const [requestType, setRequestType] = useState('both');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const loadPage = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const [connectionsResponse, directoryResponse] = await Promise.all([
      fetchHrCampusConnections(),
      fetchHrCampusConnectionDirectory()
    ]);

    setConnections(connectionsResponse.data || []);
    setDirectory(directoryResponse.data || { colleges: [], summary: null });
    setError(connectionsResponse.error || directoryResponse.error || '');
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    const inviteableIds = new Set(
      (directory.colleges || [])
        .filter((college) => college.canInvite)
        .map((college) => college.collegeId)
    );

    setSelectedCollegeIds((current) => current.filter((id) => inviteableIds.has(id)));
    setRequestModal((current) => ({
      ...current,
      collegeIds: current.collegeIds.filter((id) => inviteableIds.has(id))
    }));
  }, [directory.colleges]);

  const incomingInvites = useMemo(
    () => connections.filter((connection) => connection.initiationSource === 'college' && connection.status === 'pending'),
    [connections]
  );
  const outgoingRequests = useMemo(
    () => connections.filter((connection) => connection.initiationSource === 'company' && connection.status === 'pending'),
    [connections]
  );
  const activeConnections = useMemo(
    () => connections.filter((connection) => connection.status === 'accepted'),
    [connections]
  );
  const closedConnections = useMemo(
    () => connections.filter((connection) => connection.status === 'rejected'),
    [connections]
  );

  const collegeDirectoryIndex = useMemo(
    () => (directory.colleges || []).map((college) => ({
      college,
      collegeName: normalizeSearchText(college.collegeName),
      searchText: normalizeSearchText(buildCollegeSearchText(college))
    })),
    [directory.colleges]
  );

  const filteredColleges = useMemo(() => {
    const rawTerm = normalizeSearchText(deferredSearch);
    const tokens = tokenizeSearch(rawTerm);
    if (!rawTerm) return (directory.colleges || []).slice(0, 160);

    return collegeDirectoryIndex
      .map((entry) => ({
        college: entry.college,
        score: scoreCollegeMatch(entry, rawTerm, tokens)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.college.collegeName.localeCompare(right.college.collegeName))
      .slice(0, 160)
      .map((entry) => entry.college);
  }, [collegeDirectoryIndex, deferredSearch, directory.colleges]);

  const visibleInviteableIds = useMemo(
    () => filteredColleges.filter((college) => college.canInvite).map((college) => college.collegeId),
    [filteredColleges]
  );

  const selectedColleges = useMemo(
    () => (directory.colleges || []).filter((college) => selectedCollegeIds.includes(college.collegeId)),
    [directory.colleges, selectedCollegeIds]
  );

  const requestModalColleges = useMemo(
    () => (directory.colleges || []).filter((college) => requestModal.collegeIds.includes(college.collegeId)),
    [directory.colleges, requestModal.collegeIds]
  );

  const allVisibleSelected = Boolean(
    visibleInviteableIds.length && visibleInviteableIds.every((id) => selectedCollegeIds.includes(id))
  );

  const readyToInviteCount = useMemo(
    () => (directory.colleges || []).filter((college) => college.canInvite).length,
    [directory.colleges]
  );

  const handleRefresh = () => {
    setError('');
    setNotice('');
    loadPage({ silent: true });
  };

  const toggleCollegeSelection = (college) => {
    if (!college.canInvite) return;

    setSelectedCollegeIds((current) => (
      current.includes(college.collegeId)
        ? current.filter((id) => id !== college.collegeId)
        : [...current, college.collegeId]
    ));
  };

  const handleSelectAllVisible = () => {
    if (!visibleInviteableIds.length) return;

    setSelectedCollegeIds((current) => {
      if (visibleInviteableIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleInviteableIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleInviteableIds]));
    });
  };

  const handleClearSelection = () => {
    setSelectedCollegeIds([]);
  };

  const openRequestModal = (collegeIds, options = {}) => {
    const nextColleges = (directory.colleges || []).filter(
      (college) => collegeIds.includes(college.collegeId) && college.canInvite
    );

    if (!nextColleges.length) return;

    const nextType = options.requestType || 'both';
    setRequestType(nextType);
    setRequestMessage(options.draftMessage || buildRequestDraft(nextColleges, nextType));
    setRequestModal({
      open: true,
      collegeIds: nextColleges.map((college) => college.collegeId)
    });
    setError('');
    setNotice('');
  };

  const closeRequestModal = () => {
    setRequestModal({ open: false, collegeIds: [] });
    setRequestType('both');
    setRequestMessage('');
    setRequestSubmitting(false);
  };

  const handleRequestTypeChange = (nextType) => {
    setRequestType(nextType);
    setRequestMessage(buildRequestDraft(requestModalColleges, nextType));
  };

  const handleRequestSubmit = async () => {
    if (!requestModalColleges.length) return;

    setRequestSubmitting(true);
    setError('');
    setNotice('');

    const results = await Promise.allSettled(
      requestModalColleges.map((college) => createHrCampusConnection({
        collegeId: college.collegeId,
        message: requestMessage.trim()
      }))
    );

    const failedIds = results
      .map((result, index) => (result.status === 'rejected' ? requestModalColleges[index].collegeId : null))
      .filter(Boolean);
    const successCount = results.length - failedIds.length;

    if (successCount > 0) {
      setNotice(
        successCount === 1
          ? 'Campus request sent successfully.'
          : `${successCount} campus requests sent successfully.`
      );
    }

    if (failedIds.length > 0) {
      setError(
        failedIds.length === results.length
          ? 'Unable to send campus requests right now.'
          : `${failedIds.length} campus request${failedIds.length > 1 ? 's were' : ' was'} not sent. You can retry them.`
      );
      setRequestModal({ open: true, collegeIds: failedIds });
      setSelectedCollegeIds(failedIds);
    } else {
      closeRequestModal();
      setSelectedCollegeIds([]);
      navigate('/portal/hr/campus-connections/activity/sent');
    }

    await loadPage({ silent: true });
    setRequestSubmitting(false);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Campus Outreach</p>
          <h1 className="mt-0.5 text-[18px] font-bold tracking-tight text-slate-900">Discover &amp; Connect with Campuses</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">
            <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button type="button" onClick={() => navigate('/portal/hr/campus-connections/activity/sent')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">
            Activity
          </button>
          <button type="button" onClick={() => openRequestModal(selectedCollegeIds)} disabled={!selectedColleges.length} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40">
            <FiSend size={12} /> Request{selectedColleges.length ? ` (${selectedColleges.length})` : ''}
          </button>
        </div>
      </div>

      {/* Stat row */}
      <div className="flex flex-wrap gap-2">
        <StatPill label="Pending" value={incomingInvites.length} tone="amber" onClick={() => navigate('/portal/hr/campus-connections/activity/incoming')} />
        <StatPill label="Sent" value={outgoingRequests.length} tone="blue" onClick={() => navigate('/portal/hr/campus-connections/activity/sent')} />
        <StatPill label="Connected" value={activeConnections.length} tone="emerald" onClick={() => navigate('/portal/hr/campus-connections/activity/connected')} />
        <StatPill label="Closed" value={closedConnections.length} tone="slate" onClick={() => navigate('/portal/hr/campus-connections/activity/closed')} />
        <StatPill label="Campuses" value={directory.summary?.totalColleges || 0} tone="slate" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />{error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{notice}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <FiRefreshCw size={20} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Campus Directory</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">{readyToInviteCount} available for outreach &middot; {filteredColleges.length} shown</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative block">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => { const v = event.target.value; startTransition(() => { setSearch(v); }); }}
                  placeholder="Search campus, city..."
                  className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <button type="button" onClick={handleSelectAllVisible} disabled={!visibleInviteableIds.length} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">
                {allVisibleSelected ? 'Deselect' : 'Select all'}
              </button>
              {selectedColleges.length > 0 && (
                <button type="button" onClick={handleClearSelection} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50">
                  Clear
                </button>
              )}
              {selectedColleges.length > 0 && (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{selectedColleges.length} selected</span>
              )}
            </div>
          </div>

          {filteredColleges.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <FiUsers size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-[14px] font-semibold text-slate-500">No campuses matched</p>
              <p className="mt-1 text-[12px] text-slate-400">Try a different search term or refresh the directory.</p>
            </div>
          ) : (
            <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredColleges.map((college) => (
                <CampusCard
                  key={college.collegeId}
                  college={college}
                  selected={selectedCollegeIds.includes(college.collegeId)}
                  onToggleSelect={() => toggleCollegeSelection(college)}
                  onInvite={() => openRequestModal([college.collegeId])}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {requestModal.open ? (
        <RequestModal
          colleges={requestModalColleges}
          requestType={requestType}
          requestMessage={requestMessage}
          onChangeRequestType={handleRequestTypeChange}
          onChangeRequestMessage={setRequestMessage}
          onClose={closeRequestModal}
          onSubmit={handleRequestSubmit}
          submitting={requestSubmitting}
        />
      ) : null}
    </div>
  );
}

function StatPill({ label, value, tone, onClick }) {
  const dotColors = { amber: 'bg-amber-400', blue: 'bg-sky-400', emerald: 'bg-emerald-400', slate: 'bg-slate-300' };
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 transition ${onClick ? 'hover:bg-slate-50 hover:border-slate-300' : ''}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[tone] || dotColors.slate}`} />
      {label} <span className="font-bold">{value}</span>
    </Component>
  );
}

function CampusCard({ college, selected, onToggleSelect, onInvite }) {
  const statusLabel = {
    available: 'Ready',
    pending: college.initiatedBy === 'company' ? 'Sent' : 'Invited',
    accepted: 'Connected',
    rejected: 'Closed'
  };

  return (
    <div className={`bg-white p-4 transition ${selected ? 'ring-2 ring-indigo-200 ring-inset' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            disabled={!college.canInvite}
            onChange={onToggleSelect}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
          />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-900">{college.collegeName}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400">
              <FiMapPin size={10} className="shrink-0" />{college.location || 'Location not shared'}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[college.status] || STATUS_STYLE.available}`}>
          {statusLabel[college.status] || college.status}
        </span>
      </div>

      <div className="mt-2.5 space-y-1 text-[11px] text-slate-500">
        {college.placementOfficerName && (
          <p className="flex items-center gap-1.5"><FiUser size={10} className="text-slate-400" />{college.placementOfficerName}</p>
        )}
        {college.contactEmail && (
          <p className="flex items-center gap-1.5"><FiMail size={10} className="text-slate-400" /><span className="truncate">{college.contactEmail}</span></p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onInvite}
          disabled={!college.canInvite}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            college.canInvite ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <FiSend size={10} />
          {college.status === 'rejected' ? 'Request again' : 'Send request'}
        </button>
        {college.website && (
          <a href={college.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600">
            <FiLink size={10} /> Website
          </a>
        )}
      </div>
    </div>
  );
}

function RequestModal({
  colleges,
  requestType,
  requestMessage,
  onChangeRequestType,
  onChangeRequestMessage,
  onClose,
  onSubmit,
  submitting
}) {
  const previewColleges = colleges.slice(0, 10);
  const remainingCollegesCount = Math.max(colleges.length - previewColleges.length, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-sm px-4 py-6">
      <div className="flex min-h-full items-start justify-center">
        <div className="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                {colleges.length > 1 ? `Send ${colleges.length} campus requests` : `Send request to ${colleges[0]?.collegeName || 'campus'}`}
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-500">Placement teams will be notified via portal and email.</p>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">
              <FiX size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Selected ({colleges.length})</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {previewColleges.map((college) => (
                  <span key={college.collegeId} className="inline-flex max-w-full items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700" title={college.collegeName}>
                    <span className="truncate">{college.collegeName}</span>
                  </span>
                ))}
                {remainingCollegesCount > 0 && <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">+{remainingCollegesCount} more</span>}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Request type</p>
              <div className="mt-2 flex gap-2">
                {REQUEST_TYPE_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => onChangeRequestType(option.value)} className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${requestType === option.value ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="campus-request-message">Message</label>
              <textarea
                id="campus-request-message"
                value={requestMessage}
                onChange={(event) => onChangeRequestMessage(event.target.value)}
                rows={5}
                placeholder="Describe whether you want a campus drive, talent pool access, or both."
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={onSubmit} disabled={submitting || !colleges.length} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {submitting ? <FiRefreshCw size={12} className="animate-spin" /> : <FiSend size={12} />}
              {submitting ? 'Sending...' : 'Send request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
