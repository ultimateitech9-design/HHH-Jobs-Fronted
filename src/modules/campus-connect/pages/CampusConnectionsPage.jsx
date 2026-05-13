import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiBriefcase,
  FiLink,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import {
  getCampusConnectionDirectory,
  getCampusConnections,
  getCampusDrives,
  getCampusStats,
  inviteCampusCompany
} from '../services/campusConnectApi';

const STATUS_STYLES = {
  available: 'border-slate-200 bg-white text-slate-600',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-600'
};

const buildCompanySearchText = (company = {}) => [
  company.companyName,
  company.industryType,
  company.location,
  company.companySize,
  company.contactName,
  company.contactEmail
].join(' ').toLowerCase();

const normalizeSearchText = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

const tokenizeSearch = (value = '') => normalizeSearchText(value).split(' ').filter(Boolean);

const scoreCompanyMatch = (entry, rawTerm, tokens) => {
  if (!rawTerm) return 1;

  let score = 0;
  if (entry.companyName.startsWith(rawTerm)) score += 120;
  else if (entry.companyName.includes(rawTerm)) score += 80;

  if (entry.searchText.includes(rawTerm)) score += 30;

  for (const token of tokens) {
    if (entry.companyName.startsWith(token)) score += 24;
    else if (entry.companyName.includes(token)) score += 16;
    else if (entry.searchText.includes(token)) score += 8;
    else return 0;
  }

  return score;
};

const buildInviteDraft = (companies = []) => {
  if (companies.length <= 1) {
    return 'We would like to explore a campus hiring collaboration with your team. Our placement cell can share relevant student profiles, shortlist candidates, and coordinate the drive process smoothly.';
  }

  return 'We would like to explore a structured campus hiring collaboration with your team. Our placement cell can share relevant student profiles, align hiring requirements, and support end-to-end campus drive coordination.';
};

const normalizeCompanyKey = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const getConnectedDaysAgo = (value) => {
  if (!value) return 999;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 999;

  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
};

const buildDriveDraft = (company) => ({
  companyName: company.companyName,
  jobTitle: '',
  driveMode: 'on-campus',
  location: company.location || '',
  visibilityScope: 'campus_only',
  description: [
    `Campus Connect partnership is active with ${company.companyName}.`,
    company.openRoles
      ? `Start with ${company.openRoles} visible role${company.openRoles > 1 ? 's' : ''} and align the first shortlist workflow.`
      : 'Use this workflow to align the first shortlist and hiring round.',
    company.contactName ? `Primary hiring contact: ${company.contactName}.` : ''
  ].filter(Boolean).join(' ')
});

const buildPoolPreparationState = (company) => ({
  companyName: company.companyName,
  companyUserId: company.companyUserId,
  suggestedBranches: company.suggestedBranches || [],
  suggestion: company.hasDrive
    ? `Refresh the eligible student pool for ${company.companyName} before the next shortlist update.`
    : `Build a ready student pool for ${company.companyName} so a drive can be launched without delay.`
});

