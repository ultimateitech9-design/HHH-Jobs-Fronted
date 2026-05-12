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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Campus Connections</h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-500">
            Discover platform campuses, send campus-drive or campus-pool requests, and open dedicated pages for every relationship stage.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatPill label="Pending" value={incomingInvites.length} tone="amber" onClick={() => navigate('/portal/hr/campus-connections/activity/incoming')} />
            <StatPill label="Sent" value={outgoingRequests.length} tone="blue" onClick={() => navigate('/portal/hr/campus-connections/activity/sent')} />
            <StatPill label="Connected" value={activeConnections.length} tone="emerald" onClick={() => navigate('/portal/hr/campus-connections/activity/connected')} />
            <StatPill label="Closed" value={closedConnections.length} tone="slate" onClick={() => navigate('/portal/hr/campus-connections/activity/closed')} />
            <StatPill label="Campuses" value={directory.summary?.totalColleges || 0} tone="slate" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/portal/hr/campus-connections/activity/sent')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Open activity
          </button>
          <button
            type="button"
            onClick={() => openRequestModal(selectedCollegeIds)}
            disabled={!selectedColleges.length}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <FiSend size={14} />
            Request selected{selectedColleges.length ? ` (${selectedColleges.length})` : ''}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <FiRefreshCw size={24} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-navy">Discover Campus Partners</h2>
              <p className="text-sm text-slate-500">
                {readyToInviteCount} campuses available for outreach out of {directory.summary?.totalColleges || 0} on the platform.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <label className="relative block min-w-0 flex-1 sm:min-w-[320px]">
                <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setSearch(nextValue);
                    });
                  }}
                  placeholder="Search campus, city, placement officer..."
                  className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  disabled={!visibleInviteableIds.length}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {allVisibleSelected ? 'Unselect visible' : 'Select visible'}
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={!selectedColleges.length}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
                <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                  {selectedColleges.length} selected
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span>Showing {filteredColleges.length} campuses</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">Search ranked for fastest relevant matches</span>
          </div>

          {filteredColleges.length === 0 ? (
            <div className="py-16 text-center">
              <FiUsers size={32} className="mx-auto text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-500">No campuses matched</p>
              <p className="mt-2 text-sm text-slate-400">Try a different search term or refresh the campus directory.</p>
            </div>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${tones[tone] || tones.slate} ${onClick ? 'hover:-translate-y-[1px]' : ''}`}
    >
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </Component>
  );
}

function CampusCard({ college, selected, onToggleSelect, onInvite }) {
  const statusLabel = {
    available: 'Ready',
    pending: college.initiatedBy === 'company' ? 'Sent' : 'Invited',
    accepted: 'Connected',
    rejected: 'Again'
  };

  return (
    <div className={`rounded-[1rem] border bg-white p-3 transition ${selected ? 'border-brand-300 shadow-[0_8px_20px_rgba(245,158,11,0.1)]' : 'border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.04)]'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-start gap-2.5">
          <label className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${college.canInvite ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-100'}`}>
            <input
              type="checkbox"
              checked={selected}
              disabled={!college.canInvite}
              onChange={onToggleSelect}
              className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
            />
          </label>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold leading-5 text-navy">{college.collegeName}</p>
            <p className="mt-1 truncate text-[13px] text-slate-500">{college.location || 'Location not shared'}</p>
          </div>
        </div>

        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[college.status] || STATUS_STYLE.available}`}>
          {statusLabel[college.status] || college.status}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-[13px] text-slate-600">
        {college.placementOfficerName ? (
          <p className="flex items-center gap-2">
            <FiUser size={12} className="text-slate-400" />
            <span className="truncate">{college.placementOfficerName}</span>
          </p>
        ) : null}
        {college.contactEmail ? (
          <p className="flex items-center gap-2">
            <FiMail size={12} className="text-slate-400" />
            <span className="truncate">{college.contactEmail}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onInvite}
          disabled={!college.canInvite}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
            college.canInvite
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          <FiSend size={12} />
          {college.status === 'rejected' ? 'Request again' : 'Send request'}
        </button>

        {college.website ? (
          <a
            href={college.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
          >
            <FiLink size={12} />
            Website
          </a>
        ) : null}
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/35 backdrop-blur-[2px] px-4 py-4 sm:py-6">
      <div className="flex min-h-full items-start justify-center">
        <div className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#fffdf8_100%)] shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-3rem)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Campus Outreach</p>
              <h2 className="mt-2 text-xl font-extrabold text-navy">
                {colleges.length > 1 ? `Send ${colleges.length} campus requests` : `Send request to ${colleges[0]?.collegeName || 'campus'}`}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Selected campus placement teams will receive this request inside the portal and on email.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="rounded-[1.25rem] border border-slate-200 bg-white/90 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Selected Campuses</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {colleges.length} selected
                  </span>
                  {remainingCollegesCount ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      +{remainingCollegesCount} more in queue
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {previewColleges.map((college) => (
                  <span
                    key={college.collegeId}
                    className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                    title={college.collegeName}
                  >
                    <span className="truncate">{college.collegeName}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700">Request type</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REQUEST_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChangeRequestType(option.value)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      requestType === option.value
                        ? 'bg-brand-500 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="campus-request-message">
                Request message
              </label>
              <textarea
                id="campus-request-message"
                value={requestMessage}
                onChange={(event) => onChangeRequestMessage(event.target.value)}
                rows={6}
                placeholder="Describe whether you want a campus drive, talent pool access, or both."
                className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Review once and send to the selected campus hiring contacts.</p>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !colleges.length}
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {submitting ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSend size={14} />}
                {submitting ? 'Sending...' : colleges.length > 1 ? 'Send requests' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
