import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiMail,
  FiRefreshCw,
  FiSend,
  FiUser,
  FiX,
  FiXCircle
} from 'react-icons/fi';
import DataTable from '../../../shared/components/DataTable';
import {
  getCampusConnectionDirectory,
  getCampusConnections,
  inviteCampusCompany,
  respondToConnection
} from '../services/campusConnectApi';

const VIEW_META = {
  incoming: {
    label: 'Incoming',
    title: 'Incoming Requests',
    description: 'Review company requests and respond to valid hiring partnerships.',
    registerLabel: 'Incoming request register'
  },
  sent: {
    label: 'Sent',
    title: 'Invites Sent',
    description: 'See every company invite with exact send date and time, and send a follow-up when needed.',
    registerLabel: 'Sent invite register'
  },
  connected: {
    label: 'Connected',
    title: 'Connected Companies',
    description: 'Track active company relationships that already accepted your campus collaboration.',
    registerLabel: 'Connected company register'
  },
  declined: {
    label: 'Declined',
    title: 'Declined Requests',
    description: 'Review declined requests and re-invite the companies you still want to collaborate with.',
    registerLabel: 'Declined request register'
  }
};

const VIEW_ACCENT = {
  incoming: 'border-sky-200 bg-sky-50 text-sky-700',
  sent: 'border-brand-200 bg-brand-50 text-brand-700',
  connected: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-rose-200 bg-rose-50 text-rose-700'
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
};

const buildInviteDraft = (companies = []) => {
  if (companies.length <= 1) {
    return 'We would like to explore a campus hiring collaboration with your team. Our placement cell can share relevant student profiles, shortlist candidates, and coordinate the drive process smoothly.';
  }

  return 'We would like to explore a structured campus hiring collaboration with your team. Our placement cell can share relevant student profiles, align hiring requirements, and support end-to-end campus drive coordination.';
};

const getRowTimestamp = (connection, view) => (
  view === 'connected' || view === 'declined'
    ? connection.responded_at || connection.created_at
    : connection.created_at
);

const getVisiblePages = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);
};

