import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiCheckCircle,
  FiRefreshCw,
  FiSend,
  FiUser,
  FiX,
  FiXCircle
} from 'react-icons/fi';
import {
  createHrCampusConnection,
  fetchHrCampusConnectionDirectory,
  fetchHrCampusConnections,
  respondHrCampusConnection
} from '../services/hrApi';

const VIEW_META = {
  incoming: {
    label: 'Pending',
    title: 'Pending College Invites',
    description: 'Review campus invites from colleges and approve the ones you want to work with.'
  },
  sent: {
    label: 'Sent',
    title: 'Requests Sent',
    description: 'Track every campus request with exact date and time, and re-open the conversation when needed.'
  },
  connected: {
    label: 'Connected',
    title: 'Connected Colleges',
    description: 'See all active college collaborations that can support campus drives and talent-pool coordination.'
  },
  closed: {
    label: 'Closed',
    title: 'Closed Invitations',
    description: 'Review declined campus relationships and send a fresh request whenever the college is open to re-engage.'
  }
};

const REQUEST_TYPE_OPTIONS = [
  { value: 'drive', label: 'Campus drive' },
  { value: 'pool', label: 'Campus pool' },
  { value: 'both', label: 'Drive + pool' }
];

const VIEW_DOT_COLORS = {
  incoming: 'bg-amber-400',
  sent: 'bg-sky-400',
  connected: 'bg-emerald-400',
  closed: 'bg-slate-300'
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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

export default function HrCampusConnectionActivityPage() {
  const navigate = useNavigate();
  const { view = 'sent' } = useParams();
  const activeView = VIEW_META[view] ? view : 'sent';

  const [connections, setConnections] = useState([]);
  const [directory, setDirectory] = useState({ colleges: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [responding, setResponding] = useState({});
  const [requestModal, setRequestModal] = useState({ open: false, collegeIds: [] });
  const [requestType, setRequestType] = useState('both');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

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

  const itemsByView = {
    incoming: incomingInvites,
    sent: outgoingRequests,
    connected: activeConnections,
    closed: closedConnections
  };

  const activeItems = itemsByView[activeView] || [];

  const directoryByCollegeId = useMemo(
    () => Object.fromEntries((directory.colleges || []).map((college) => [college.collegeId, college])),
    [directory.colleges]
  );

  const requestModalColleges = useMemo(
    () => (directory.colleges || []).filter((college) => requestModal.collegeIds.includes(college.collegeId)),
    [directory.colleges, requestModal.collegeIds]
  );

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

  const handleRefresh = () => {
    setError('');
    setNotice('');
    loadPage({ silent: true });
  };

  const handleRespond = async (connectionId, status) => {
    setResponding((current) => ({ ...current, [connectionId]: status }));
    setError('');
    setNotice('');
    try {
      const updated = await respondHrCampusConnection(connectionId, status);
      setConnections((current) => current.map((connection) => (connection.id === updated.id ? updated : connection)));
      setNotice(status === 'accepted' ? 'Campus invite accepted.' : 'Campus invite declined.');
      await loadPage({ silent: true });
      navigate(`/portal/hr/campus-connections/activity/${status === 'accepted' ? 'connected' : 'closed'}`);
    } catch (responseError) {
      setError(responseError.message || 'Unable to update campus connection.');
    } finally {
      setResponding((current) => ({ ...current, [connectionId]: '' }));
    }
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
      setNotice(successCount === 1 ? 'Campus request sent successfully.' : `${successCount} campus requests sent successfully.`);
    }

    if (failedIds.length > 0) {
      setError(
        failedIds.length === results.length
          ? 'Unable to send campus requests right now.'
          : `${failedIds.length} campus request${failedIds.length > 1 ? 's were' : ' was'} not sent. You can retry them.`
      );
      setRequestModal({ open: true, collegeIds: failedIds });
    } else {
      closeRequestModal();
      navigate('/portal/hr/campus-connections/activity/sent');
    }

    await loadPage({ silent: true });
    setRequestSubmitting(false);
  };

  const handleRequestAgain = (connection) => {
    const college = connection?.college?.id ? directoryByCollegeId[connection.college.id] : null;
    if (!college?.canInvite) return;

    openRequestModal([college.collegeId], {
      draftMessage: connection.message || '',
      requestType: 'both'
    });
  };

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Campus Activity</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{VIEW_META[activeView].title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{VIEW_META[activeView].description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/portal/hr/campus-connections')}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            Back To Directory
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(VIEW_META).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(`/portal/hr/campus-connections/activity/${key}`)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold leading-none shadow-[0_1px_0_rgba(15,23,42,0.02)] transition ${
              activeView === key
                ? 'border-navy bg-navy text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${activeView === key ? 'bg-white/75' : VIEW_DOT_COLORS[key]}`} />
            <span>{meta.label}</span>
            <span className={activeView === key ? 'font-semibold text-white' : 'font-semibold text-slate-900'}>{itemsByView[key].length}</span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-100 bg-white/70">
          <FiRefreshCw size={24} className="animate-spin text-brand-500" />
        </div>
      ) : activeItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white/80 px-5 py-16 text-center shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
          <p className="text-base font-semibold text-slate-500">No {VIEW_META[activeView].label.toLowerCase()} items yet.</p>
          <p className="mt-2 text-sm text-slate-400">This page updates as your campus relationships move forward.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeItems.map((connection) => (
            <ActivityRow
              key={connection.id}
              connection={connection}
              view={activeView}
              loadingState={responding[connection.id]}
              onAccept={() => handleRespond(connection.id, 'accepted')}
              onDecline={() => handleRespond(connection.id, 'rejected')}
              onRequestAgain={() => handleRequestAgain(connection)}
              canRequestAgain={Boolean(directoryByCollegeId[connection.college?.id]?.canInvite)}
            />
          ))}
        </div>
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

function ActivityRow({
  connection,
  view,
  loadingState,
  onAccept,
  onDecline,
  onRequestAgain,
  canRequestAgain
}) {
  const college = connection.college || {};
  const timestamp = view === 'connected' || view === 'closed'
    ? formatDateTime(connection.respondedAt || connection.createdAt)
    : formatDateTime(connection.createdAt);

  const statusCopy = {
    incoming: `Invite received on ${timestamp}`,
    sent: `Request sent on ${timestamp}`,
    connected: `Connected on ${timestamp}`,
    closed: `Closed on ${timestamp}`
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.045)] transition hover:border-slate-200 hover:shadow-[0_22px_60px_rgba(15,23,42,0.07)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-extrabold tracking-tight text-navy">{college.name || 'Campus Partner'}</p>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${VIEW_DOT_COLORS[view] || VIEW_DOT_COLORS.closed}`} />
              {VIEW_META[view]?.label || view}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">{statusCopy[view] || timestamp}</p>
          {college.placementOfficerName ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
              <FiUser size={14} className="text-slate-400" />
              {college.placementOfficerName}
            </p>
          ) : null}
          {connection.message ? (
            <p className="mt-4 max-w-5xl rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm leading-7 text-slate-600">{connection.message}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {view === 'incoming' ? (
            <>
              <button
                type="button"
                onClick={onDecline}
                disabled={Boolean(loadingState)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-red-100 bg-white px-3.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {loadingState === 'rejected' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiXCircle size={14} />}
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                disabled={Boolean(loadingState)}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loadingState === 'accepted' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                Accept
              </button>
            </>
          ) : null}

          {(view === 'sent' || view === 'closed') ? (
            <button
              type="button"
              onClick={onRequestAgain}
              disabled={!canRequestAgain}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 text-xs font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSend size={14} />
              {view === 'closed' ? 'Request again' : 'Send again'}
            </button>
          ) : null}

          {view === 'connected' ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700">
              <FiCheckCircle size={14} />
              Connected
            </span>
          ) : null}
        </div>
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
              <label className="block text-sm font-semibold text-slate-700" htmlFor="campus-request-message-activity">
                Request message
              </label>
              <textarea
                id="campus-request-message-activity"
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
