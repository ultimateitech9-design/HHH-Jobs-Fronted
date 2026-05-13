import { useEffect, useMemo, useState } from 'react';
import { 
  FiFileText, 
  FiSearch, 
  FiPieChart, 
  FiUsers, 
  FiAward, 
  FiExternalLink,
  FiChevronDown,
  FiActivity
} from 'react-icons/fi';
import { formatDateTime, getAdminApplications } from '../services/adminApi';

const initialFilters = {
  status: 'all',
  search: ''
};

const statusToApi = (status) => (status === 'all' ? '' : status);

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'hired':
    case 'offered': 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'interviewed':
    case 'shortlisted': 
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'applied': 
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    case 'rejected': 
      return 'bg-red-100 text-red-700 border-red-200';
    default: 
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplications = async (nextStatus = filters.status) => {
    setLoading(true);
    setError('');
    const response = await getAdminApplications({ status: statusToApi(nextStatus) });
    setApplications(response.data || []);
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    loadApplications(initialFilters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredApplications = useMemo(() => {
    const search = String(filters.search || '').toLowerCase().trim();
    if (!search) return applications;

    return applications.filter((application) =>
      `${application.applicantEmail || ''} ${application.applicantId || ''} ${application.jobId || ''}`
        .toLowerCase()
        .includes(search)
    );
  }, [applications, filters.search]);

  const stats = useMemo(() => {
    const stageCount = (stage) => applications.filter((item) => item.status === stage).length;
    const shortlistedCount = stageCount('shortlisted') + stageCount('interviewed');
    const offeredCount = stageCount('offered') + stageCount('hired');

    return [
      {
        label: 'Total Submissions',
        value: String(applications.length),
        helper: 'Gross application volume',
        icon: <FiFileText className="text-blue-500" />,
        bg: 'bg-blue-50'
      },
      {
        label: 'New Pipeline',
        value: String(stageCount('applied')),
        helper: 'Unprocessed applications',
        icon: <FiActivity className="text-purple-500" />,
        bg: 'bg-purple-50'
      },
      {
        label: 'Active Engagement',
        value: String(shortlistedCount),
        helper: `${stageCount('shortlisted')} isolated, ${stageCount('interviewed')} active calls`,
        icon: <FiUsers className="text-amber-500" />,
        bg: 'bg-amber-50'
      },
      {
        label: 'Successful Placements',
        value: String(offeredCount),
        helper: `${stageCount('offered')} offers out, ${stageCount('hired')} closed`,
        icon: <FiAward className="text-emerald-500" />,
        bg: 'bg-emerald-50'
      }
    ];
  }, [applications]);

  return (
    <div className="space-y-8 pb-10">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary tracking-tight mb-2 flex items-center gap-3">
            Cross-Portal Monitoring
          </h1>
          <p className="text-neutral-500 text-lg">Observe candidate telemetrics and marketplace liquidity across all HR funnels.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200 shadow-sm font-semibold">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card) => (
          <article key={card.label} className="bg-white rounded-[2rem] p-6 border border-neutral-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-2xl font-black text-primary mb-1">{card.value}</h3>
              <p className="text-sm font-bold text-neutral-600 mb-0.5">{card.label}</p>
              <p className="text-xs font-medium text-neutral-400">{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Analytics Table Panel */}
      <section className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col min-h-[520px] md:rounded-[2.5rem] md:min-h-[600px]">
        <div className="border-b border-neutral-100 bg-neutral-50/50 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <FiPieChart className="text-brand-500" /> Application Data Stream
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <div className="relative w-full sm:w-auto">
                <select 
                  value={filters.status} 
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setFilters({ ...filters, status: nextStatus });
                    loadApplications(nextStatus);
                  }}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm text-neutral-700 appearance-none shadow-sm sm:min-w-[170px]"
                >
                  <option value="all">All Stages</option>
                  <option value="applied">Applied (Raw)</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="offered">Offered</option>
                  <option value="hired">Hired (Closed)</option>
                  <option value="rejected">Rejected (Dropped)</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full flex-1 sm:min-w-[250px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={filters.search}
                  placeholder="Query vector by Email or UID..."
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-x-auto custom-scrollbar">
          {loading ? (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
             </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[920px] xl:min-w-[1000px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="p-4 pl-6 text-xs font-black text-neutral-400 uppercase tracking-widest">Candidate Identity</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Job Linkage</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Funnel State</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest text-right pr-6">Chronology</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-neutral-500 font-medium">
                    No matching pipeline vectors found in the current timeframe.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 pl-6 align-top">
                      <div className="font-bold text-primary text-sm flex items-center gap-2">
                        {app.applicantEmail || 'Confidential Data'}
                        {app.resumeUrl && (
                          <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-700 transition-colors bg-brand-50 p-1 rounded-md" title="View Resume Attachment">
                            <FiExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-neutral-400 font-bold tracking-wider mt-1">UUID: {app.applicantId ? String(app.applicantId).slice(-10) : 'UNK'}</div>
                    </td>
                    
                    <td className="p-4 align-top">
                       <span className="inline-block px-2 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs font-mono font-bold text-neutral-600 mb-1">
                         JOB-{String(app.jobId).toUpperCase().slice(-8)}
                       </span>
                       <div className="font-bold text-neutral-400 text-[10px] uppercase tracking-wider">
                         HR-{String(app.hrId).toUpperCase().slice(-8)}
                       </div>
                    </td>
                    
                    <td className="p-4 align-top">
                       <div className="flex flex-col items-start gap-1">
                         <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest border inline-block ${getStatusBadge(app.status || 'applied')}`}>
                           {app.status || 'applied'}
                         </span>
                       </div>
                    </td>
                    
                    <td className="p-4 pr-6 align-top text-right">
                       <div className="font-bold text-primary text-xs mb-1">
                         T-STAMP: {formatDateTime(app.statusUpdatedAt)}
                       </div>
                       <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                         INIT: {formatDateTime(app.createdAt)}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default AdminApplicationsPage;