export default function CampusRelationshipActivityPage() {
  const navigate = useNavigate();
  const { view = 'sent' } = useParams();
  const activeView = VIEW_META[view] ? view : 'sent';

  const [connections, setConnections] = useState([]);
  const [directory, setDirectory] = useState({ companies: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [responding, setResponding] = useState({});
  const [inviteModal, setInviteModal] = useState({ open: false, companyIds: [] });
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadPage = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const [connectionsResponse, directoryResponse] = await Promise.all([
      getCampusConnections(),
      getCampusConnectionDirectory()
    ]);

    setConnections(connectionsResponse.data || []);
    setDirectory(directoryResponse.data || { companies: [], summary: null });
    setError(connectionsResponse.error || directoryResponse.error || '');
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPage();
  }, []);

  const pendingIncoming = useMemo(
    () => connections.filter((connection) => connection.status === 'pending' && connection.initiation_source === 'company'),
    [connections]
  );
  const pendingOutgoing = useMemo(
    () => connections.filter((connection) => connection.status === 'pending' && connection.initiation_source === 'college'),
    [connections]
  );
  const connected = useMemo(
    () => connections.filter((connection) => connection.status === 'accepted'),
    [connections]
  );
  const declined = useMemo(
    () => connections.filter((connection) => connection.status === 'rejected'),
    [connections]
  );

  const itemsByView = {
    incoming: pendingIncoming,
    sent: pendingOutgoing,
    connected,
    declined
  };

  const activeItems = itemsByView[activeView] || [];

  const companyDirectoryByUserId = useMemo(
    () => Object.fromEntries((directory.companies || []).map((company) => [company.companyUserId, company])),
    [directory.companies]
  );

  const inviteModalCompanies = useMemo(
    () => (directory.companies || []).filter((company) => inviteModal.companyIds.includes(company.companyUserId)),
    [directory.companies, inviteModal.companyIds]
  );

  const openInviteModal = (companyIds, options = {}) => {
    const {
      allowExistingPending = false,
      draftMessage = ''
    } = options;

    const nextCompanies = (directory.companies || []).filter(
      (company) => companyIds.includes(company.companyUserId)
        && (company.canInvite || (allowExistingPending && company.status === 'pending'))
    );

    if (!nextCompanies.length) return;

    setInviteMessage(draftMessage || buildInviteDraft(nextCompanies));
    setInviteModal({
      open: true,
      companyIds: nextCompanies.map((company) => company.companyUserId)
    });
    setError('');
    setNotice('');
  };

  const closeInviteModal = () => {
    setInviteModal({ open: false, companyIds: [] });
    setInviteMessage('');
    setInviteSubmitting(false);
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
      const updated = await respondToConnection(connectionId, status);
      setConnections((current) => current.map((connection) => (connection.id === updated.id ? updated : connection)));
      setNotice(status === 'accepted' ? 'Company request accepted.' : 'Company request declined.');
      await loadPage({ silent: true });
      navigate(`/portal/campus-connect/relationship-activity/${status === 'accepted' ? 'connected' : 'declined'}`);
    } catch (responseError) {
      setError(responseError.message || 'Unable to update company request.');
    } finally {
      setResponding((current) => ({ ...current, [connectionId]: '' }));
    }
  };

  const handleInviteSubmit = async () => {
    if (!inviteModalCompanies.length) return;

    setInviteSubmitting(true);
    setError('');
    setNotice('');

    const results = await Promise.allSettled(
      inviteModalCompanies.map((company) => inviteCampusCompany({
        companyUserId: company.companyUserId,
        message: inviteMessage.trim()
      }))
    );

    const failedIds = results
      .map((result, index) => (result.status === 'rejected' ? inviteModalCompanies[index].companyUserId : null))
      .filter(Boolean);
    const successCount = results.length - failedIds.length;

    if (successCount > 0) {
      setNotice(successCount === 1 ? 'Company invite sent successfully.' : `${successCount} company invites sent successfully.`);
    }

    if (failedIds.length > 0) {
      setError(
        failedIds.length === results.length
          ? 'Unable to send company invites right now.'
          : `${failedIds.length} company invite${failedIds.length > 1 ? 's were' : ' was'} not sent. You can retry them.`
      );
      setInviteModal({ open: true, companyIds: failedIds });
    } else {
      closeInviteModal();
      navigate('/portal/campus-connect/relationship-activity/sent');
    }

    await loadPage({ silent: true });
    setInviteSubmitting(false);
  };

  const handleResend = (connection) => {
    if (!connection?.company_user_id || !companyDirectoryByUserId[connection.company_user_id]) return;

    openInviteModal([connection.company_user_id], {
      allowExistingPending: true,
      draftMessage: connection.message || ''
    });
  };

  const tableRows = useMemo(
    () => activeItems.map((connection) => {
      const companyProfile = companyDirectoryByUserId[connection.company_user_id] || null;
      return {
        ...connection,
        companyProfile,
        activityTimestamp: getRowTimestamp(connection, activeView)
      };
    }),
    [activeItems, companyDirectoryByUserId, activeView]
  );

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const paginatedRows = useMemo(
    () => tableRows.slice((page - 1) * pageSize, page * pageSize).map((row, index) => ({
      ...row,
      rowNumber: ((page - 1) * pageSize) + index + 1
    })),
    [tableRows, page, pageSize]
  );
  const visibleStart = tableRows.length ? ((page - 1) * pageSize) + 1 : 0;
  const visibleEnd = Math.min(page * pageSize, tableRows.length);
  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeView, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const columns = useMemo(
    () => buildColumns({
      activeView,
      responding,
      onAccept: (connection) => handleRespond(connection.id, 'accepted'),
      onDecline: (connection) => handleRespond(connection.id, 'rejected'),
      onResend: handleResend
    }),
    [activeView, responding]
  );

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 pb-12 font-body">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Campus Connect Activity</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-navy sm:text-[2.2rem]">
              {VIEW_META[activeView].title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              {VIEW_META[activeView].description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/portal/campus-connect/connections')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Open Company Network
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Sync Activity Feed
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.94))] px-5 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(VIEW_META).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => navigate(`/portal/campus-connect/relationship-activity/${key}`)}
                  className={`rounded-[1.15rem] border px-4 py-3 text-left transition ${
                    activeView === key
                      ? `${VIEW_ACCENT[key]} shadow-[0_10px_24px_rgba(15,23,42,0.08)]`
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-heading text-[15px] font-semibold tracking-[-0.02em]">{meta.label}</p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em]">
                    {itemsByView[key].length} entries
                  </p>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Campus Register
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                Audit-ready timestamps
              </span>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <FiRefreshCw size={24} className="animate-spin text-brand-500" />
        </div>
      ) : activeItems.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/85 px-6 py-16 text-center shadow-sm">
          <p className="font-heading text-2xl font-semibold tracking-[-0.03em] text-navy">
            No {VIEW_META[activeView].label.toLowerCase()} records yet
          </p>
          <p className="mt-2 text-sm text-slate-500">
            This register updates automatically as your company relationships move forward.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_52px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                {VIEW_META[activeView].registerLabel}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-navy">
                Structured partnership register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Company details, activity dates, notes, and platform actions are lined up in one clean register.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <RegisterStat label="Records" value={activeItems.length} />
              <RegisterStat label="Queue" value={VIEW_META[activeView].label} />
              <RegisterStat label="Page" value={`${page}/${totalPages}`} />
            </div>
          </div>

          <div className="px-3 py-3 sm:px-4 sm:py-4">
            <div className="mb-4 flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>
                  Showing <strong className="text-navy">{visibleStart}-{visibleEnd}</strong> of <strong className="text-navy">{tableRows.length}</strong> activity records
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  {VIEW_META[activeView].label} queue
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
                  >
                    {[5, 10, 20, 30].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <DataTable columns={columns} rows={paginatedRows} />

            <div className="mt-4 flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-slate-500">
                Page <span className="font-bold text-navy">{page}</span> of <span className="font-bold text-navy">{totalPages}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiChevronLeft size={14} />
                  Previous
                </button>

                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
                      pageNumber === page
                        ? 'border-brand-300 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {inviteModal.open ? (
        <InviteModal
          companies={inviteModalCompanies}
          inviteMessage={inviteMessage}
          onChangeInviteMessage={setInviteMessage}
          onClose={closeInviteModal}
          onSubmit={handleInviteSubmit}
          submitting={inviteSubmitting}
        />
      ) : null}
    </div>
  );
}

function buildColumns({
  activeView,
  responding,
  onAccept,
  onDecline,
  onResend
}) {
  const statusHeading = activeView === 'sent'
    ? 'Sent on'
    : activeView === 'connected'
      ? 'Connected on'
      : activeView === 'declined'
        ? 'Declined on'
        : 'Requested on';

  return [
    {
      key: 'rowNumber',
      label: '#',
      width: 66,
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-slate-400">
          {String(row.rowNumber).padStart(2, '0')}
        </span>
      )
    },
    {
      key: 'company_name',
      label: 'Company',
      width: 250,
      render: (_, row) => <CompanyCell row={row} />
    },
    {
      key: 'contact',
      label: 'Contact',
      width: 220,
      render: (_, row) => <ContactCell row={row} />
    },
    {
      key: 'activityTimestamp',
      label: statusHeading,
      width: 210,
      render: (_, row) => (
        <div>
          <div className="font-mono text-[12px] font-semibold text-slate-700">
            {formatDateTime(row.activityTimestamp)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {activeView === 'incoming'
              ? 'Company initiated'
              : activeView === 'sent'
                ? 'College initiated'
                : row.initiation_source === 'company'
                  ? 'Started by company'
                  : 'Started by college'}
          </div>
        </div>
      )
    },
    {
      key: 'message',
      label: 'Message / Notes',
      width: 360,
      render: (_, row) => <MessageCell row={row} />
    },
    {
      key: 'status',
      label: 'Status',
      width: 150,
      render: (_, row) => <StatusCell row={row} view={activeView} />
    },
    {
      key: 'actions',
      label: 'Action',
      width: 190,
      stickyRight: true,
      render: (_, row) => (
        <ActionCell
          row={row}
          view={activeView}
          loadingState={responding[row.id]}
          onAccept={() => onAccept(row)}
          onDecline={() => onDecline(row)}
          onResend={() => onResend(row)}
        />
      )
    }
  ];
}

function RegisterStat({ label, value }) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold tracking-[-0.03em] text-navy">{value}</p>
    </div>
  );
}

function CompanyCell({ row }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-heading text-[17px] font-semibold tracking-[-0.03em] text-navy">
        {row.company_name || 'Company'}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {row.companyProfile?.industryType || 'General'}
        </span>
        {row.companyProfile?.location ? (
          <span className="text-xs text-slate-500">{row.companyProfile.location}</span>
        ) : null}
      </div>
    </div>
  );
}

function ContactCell({ row }) {
  const contactName = row.companyProfile?.contactName || '';
  const contactEmail = row.companyProfile?.contactEmail || '';

  return (
    <div className="space-y-1.5">
      {contactName ? (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FiUser size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{contactName}</span>
        </div>
      ) : (
        <div className="text-sm text-slate-400">Contact not shared</div>
      )}

      {contactEmail ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FiMail size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{contactEmail}</span>
        </div>
      ) : null}
    </div>
  );
}

function MessageCell({ row }) {
  return row.message ? (
    <div className="max-w-[360px]">
      <p className="max-h-[4.8rem] overflow-hidden text-sm leading-6 text-slate-600" title={row.message}>
        {row.message}
      </p>
    </div>
  ) : (
    <span className="text-sm text-slate-400">No message added with this activity.</span>
  );
}

function StatusCell({ row, view }) {
  const label = view === 'incoming'
    ? 'Pending review'
    : view === 'sent'
      ? 'Invite sent'
      : view === 'connected'
        ? 'Connected'
        : 'Declined';

  const tone = view === 'incoming'
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : view === 'sent'
      ? 'border-brand-200 bg-brand-50 text-brand-700'
      : view === 'connected'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div className="flex flex-col gap-2">
      <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${tone}`}>
        {label}
      </span>
      {row.responded_at ? (
        <span className="font-mono text-[11px] text-slate-400">
          {formatDateTime(row.responded_at)}
        </span>
      ) : null}
    </div>
  );
}

