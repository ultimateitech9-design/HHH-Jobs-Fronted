import { useEffect, useState } from 'react';
import {
  FiAward,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import { exportPlacementReport, getCampusStats } from '../services/campusConnectApi';

const empty = {
  totalStudents: 0, placedStudents: 0, unplacedStudents: 0, placementRate: 0,
  avgSalary: 0, highestSalary: 0, totalDrives: 0, completedDrives: 0,
  acceptedConnections: 0, branchStats: []
};

export default function CampusReportsPage() {
  const [stats, setStats] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCampusStats().then(({ data, error: err }) => {
      if (!mounted) return;
      setStats({ ...empty, ...(data || {}) });
      setError(err || '');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPlacementReport();
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <FiRefreshCw size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Placement Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Full placement statistics and CSV export for your college.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full bg-[#2d5bff] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2449d8] disabled:opacity-70"
        >
          {exporting ? <FiRefreshCw size={15} className="animate-spin" /> : <FiDownload size={15} />}
          {exporting ? 'Exporting...' : 'Export CSV Report'}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: FiUsers, color: 'text-[#2d5bff]', bg: 'bg-blue-50' },
          { label: 'Placed', value: stats.placedStudents, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Placement Rate', value: `${stats.placementRate}%`, icon: FiTrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Highest Package', value: stats.highestSalary ? `₹${(stats.highestSalary / 100000).toFixed(1)}L` : '—', icon: FiAward, color: 'text-[#ff6b3d]', bg: 'bg-orange-50' }
        ].map((card) => (
          <div key={card.label} className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                <p className={`mt-1 text-3xl font-extrabold ${card.color}`}>{card.value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Salary summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Average Package', value: stats.avgSalary ? `₹${(stats.avgSalary / 100000).toFixed(2)}L` : '—' },
          { label: 'Highest Package', value: stats.highestSalary ? `₹${(stats.highestSalary / 100000).toFixed(2)}L` : '—' },
          { label: 'Students Yet to Place', value: stats.unplacedStudents }
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-navy">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Branch-wise full table */}
      <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)]">
        <h2 className="mb-5 text-lg font-extrabold text-navy">Branch-wise Placement Report</h2>
        {stats.branchStats?.length === 0 ? (
          <p className="text-sm text-slate-400">No branch data available. Import students first.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4">Branch</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Placed</th>
                  <th className="pb-3 pr-4">Seeking</th>
                  <th className="pb-3 pr-4">Rate</th>
                  <th className="pb-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.branchStats.map((b) => (
                  <tr key={b.branch}>
                    <td className="py-3 pr-4 font-semibold text-slate-800">{b.branch}</td>
                    <td className="py-3 pr-4 text-slate-600">{b.total}</td>
                    <td className="py-3 pr-4 font-bold text-emerald-600">{b.placed}</td>
                    <td className="py-3 pr-4 text-amber-600">{b.total - b.placed}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-bold ${b.rate >= 70 ? 'text-emerald-600' : b.rate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                        {b.rate}%
                      </span>
                    </td>
                    <td className="py-3 min-w-[120px]">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${b.rate >= 70 ? 'bg-emerald-500' : b.rate >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                          style={{ width: `${b.rate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export note */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
        <strong>Export contains:</strong> Student name, email, phone, degree, branch, graduation year, CGPA,
        placement status, company placed at, role, and package. Use this for NAAC/accreditation submissions,
        college annual reports, and placement brochures.
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="ml-4 inline-flex items-center gap-1.5 rounded-full bg-[#2d5bff] px-3 py-1 text-xs font-bold text-white hover:bg-[#2449d8] disabled:opacity-70"
        >
          <FiDownload size={12} />
          {exporting ? 'Downloading...' : 'Download now'}
        </button>
      </div>
    </div>
  );
}
