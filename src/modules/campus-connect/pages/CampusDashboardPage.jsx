import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiLink,
  FiTrendingUp,
  FiUploadCloud,
  FiUsers
} from 'react-icons/fi';
import { getCampusStats } from '../services/campusConnectApi';

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
    <div className="flex items-center gap-3">
      {Icon && (
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color ? 'bg-brand-50' : 'bg-slate-50'}`}>
          <Icon size={16} className={color || 'text-slate-500'} />
        </span>
      )}
      <div className="min-w-0">
        <p className={`text-xl font-bold ${color || 'text-navy'}`}>{value ?? '—'}</p>
        <p className="truncate text-[11px] font-medium text-slate-500">{label}{sub ? ` • ${sub}` : ''}</p>
      </div>
    </div>
  </div>
);

const empty = {
  totalStudents: 0, placedStudents: 0, unplacedStudents: 0, placementRate: 0,
  avgSalary: 0, highestSalary: 0, totalDrives: 0, upcomingDrives: 0,
  completedDrives: 0, totalConnections: 0, acceptedConnections: 0, pendingConnections: 0,
  branchStats: [], recentDrives: []
};

export default function CampusDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const campusActions = useMemo(() => [
    { to: '/portal/campus-connect/students', label: 'Import Students', icon: FiUploadCloud },
    { to: '/portal/campus-connect/drives', label: 'Schedule Drive', icon: FiBriefcase },
    { to: '/portal/campus-connect/connections', label: 'Company Requests', icon: FiLink },
    { to: '/portal/campus-connect/reports', label: 'Placement Report', icon: FiAward }
  ], []);

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

  const handleCampusAction = (action) => {
    navigate(action.to);
  };

  return (
    <div className="vw-shell space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Campus Connect Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live placement overview for your college.</p>
        </div>
        <button
          type="button"
          onClick={() => handleCampusAction(campusActions[1])}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
        >
          <FiBriefcase size={15} />
          Schedule Drive
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {error} — showing cached data.
        </div>
      )}

      <div className="rounded-[1.5rem] border border-brand-100 bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Quick Actions</p>
            <p className="mt-1 text-sm font-semibold text-navy">Jump into the main placement workflows.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {campusActions.map((action, index) => (
              <button
                key={`${action.to || 'action'}-${index}`}
                type="button"
                onClick={() => handleCampusAction(action)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                <action.icon size={15} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? [1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[104px] animate-pulse rounded-[1.25rem] border border-slate-100 bg-white" />
        )) : poolStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? [1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[124px] animate-pulse rounded-[1.5rem] border border-slate-100 bg-white" />
        )) : (
          <>
            <StatCard label="Total Students" value={stats.totalStudents} icon={FiUsers} color="text-[#2d5bff]" sub="Registered in portal" />
            <StatCard label="Students Placed" value={stats.placedStudents} icon={FiCheckCircle} color="text-emerald-600" sub={`${stats.placementRate}% placement rate`} />
            <StatCard label="Campus Drives" value={stats.totalDrives} icon={FiBriefcase} color="text-brand-600" sub={`${stats.upcomingDrives} upcoming`} />
            <StatCard label="Company Connections" value={stats.acceptedConnections} icon={FiLink} color="text-violet-600" sub={`${stats.pendingConnections} pending`} />
          </>
        )}
      </div>

      {/* Salary highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? [1, 2, 3].map((item) => (
          <div key={item} className="h-[124px] animate-pulse rounded-[1.5rem] border border-slate-100 bg-white" />
        )) : (
          <>
            <StatCard label="Placement Rate" value={`${stats.placementRate}%`} icon={FiTrendingUp} color="text-emerald-600" />
            <StatCard label="Avg Package" value={stats.avgSalary ? `₹${(stats.avgSalary / 100000).toFixed(1)}L` : '—'} icon={FiAward} color="text-brand-600" sub="Per annum" />
            <StatCard label="Highest Package" value={stats.highestSalary ? `₹${(stats.highestSalary / 100000).toFixed(1)}L` : '—'} icon={FiAward} color="text-[#ff6b3d]" sub="Per annum" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch-wise placement */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
          <h2 className="mb-5 text-lg font-bold text-navy">Branch-wise Placement</h2>
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
                    <span className="text-xs font-bold text-slate-500">{b.placed}/{b.total} placed ({b.rate}%)</span>
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
        </div>

        {/* Recent Drives */}
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">Recent Drives</h2>
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
                    <p className="text-xs text-slate-500">{new Date(drive.drive_date).toDateString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
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
        </div>
      </div>

    </div>
  );
}