function ActionCell({
  row,
  view,
  loadingState,
  onAccept,
  onDecline,
  onResend
}) {
  const canResend = Boolean(row.company_user_id && row.companyProfile);

  if (view === 'incoming') {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onAccept}
          disabled={Boolean(loadingState)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loadingState === 'accepted' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
          Approve Invite
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={Boolean(loadingState)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          {loadingState === 'rejected' ? <FiRefreshCw size={14} className="animate-spin" /> : <FiXCircle size={14} />}
          Decline Invite
        </button>
      </div>
    );
  }

  if (view === 'connected') {
    return (
      <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
        <FiCheckCircle size={14} />
        Partnership Active
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={!canResend}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
    >
      <FiSend size={14} />
      {view === 'declined' ? 'Restart Invite' : 'Send Follow-up'}
    </button>
  );
}

function InviteModal({
  companies,
  inviteMessage,
  onChangeInviteMessage,
  onClose,
  onSubmit,
  submitting
}) {
  const previewCompanies = companies.slice(0, 10);
  const remainingCompaniesCount = Math.max(companies.length - previewCompanies.length, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/35 backdrop-blur-[2px] px-4 py-4 sm:py-6">
      <div className="flex min-h-full items-start justify-center">
        <div className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#fffdf8_100%)] shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-3rem)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600">Invite Companies</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-navy">
                {companies.length > 1 ? `Send ${companies.length} company invites` : `Invite ${companies[0]?.companyName || 'company'}`}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The selected company HR contacts will receive this invite inside the portal and on email.
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
            <div className="rounded-[1.25rem] border border-slate-200 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Selected Companies</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {companies.length} selected
                  </span>
                  {remainingCompaniesCount ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      +{remainingCompaniesCount} more in queue
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {previewCompanies.map((company) => (
                  <span
                    key={company.companyUserId}
                    className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                    title={company.companyName}
                  >
                    <span className="truncate">{company.companyName}</span>
                  </span>
                ))}
              </div>

              {remainingCompaniesCount ? (
                <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  {remainingCompaniesCount} more selected companies will also receive this invite.
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.1rem] border border-slate-200 bg-white/90 px-4 py-3">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Delivery</p>
                <p className="mt-1 text-sm text-slate-600">Email notification enabled for selected HR contacts.</p>
              </div>
              <div className="rounded-[1.1rem] border border-slate-200 bg-white/90 px-4 py-3">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Workflow</p>
                <p className="mt-1 text-sm text-slate-600">Portal request will be created instantly after sending.</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="company-invite-message">
                Invite message
              </label>
              <textarea
                id="company-invite-message"
                value={inviteMessage}
                onChange={(event) => onChangeInviteMessage(event.target.value)}
                rows={5}
                placeholder="Introduce your campus, student strengths, and expected hiring collaboration."
                className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Review once and send to the selected hiring contacts.
            </p>

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
                disabled={submitting || !companies.length}
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {submitting ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSend size={14} />}
                {submitting ? 'Sending...' : companies.length > 1 ? 'Send invites' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
