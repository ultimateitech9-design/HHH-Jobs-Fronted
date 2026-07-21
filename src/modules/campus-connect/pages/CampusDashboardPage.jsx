import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiLink,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import DashboardFocusNav from '../../../shared/components/dashboard/DashboardFocusNav';
import DashboardPageHeader from '../../../shared/components/dashboard/DashboardPageHeader';
import DashboardSectionCard from '../../../shared/components/dashboard/DashboardSectionCard';
import DashboardSummaryStrip from '../../../shared/components/dashboard/DashboardSummaryStrip';
import useDashboardView from '../../../shared/hooks/useDashboardView';
import { getCampusStats } from '../services/campusConnectApi';

const empty = {
  totalStudents: 0, placedStudents: 0, unplacedStudents: 0, placementRate: 0,
  avgSalary: 0, highestSalary: 0, totalDrives: 0, upcomingDrives: 0,
  completedDrives: 0, totalConnections: 0, acceptedConnections: 0, pendingConnections: 0,
  branchStats: [], recentDrives: []
};

const CAMPUS_DASHBOARD_VIEWS = ['placement', 'branches', 'drives'];

export default function CampusDashboardPage() {
  const [activeView, setActiveView] = useDashboardView(CAMPUS_DASHBOARD_VIEWS, 'placement');
  const [stats, setStats] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const poolStats = useMemo(() => {
    const activePools = Number(stats.upcomingDrives || 0);
    const totalPools = Number(stats.totalDrives || 0);
    const closedPools = Math.max(0, totalPools - activePools);

    return [
      { label: 'Active Pools', value: activePools, sub: 'Live or upcoming drives', icon: FiBriefcase, color: 'text-brand-600' },
      { label: 'Closed Pools', value: closedPools, sub: 'Completed or archived drives', icon: FiCheckCircle, color: 'text-slate-600' },
      { label: 'Completed Drives', value: stats.completedDrives, sub: 'Placement cycles closed', icon: FiAward, color: 'text-emerald-600' },
      { label: 'Pending Requests', value: stats.pendingConnections, sub: 'Company connection queue', icon: FiLink, color: 'text-violet-600' }
    ];
  }, [stats]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCampusStats().then((statsRes) => {
      if (!mounted) return;
      setStats({ ...empty, ...(statsRes.data || {}) });
      setError(statsRes.error || '');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const focusItems = [
    { key: 'placement', label: 'Placement health', description: 'Review placement outcomes, packages, pools, and pending company requests.', count: stats.placedStudents, icon: FiTrendingUp },
    { key: 'branches', label: 'Branch performance', description: 'Compare placement progress across academic branches.', count: stats.branchStats?.length || 0, icon: FiUsers },
    { key: 'drives', label: 'Recent drives', description: 'Review current drive status and continue placement execution.', count: stats.recentDrives?.length || 0, icon: FiBriefcase }
  ];

  return (
    <div className="vw-shell space-y-3 pb-8">
      <DashboardPageHeader
        eyebrow="Campus operations"
        title="Placement command center"
        description="Track students, placement outcomes, company connections, and drives without mixing workflows."
        actions={(
          <Link to="/portal/campus-connect/drives" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-[#183f70]">
            <FiBriefcase size={15} /> Schedule drive
          </Link>
        )}
      />

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {error} — showing cached data.
        </div>
      )}

      <DashboardSummaryStrip
        loading={loading}
        items={[
          { label: 'Registered students', value: Number(stats.totalStudents || 0).toLocaleString('en-IN'), helper: 'Current student base', icon: FiUsers, to: '/portal/campus-connect/students' },
          { label: 'Students placed', value: Number(stats.placedStudents || 0).toLocaleString('en-IN'), helper: `${stats.placementRate || 0}% placement rate`, icon: FiCheckCircle, to: '/portal/campus-connect/reports' },
          { label: 'Campus drives', value: Number(stats.totalDrives || 0).toLocaleString('en-IN'), helper: `${stats.upcomingDrives || 0} upcoming`, icon: FiBriefcase, to: '/portal/campus-connect/drives' },
          { label: 'Company connections', value: Number(stats.acceptedConnections || 0).toLocaleString('en-IN'), helper: `${stats.pendingConnections || 0} pending`, icon: FiLink, to: '/portal/campus-connect/connections' }
        ]}
      />

      <DashboardFocusNav items={focusItems} activeKey={activeView} onChange={setActiveView} label="Campus dashboard workspaces" title="Placement view" />

      {activeView === 'placement' ? (
          <DashboardSectionCard
            eyebrow="Placement health"
            title="Outcome and pool summary"
            subtitle="A concise view of packages, placement progress, and active placement cycles."
            id="dashboard-view-placement"
            role="tabpanel"
            aria-labelledby="dashboard-tab-placement"
          >
          <div className="divide-y divide-slate-100">
            {[
              ['Placement rate', `${stats.placementRate || 0}%`, `${stats.placedStudents || 0} of ${stats.totalStudents || 0} students placed`],
              ['Average package', stats.avgSalary ? `₹${(stats.avgSalary / 100000).toFixed(1)}L` : '—', 'Per annum'],
              ['Highest package', stats.highestSalary ? `₹${(stats.highestSalary / 100000).toFixed(1)}L` : '—', 'Per annum'],
              ...poolStats.map((item) => [item.label, Number(item.value || 0).toLocaleString('en-IN'), item.sub])
            ].map(([label, value, helper]) => (
              <div key={label} className="flex min-h-14 items-center justify-between gap-4 px-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy">{label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{helper}</p>
                </div>
                <strong className="shrink-0 text-lg font-black text-slate-800">{loading ? '--' : value}</strong>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      ) : null}

      {activeView === 'branches' ? (
          <DashboardSectionCard
            eyebrow="Branch performance"
            title="Branch-wise placement"
            subtitle="Placement progress by academic branch."
            id="dashboard-view-branches"
            role="tabpanel"
            aria-labelledby="dashboard-tab-branches"
          >
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : stats.branchStats?.length === 0 ? (
            <p className="text-sm text-slate-400">No branch data yet. Import students to see stats.</p>
          ) : (
            <div className="space-y-3">
              {stats.branchStats.map((b, index) => (
                <div key={`${b.branch || 'branch'}-${index}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{b.branch}</span>
                    <span className="text-sm font-semibold text-slate-500">{b.placed}/{b.total} placed ({b.rate}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${b.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSectionCard>
      ) : null}

      {activeView === 'drives' ? (
          <DashboardSectionCard
            eyebrow="Drive execution"
            title="Recent drives"
            subtitle="Current placement drives and their operational status."
            id="dashboard-view-drives"
            role="tabpanel"
            aria-labelledby="dashboard-tab-drives"
          >
          <div className="mb-5 flex items-center justify-between">
            <Link to="/portal/campus-connect/drives" className="text-sm font-bold text-[#2d5bff]">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : stats.recentDrives?.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">No drives scheduled yet.</p>
              <Link
                to="/portal/campus-connect/drives"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
              >
                <FiBriefcase size={14} />
                Schedule first drive
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentDrives.map((drive, index) => (
                <div key={`${drive.id || drive._id || drive.company_name || 'drive'}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{drive.company_name}</p>
                    <p className="text-sm text-slate-500">{new Date(drive.drive_date).toDateString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                    drive.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    drive.status === 'upcoming' ? 'bg-brand-50 text-brand-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {drive.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardSectionCard>
      ) : null}

    </div>
  );
}