const buildConnectedActivationCompanies = ({ connections, directory, drives, totalStudents }) => {
  const directoryByUserId = Object.fromEntries(
    (directory.companies || []).map((company) => [company.companyUserId, company])
  );
  const driveCompanyCounts = (drives || []).reduce((accumulator, drive) => {
    const key = normalizeCompanyKey(drive.company_name || drive.companyName || '');
    if (!key) return accumulator;

    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const hasStudentPool = Number(totalStudents || 0) > 0;

  return (connections || [])
    .filter((connection) => connection.status === 'accepted')
    .map((connection) => {
      const directoryCompany = directoryByUserId[connection.company_user_id] || {};
      const companyName = connection.company_name || directoryCompany.companyName || 'Connected company';
      const openRoles = Number(directoryCompany.openRoles || 0);
      const companyKey = normalizeCompanyKey(companyName);
      const driveCount = driveCompanyCounts[companyKey] || 0;
      const hasDrive = driveCount > 0;
      const connectedDaysAgo = getConnectedDaysAgo(connection.responded_at || connection.created_at);
      const score = (
        (hasDrive ? 10 : 34)
        + Math.min(openRoles, 8) * 5
        + (directoryCompany.isVerified ? 12 : 0)
        + (directoryCompany.contactEmail ? 10 : 0)
        + (hasStudentPool ? 14 : 0)
        + (connectedDaysAgo <= 7 ? 18 : connectedDaysAgo <= 30 ? 10 : 4)
      );

      return {
        ...directoryCompany,
        companyUserId: connection.company_user_id,
        companyName,
        contactName: directoryCompany.contactName || '',
        contactEmail: directoryCompany.contactEmail || '',
        location: directoryCompany.location || '',
        companyWebsite: directoryCompany.companyWebsite || '',
        openRoles,
        driveCount,
        hasDrive,
        hasStudentPool,
        score,
        connectedDaysAgo,
        recommendedAction: !hasStudentPool
          ? 'Prepare Pool'
          : hasDrive
            ? 'Refresh Drive'
            : 'Launch Drive',
        recommendation: !hasStudentPool
          ? `Student pool is empty. Prepare candidates first so ${companyName} can move faster.`
          : hasDrive
            ? `${companyName} already has a linked workflow. Refresh the pool and keep the shortlist warm.`
            : `${companyName} is connected and has hiring potential. Launch the first drive while the partnership is fresh.`,
        suggestedBranches: Array.isArray(directoryCompany.preferredBranches) ? directoryCompany.preferredBranches : []
      };
    })
    .sort((left, right) => right.score - left.score || left.companyName.localeCompare(right.companyName));
};

export default function CampusConnectionsPage() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [directory, setDirectory] = useState({ companies: [], summary: null });
  const [drives, setDrives] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [inviteModal, setInviteModal] = useState({ open: false, companyIds: [] });
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const loadPage = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const [connectionsResponse, directoryResponse, drivesResponse, statsResponse] = await Promise.all([
      getCampusConnections(),
      getCampusConnectionDirectory(),
      getCampusDrives(),
      getCampusStats()
    ]);

    const nextConnections = connectionsResponse.data || [];
    const nextDirectory = directoryResponse.data || { companies: [], summary: null };

    setConnections(nextConnections);
    setDirectory(nextDirectory);
    setDrives(drivesResponse.data || []);
    setStats(statsResponse.data || {});
    setError(
      [connectionsResponse.error, directoryResponse.error, drivesResponse.error, statsResponse.error]
        .filter(Boolean)
        .join(' | ')
    );
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    const inviteableIds = new Set(
      (directory.companies || [])
        .filter((company) => company.canInvite)
        .map((company) => company.companyUserId)
    );

    setSelectedCompanyIds((current) => current.filter((id) => inviteableIds.has(id)));
    setInviteModal((current) => ({
      ...current,
      companyIds: current.companyIds.filter((id) => inviteableIds.has(id))
    }));
  }, [directory.companies]);

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

  const companyDirectoryIndex = useMemo(
    () => (directory.companies || []).map((company) => ({
      company,
      companyName: normalizeSearchText(company.companyName),
      searchText: normalizeSearchText(buildCompanySearchText(company))
    })),
    [directory.companies]
  );

  const connectedActivationCompanies = useMemo(
    () => buildConnectedActivationCompanies({
      connections,
      directory,
      drives,
      totalStudents: stats.totalStudents
    }),
    [connections, directory, drives, stats.totalStudents]
  );

  const connectedActivationMap = useMemo(
    () => Object.fromEntries(connectedActivationCompanies.map((company) => [company.companyUserId, company])),
    [connectedActivationCompanies]
  );

  const filteredCompanies = useMemo(() => {
    const rawTerm = normalizeSearchText(deferredSearch);
    const tokens = tokenizeSearch(rawTerm);
    if (!rawTerm) {
      return [...(directory.companies || [])]
        .sort((left, right) => {
          const leftActivation = connectedActivationMap[left.companyUserId];
          const rightActivation = connectedActivationMap[right.companyUserId];
          const leftRank = left.status === 'accepted' ? 0 : left.status === 'pending' ? 1 : left.canInvite ? 2 : 3;
          const rightRank = right.status === 'accepted' ? 0 : right.status === 'pending' ? 1 : right.canInvite ? 2 : 3;

          if (leftRank !== rightRank) return leftRank - rightRank;
          if ((rightActivation?.score || 0) !== (leftActivation?.score || 0)) {
            return (rightActivation?.score || 0) - (leftActivation?.score || 0);
          }
          if ((right.openRoles || 0) !== (left.openRoles || 0)) return (right.openRoles || 0) - (left.openRoles || 0);
          return left.companyName.localeCompare(right.companyName);
        })
        .slice(0, 120);
    }

    return companyDirectoryIndex
      .map((entry) => ({
        company: entry.company,
        score: scoreCompanyMatch(entry, rawTerm, tokens)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return (connectedActivationMap[right.company.companyUserId]?.score || 0) - (connectedActivationMap[left.company.companyUserId]?.score || 0)
          || left.company.companyName.localeCompare(right.company.companyName);
      })
      .slice(0, 120)
      .map((entry) => entry.company);
  }, [companyDirectoryIndex, connectedActivationMap, deferredSearch, directory.companies]);

  const visibleInviteableIds = useMemo(
    () => filteredCompanies.filter((company) => company.canInvite).map((company) => company.companyUserId),
    [filteredCompanies]
  );

  const selectedCompanies = useMemo(
    () => (directory.companies || []).filter((company) => selectedCompanyIds.includes(company.companyUserId)),
    [directory.companies, selectedCompanyIds]
  );

  const inviteModalCompanies = useMemo(
    () => (directory.companies || []).filter((company) => inviteModal.companyIds.includes(company.companyUserId)),
    [directory.companies, inviteModal.companyIds]
  );

  const readyToInviteCount = useMemo(
    () => (directory.companies || []).filter((company) => company.canInvite).length,
    [directory.companies]
  );

  const activationReadyCount = useMemo(
    () => connectedActivationCompanies.filter((company) => !company.hasDrive && company.hasStudentPool).length,
    [connectedActivationCompanies]
  );

  const connectedDriveCount = useMemo(
    () => connectedActivationCompanies.filter((company) => company.hasDrive).length,
    [connectedActivationCompanies]
  );

  const topActivationCompany = connectedActivationCompanies[0] || null;
  const allVisibleSelected = Boolean(
    visibleInviteableIds.length && visibleInviteableIds.every((id) => selectedCompanyIds.includes(id))
  );

  const handleRefresh = () => {
    setError('');
    setNotice('');
    loadPage({ silent: true });
  };

  const toggleCompanySelection = (company) => {
    if (!company.canInvite) return;

    setSelectedCompanyIds((current) => (
      current.includes(company.companyUserId)
        ? current.filter((id) => id !== company.companyUserId)
        : [...current, company.companyUserId]
    ));
  };

  const handleSelectAllVisible = () => {
    if (!visibleInviteableIds.length) return;

    setSelectedCompanyIds((current) => {
      if (visibleInviteableIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleInviteableIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleInviteableIds]));
    });
  };

  const handleClearSelection = () => {
    setSelectedCompanyIds([]);
  };

  const openDriveWorkspace = (company) => {
    navigate('/portal/campus-connect/drives', {
      state: {
        autoOpenDriveForm: true,
        prefillDrive: buildDriveDraft(company)
      }
    });
  };

  const openPoolWorkspace = (company) => {
    navigate('/portal/campus-connect/students', {
      state: {
        poolPreparation: buildPoolPreparationState(company)
      }
    });
  };

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
      setNotice(
        successCount === 1
          ? 'Company invite sent successfully.'
          : `${successCount} company invites sent successfully.`
      );
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
      setSelectedCompanyIds([]);
    }

    await loadPage({ silent: true });
    setInviteSubmitting(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1220px] space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Company Connections</h1>
          <p className="mt-1 text-sm text-slate-500">
            Discover portal companies, send structured invites, and track campus hiring relationships from one place.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatPill label="Incoming" value={pendingIncoming.length} tone="amber" onClick={() => navigate('/portal/campus-connect/relationship-activity/incoming')} />
            <StatPill label="Sent" value={pendingOutgoing.length} tone="blue" onClick={() => navigate('/portal/campus-connect/relationship-activity/sent')} />
            <StatPill label="Connected" value={connected.length} tone="emerald" onClick={() => navigate('/portal/campus-connect/relationship-activity/connected')} />
            <StatPill label="Declined" value={declined.length} tone="slate" onClick={() => navigate('/portal/campus-connect/relationship-activity/declined')} />
            <StatPill label="Portal Companies" value={directory.summary?.totalCompanies || 0} tone="slate" />
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
            onClick={() => navigate('/portal/campus-connect/relationship-activity/sent')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Open activity
          </button>
          <button
            type="button"
            onClick={() => openInviteModal(selectedCompanyIds)}
            disabled={!selectedCompanies.length}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <FiSend size={14} />
            Invite selected{selectedCompanies.length ? ` (${selectedCompanies.length})` : ''}
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
        <div className="flex min-h-[40vh] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white">
          <FiRefreshCw size={24} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <article className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(135deg,#fff9ef,#ffffff)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Connected activation board</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">
                {topActivationCompany
                  ? `${topActivationCompany.companyName} is your next business move`
                  : 'Convert accepted companies into live hiring workflows'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {topActivationCompany
                  ? topActivationCompany.recommendation
                  : 'As soon as a company is connected, you should be able to launch a drive or prepare an eligible pool directly from this workspace.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                  {connected.length} connected companies
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                  {stats.totalStudents || 0} students in pool
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                  {drives.length} total drive workflows
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {topActivationCompany ? (
                  <>
                    <button
                      type="button"
                      onClick={() => (
                        topActivationCompany.hasStudentPool
                          ? openDriveWorkspace(topActivationCompany)
                          : openPoolWorkspace(topActivationCompany)
                      )}
                      className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
                    >
                      {topActivationCompany.hasStudentPool ? <FiBriefcase size={14} /> : <FiUsers size={14} />}
                      {topActivationCompany.hasStudentPool
                        ? (topActivationCompany.hasDrive ? 'Refresh Drive Workspace' : 'Launch Drive Workspace')
                        : 'Prepare Eligible Pool'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openPoolWorkspace(topActivationCompany)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <FiUsers size={14} />
                      Open Pool Workspace
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/portal/campus-connect/relationship-activity/incoming')}
                    className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
                  >
                    <FiArrowRight size={14} />
                    Review Company Requests
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/portal/campus-connect/relationship-activity/connected')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiLink size={14} />
                  Review Connected Partners
                </button>
              </div>
            </article>

            <article className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <h2 className="text-lg font-bold text-navy">Activation summary</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Ready to launch', value: activationReadyCount, helper: 'Connected companies with pool support and no live drive yet' },
                  { label: 'Drive-linked partners', value: connectedDriveCount, helper: 'Connected companies already mapped to a drive workflow' },
                  { label: 'Pool status', value: stats.totalStudents ? 'Ready' : 'Empty', helper: stats.totalStudents ? 'Student pool can support connected company activation' : 'Import students before launching new partnerships' }
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                      <p className="text-lg font-bold text-navy">{item.value}</p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.helper}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Discover Portal Companies</h2>
                <p className="text-sm text-slate-500">
                  {readyToInviteCount} ready to invite out of {directory.summary?.totalCompanies || 0} companies on the portal.
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
                    placeholder="Search company, location, industry..."
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
                    disabled={!selectedCompanies.length}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {selectedCompanies.length} selected
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span>Showing {filteredCompanies.length} companies</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Search ranked for fastest relevant matches
              </span>
            </div>

            {filteredCompanies.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No portal companies matched"
                  description="Try another search term or refresh the directory."
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company.companyUserId}
                    company={company}
                    activation={connectedActivationMap[company.companyUserId] || null}
                    selected={selectedCompanyIds.includes(company.companyUserId)}
                    onToggleSelect={() => toggleCompanySelection(company)}
                    onInvite={() => openInviteModal([company.companyUserId])}
                    onOpenDrive={() => openDriveWorkspace(connectedActivationMap[company.companyUserId] || company)}
                    onPreparePool={() => openPoolWorkspace(connectedActivationMap[company.companyUserId] || company)}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
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

function StatPill({ label, value, tone, active = false, onClick }) {
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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${tones[tone] || tones.slate} ${active ? 'ring-2 ring-brand-200' : ''} ${onClick ? 'hover:-translate-y-[1px]' : ''}`}
    >
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </Component>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
      <FiLink size={30} className="mx-auto text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function CompanyCard({ company, activation, selected, onToggleSelect, onInvite, onOpenDrive, onPreparePool }) {
  const statusLabel = {
    available: 'Ready to invite',
    pending: company.initiatedBy === 'college' ? 'Invite sent' : 'Company requested',
    accepted: 'Connected',
    rejected: 'Re-invite'
  };
  const isConnected = company.status === 'accepted' && activation;

  return (
    <div className={`rounded-[1.1rem] border bg-white p-3 transition ${selected ? 'border-brand-300 shadow-[0_8px_20px_rgba(245,158,11,0.1)]' : 'border-slate-200 shadow-[0_6px_18px_rgba(15,23,42,0.04)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          {company.canInvite ? (
            <label className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white">
              <input
                type="checkbox"
                checked={selected}
                disabled={!company.canInvite}
                onChange={onToggleSelect}
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
              />
            </label>
          ) : (
            <div className={`mt-0.5 inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full ${
              isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {isConnected ? <FiBriefcase size={11} /> : <FiLink size={11} />}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-bold leading-5 text-navy">{company.companyName}</p>
              {company.isVerified ? <FiShield size={14} className="shrink-0 text-emerald-500" /> : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {company.industryType || 'Industry not shared'}{company.location ? ` · ${company.location}` : ''}
            </p>
          </div>
        </div>

        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[company.status] || STATUS_STYLES.available}`}>
          {statusLabel[company.status] || company.status}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-600">
        {company.contactName ? (
          <p className="flex items-center gap-2">
            <FiUser size={13} className="text-slate-400" />
            <span className="truncate">{company.contactName}</span>
          </p>
        ) : null}
        {company.contactEmail ? (
          <p className="flex items-center gap-2">
            <FiMail size={13} className="text-slate-400" />
            <span className="truncate">{company.contactEmail}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-2">
          <FiBriefcase size={13} className="text-slate-400" />
          {company.openRoles || 0} open roles
        </p>
      </div>

      {company.about ? (
        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-slate-500">{company.about}</p>
      ) : null}

      {isConnected ? (
        <div className="mt-3 rounded-[1rem] border border-emerald-100 bg-emerald-50/60 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Next business action</p>
              <p className="mt-1 text-sm font-bold text-navy">{activation.recommendedAction}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{activation.recommendation}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
              Score {activation.score}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-500">
              {activation.openRoles || 0} roles
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-500">
              {activation.hasDrive ? `${activation.driveCount} drive linked` : 'No drive linked'}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-500">
              {activation.hasStudentPool ? 'Pool ready' : 'Pool missing'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={activation.hasStudentPool ? onOpenDrive : onPreparePool}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#ef5c30]"
            >
              {activation.hasStudentPool ? <FiBriefcase size={13} /> : <FiUsers size={13} />}
              {activation.hasStudentPool
                ? (activation.hasDrive ? 'Refresh Drive' : 'Launch Drive')
                : 'Prepare Pool'}
            </button>
            <button
              type="button"
              onClick={onPreparePool}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiUsers size={13} />
              Open Pool
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onInvite}
            disabled={!company.canInvite}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              company.canInvite
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <FiSend size={13} />
            {company.status === 'rejected' ? 'Re-invite' : 'Invite'}
          </button>

          {company.companyWebsite ? (
            <a
              href={company.companyWebsite}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
            >
              <FiLink size={13} />
              Website
            </a>
          ) : null}
        </div>
      )}
    </div>
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
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Invite Companies</p>
              <h2 className="mt-2 text-xl font-bold text-navy">
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
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Selected Companies</p>
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
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Delivery</p>
                <p className="mt-1 text-sm text-slate-600">Email notification enabled for selected HR contacts.</p>
              </div>
              <div className="rounded-[1.1rem] border border-slate-200 bg-white/90 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Workflow</p>
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
