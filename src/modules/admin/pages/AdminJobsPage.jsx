import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { 
  FiBriefcase, 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiEyeOff, 
  FiTrash2, 
  FiCheckCircle, 
  FiXCircle, 
  FiCheck,
  FiX,
  FiAlertCircle,
  FiChevronDown,
  FiInbox
} from 'react-icons/fi';
import {
  deleteAdminJob,
  formatDateTime,
  getAdminJobs,
  updateAdminJobApproval,
  updateAdminJobStatus
} from '../services/adminApi';

const initialFilters = {
  status: 'all',
  approvalStatus: 'all',
  search: ''
};

const statusFilterToApi = (status) => (status === 'all' ? '' : status);

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'open':
    case 'approved': 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending': 
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'rejected': 
    case 'closed':
    case 'deleted':
      return 'bg-red-100 text-red-700 border-red-200';
    default: 
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const AdminJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [approvalDrafts, setApprovalDrafts] = useState({});

  const loadJobs = async (nextStatus = filters.status) => {
    setLoading(true);
    setError('');
    const response = await getAdminJobs({ status: statusFilterToApi(nextStatus) });
    setJobs(response.data || []);
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    loadJobs(initialFilters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredJobs = useMemo(() => {
    const approvalStatus = filters.approvalStatus === 'all' ? '' : filters.approvalStatus;
    const search = String(filters.search || '').toLowerCase().trim();

    return jobs.filter((job) => {
      const matchesApproval = !approvalStatus || String(job.approvalStatus || '').toLowerCase() === approvalStatus;
      const matchesSearch = !search || `${job.jobTitle || ''} ${job.companyName || ''}`.toLowerCase().includes(search);
      return matchesApproval && matchesSearch;
    });
  }, [jobs, filters]);

  const stats = useMemo(() => {
    const open = jobs.filter((job) => String(job.status || '').toLowerCase() === 'open').length;
    const closed = jobs.filter((job) => String(job.status || '').toLowerCase() === 'closed').length;
    const deleted = jobs.filter((job) => String(job.status || '').toLowerCase() === 'deleted').length;
    const pendingApproval = jobs.filter((job) => String(job.approvalStatus || '').toLowerCase() === 'pending').length;

    return [
      { 
        label: 'Total Active Postings', 
        value: String(jobs.length), 
        helper: 'Across all verified recruiters', 
        icon: <FiBriefcase className="text-blue-500" />,
        bg: 'bg-blue-50'
      },
      { 
        label: 'Awaiting Clearance', 
        value: String(pendingApproval), 
        helper: 'Needs moderation action', 
        icon: <FiAlertCircle className={pendingApproval > 0 ? "text-amber-500" : "text-emerald-500"} />,
        bg: pendingApproval > 0 ? 'bg-amber-50' : 'bg-emerald-50'
      },
      { 
        label: 'Currently Live', 
        value: String(open), 
        helper: 'Visible to student candidates', 
        icon: <FiCheckCircle className="text-emerald-500" />,
        bg: 'bg-emerald-50'
      },
      { 
        label: 'Closed or Hidden', 
        value: String(closed + deleted), 
        helper: `${closed} closed, ${deleted} force removed`, 
        icon: <FiEyeOff className="text-neutral-500" />,
        bg: 'bg-neutral-50'
      }
    ];
  }, [jobs]);

  const updateLocalJob = (jobId, patch) => {
    setJobs((current) => current.map((job) => ((job.id || job._id) === jobId ? { ...job, ...patch } : job)));
  };

  const removeLocalJob = (jobId) => {
    setJobs((current) => current.filter((job) => (job.id || job._id) !== jobId));
  };

  const handleUpdateJobStatus = async (job, status) => {
    const jobId = job.id || job._id;
    if (!jobId || String(job.status || '').toLowerCase() === status) return;

    setBusyAction(`status:${jobId}`);
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminJobStatus(jobId, status);
      updateLocalJob(jobId, updated);
      setMessage(`Job visibility marked as ${status}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update job status.'));
    } finally {
      setBusyAction('');
    }
  };

  const updateApprovalDraft = (jobId, key, value) => {
    setApprovalDrafts((current) => ({
      ...current,
      [jobId]: {
        approvalStatus: current[jobId]?.approvalStatus || '',
        approvalNote: current[jobId]?.approvalNote || '',
        [key]: value
      }
    }));
  };

  const getApprovalDraft = (job) => {
    const jobId = job.id || job._id;
    return (
      approvalDrafts[jobId] || {
        approvalStatus: job.approvalStatus || '',
        approvalNote: job.approvalNote || ''
      }
    );
  };

  const handleApplyApproval = async (job) => {
    const jobId = job.id || job._id;
    if (!jobId) return;

    const draft = getApprovalDraft(job);
    const approvalStatus = String(draft.approvalStatus || '').toLowerCase();
    if (!approvalStatus) {
      setError('Select an approval status (Approved/Rejected) first.');
      return;
    }

    setBusyAction(`approval:${jobId}`);
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminJobApproval(jobId, {
        approvalStatus,
        approvalNote: draft.approvalNote || ''
      });
      updateLocalJob(jobId, updated);
      setMessage(`Compliance clearance updated for "${job.jobTitle}".`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to modify clearance.'));
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteJob = async (job) => {
    const jobId = job.id || job._id;
    if (!jobId) return;
    if (!window.confirm(`Are you certain you want to forcefully and permanently delete "${job.jobTitle}"?`)) return;

    setBusyAction(`delete:${jobId}`);
    setError('');
    setMessage('');

    try {
      await deleteAdminJob(jobId);
      removeLocalJob(jobId);
      setMessage(`Purged "${job.jobTitle}" from database.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to delete database record.'));
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary tracking-tight mb-2 flex items-center gap-3">
            Oversight & Moderation
          </h1>
          <p className="text-neutral-500 text-lg">Control lifecycle, compliance clearance, and retention of all platform job postings.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200 shadow-sm animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {message && !error && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200 shadow-sm animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card) => (
          <article key={card.label} className="bg-white rounded-[2rem] p-6 border border-neutral-100 shadow-sm flex items-start gap-4">
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

      {/* Job Registry Table */}
      <section className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col min-h-[520px] md:rounded-[2.5rem] md:min-h-[600px]">
        <div className="border-b border-neutral-100 bg-neutral-50/50 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <FiBriefcase className="text-brand-500" /> Posting Registry
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
                    loadJobs(nextStatus);
                  }}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm text-neutral-700 appearance-none shadow-sm sm:min-w-[170px]"
                >
                  <option value="all">All Visibility</option>
                  <option value="open">Live (Open)</option>
                  <option value="closed">Closed</option>
                  <option value="deleted">Soft Deleted</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full sm:w-auto">
                <select 
                  value={filters.approvalStatus} 
                  onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm text-neutral-700 appearance-none shadow-sm sm:min-w-[190px]"
                >
                  <option value="all">All Clearance Tracker</option>
                  <option value="pending">Needs Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full flex-1 sm:min-w-[220px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={filters.search}
                  placeholder="Search role or organization..."
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-auto custom-scrollbar">
          {loading ? (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
             </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[1040px] xl:min-w-[1200px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="p-4 pl-6 text-xs font-black text-neutral-400 uppercase tracking-widest">Listing Reference</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Metrics</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Visibility State</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-l border-neutral-200 bg-brand-50/50">Compliance Clearances</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-l border-neutral-200 bg-red-50/30 text-right pr-6">Data Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-neutral-500 font-medium">
                    No postings matched current operational filters.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const jobId = job.id || job._id;
                  const draft = getApprovalDraft(job);
                  const isStatusBusy = busyAction === `status:${jobId}`;
                  const isApprovalBusy = busyAction === `approval:${jobId}`;
                  const isDeleteBusy = busyAction === `delete:${jobId}`;
                  
                  return (
                    <tr key={jobId} className="hover:bg-neutral-50/30 transition-colors group">
                      <td className="p-4 pl-6 align-top">
                        <div className="font-bold text-primary text-base line-clamp-1">{job.jobTitle || 'Unknown Role'}</div>
                        <div className="font-bold text-neutral-500 text-sm mt-0.5">{job.companyName || 'Unknown Corp'}</div>
                        <div className="text-[10px] font-bold text-neutral-400 mt-2 uppercase tracking-wide">Created {formatDateTime(job.createdAt)}</div>
                      </td>
                      
                      <td className="p-4 align-top">
                        <div className="flex gap-4">
                          <div>
                            <span className="block text-xl font-black text-primary">{job.applicationsCount || 0}</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Apps</span>
                          </div>
                          <div>
                            <span className="block text-xl font-black text-neutral-600">{job.viewsCount || 0}</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Views</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4 align-top">
                        <div className="flex flex-col items-start gap-2">
                          <span className={`px-3 py-1.5 rounded-lg text-xs uppercase font-black tracking-wider border inline-block ${getStatusBadge(job.status || 'open')}`}>
                            {job.status || 'open'}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleUpdateJobStatus(job, 'open')}
                               className={`p-1.5 text-xs font-bold rounded-md transition-all ${job.status === 'open' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-emerald-700'} disabled:opacity-50`}
                               title="Set Live"
                             >
                               <FiEye size={14} />
                             </button>
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleUpdateJobStatus(job, 'closed')}
                               className={`p-1.5 text-xs font-bold rounded-md transition-all ${job.status === 'closed' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-neutral-500 hover:text-amber-700'} disabled:opacity-50`}
                               title="Close Applications"
                             >
                               <FiEyeOff size={14} />
                             </button>
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleUpdateJobStatus(job, 'deleted')}
                               className={`p-1.5 text-xs font-bold rounded-md transition-all ${job.status === 'deleted' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-neutral-500 hover:text-red-700'} disabled:opacity-50`}
                               title="Soft Delete"
                             >
                               <FiTrash2 size={14} />
                             </button>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4 border-l border-neutral-100 bg-brand-50/20 align-top">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <select
                               className={`flex-1 py-1 px-2 border rounded-md text-xs font-bold uppercase tracking-wide appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                 draft.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                 draft.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                 'bg-amber-50 text-amber-700 border-amber-200'
                               }`}
                               value={draft.approvalStatus}
                               onChange={(e) => updateApprovalDraft(jobId, 'approvalStatus', e.target.value)}
                             >
                               <option value="pending">Pending</option>
                               <option value="approved">Approved</option>
                               <option value="rejected">Rejected</option>
                             </select>
                             
                             <button 
                               className="bg-brand-600 text-white p-1 rounded hover:bg-brand-500 transition-colors disabled:opacity-50 shrink-0"
                               onClick={() => handleApplyApproval(job)}
                               disabled={isApprovalBusy || draft.approvalStatus === job.approvalStatus && draft.approvalNote === job.approvalNote}
                               title="Save Clearance"
                             >
                               <FiCheck size={14} />
                             </button>
                           </div>
                           
                           <input
                             className="w-full py-1.5 px-3 bg-white border border-brand-200 rounded-md text-xs font-medium placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                             placeholder="Internal compliance note..."
                             value={draft.approvalNote}
                             onChange={(e) => updateApprovalDraft(jobId, 'approvalNote', e.target.value)}
                           />
                        </div>
                      </td>
                      
                      <td className="p-4 pr-6 border-l border-neutral-100 bg-red-50/10 align-top text-right">
                        <div className="flex flex-col items-end gap-2">
                           <Link 
                             to={`/portal/admin/applications?jobId=${jobId}`} 
                             className="px-3 py-1.5 bg-neutral-100 text-neutral-600 hover:bg-brand-50 hover:text-brand-700 border border-neutral-200 hover:border-brand-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                           >
                             <FiInbox /> Apps DB
                           </Link>
                           
                           <button 
                             type="button" 
                             disabled={isDeleteBusy} 
                             onClick={() => handleDeleteJob(job)}
                             className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-50"
                           >
                             {isDeleteBusy ? 'Purging...' : 'Force Purge'}
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default AdminJobsPage;
