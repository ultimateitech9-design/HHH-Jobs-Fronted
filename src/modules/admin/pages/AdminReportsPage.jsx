import { useEffect, useMemo, useState } from 'react';
import { 
  FiFlag, 
  FiSearch, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle, 
  FiEye, 
  FiCheck,
  FiX,
  FiChevronDown,
  FiMessageSquare,
  FiFileText,
  FiSend
} from 'react-icons/fi';
import { formatDateTime, getAdminReports, updateAdminReport } from '../services/adminApi';

const initialFilters = {
  status: 'all',
  search: ''
};

const statusToApi = (status) => (status === 'all' ? '' : status);

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'resolved': 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'in_review': 
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'open': 
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'rejected': 
      return 'bg-red-100 text-red-700 border-red-200';
    default: 
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [reportDrafts, setReportDrafts] = useState({});

  const loadReports = async (nextStatus = filters.status) => {
    setLoading(true);
    setError('');
    const response = await getAdminReports({ status: statusToApi(nextStatus) });
    setReports(response.data || []);
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    loadReports(initialFilters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReports = useMemo(() => {
    const search = String(filters.search || '').toLowerCase().trim();
    if (!search) return reports;

    return reports.filter((report) =>
      `${report.targetType || ''} ${report.targetId || ''} ${report.reason || ''} ${report.details || ''}`
        .toLowerCase()
        .includes(search)
    );
  }, [reports, filters.search]);

  const stats = useMemo(() => {
    const open = reports.filter((item) => item.status === 'open').length;
    const inReview = reports.filter((item) => item.status === 'in_review').length;
    const resolved = reports.filter((item) => item.status === 'resolved').length;
    const rejected = reports.filter((item) => item.status === 'rejected').length;

    return [
      { 
        label: 'Total Reports', 
        value: String(reports.length), 
        helper: 'All submitted security flags', 
        icon: <FiFileText className="text-blue-500" />,
        bg: 'bg-blue-50'
      },
      { 
        label: 'Open Queue', 
        value: String(open), 
        helper: 'Pending triage', 
        icon: <FiAlertTriangle className={open > 0 ? "text-amber-500" : "text-emerald-500"} />,
        bg: open > 0 ? 'bg-amber-50' : 'bg-emerald-50'
      },
      { 
        label: 'Under Investigation', 
        value: String(inReview), 
        helper: 'Active moderation case', 
        icon: <FiEye className={inReview > 0 ? "text-indigo-500" : "text-neutral-500"} />,
        bg: inReview > 0 ? 'bg-indigo-50' : 'bg-neutral-50'
      },
      { 
        label: 'Closed Tickets', 
        value: String(resolved + rejected), 
        helper: `${resolved} resolved, ${rejected} rejected`, 
        icon: <FiCheckCircle className="text-emerald-500" />,
        bg: 'bg-emerald-50'
      }
    ];
  }, [reports]);

  const updateLocalReport = (reportId, patch) => {
    setReports((current) => current.map((report) => (report.id === reportId ? { ...report, ...patch } : report)));
  };

  const updateDraft = (reportId, key, value) => {
    setReportDrafts((current) => ({
      ...current,
      [reportId]: {
        status: current[reportId]?.status || '',
        adminNote: current[reportId]?.adminNote || '',
        escalationAction: current[reportId]?.escalationAction || '',
        assignedTeam: current[reportId]?.assignedTeam || '',
        [key]: value
      }
    }));
  };

  const getDraft = (report) => (
    reportDrafts[report.id] || {
      status: report.status || '',
      adminNote: report.adminNote || '',
      escalationAction: report.escalationAction || '',
      assignedTeam: report.assignedTeam || ''
    }
  );

  const handleUpdateReport = async (report) => {
    const draft = getDraft(report);
    const nextStatus = String(draft.status || '').toLowerCase();
    if (!nextStatus) {
      setError('Select a resolution status before saving.');
      return;
    }

    setBusyAction(report.id);
    setError('');
    setMessage('');

    const workflowNote = [
      draft.adminNote || '',
      draft.escalationAction ? `Next action: ${draft.escalationAction}` : '',
      draft.assignedTeam ? `Assigned to: ${draft.assignedTeam}` : ''
    ].filter(Boolean).join('\n');

    try {
      const updated = await updateAdminReport(report.id, {
        status: nextStatus,
        adminNote: workflowNote
      });
      updateLocalReport(report.id, updated);
      setMessage(`Support ticket ${report.id.slice(-6).toUpperCase()} updated.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update moderation report.'));
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-primary tracking-tight mb-2 flex items-center gap-3">
            Moderation Support
          </h1>
          <p className="text-neutral-500 text-lg">Review community flags, investigate violations, and enforce ecosystem rules.</p>
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

      {/* Trust & Safety Table */}
      <section className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 md:p-8 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                <FiFlag className="text-brand-500" /> Trust & Safety Inbox
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select 
                  value={filters.status} 
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setFilters({ ...filters, status: nextStatus });
                    loadReports(nextStatus);
                  }}
                  className="pl-3 pr-8 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm text-neutral-700 appearance-none shadow-sm min-w-[160px]"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open / Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:min-w-[250px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={filters.search}
                  placeholder="Search reason, ID, or description..."
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar relative">
          {loading ? (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
             </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="p-4 pl-6 text-xs font-black text-neutral-400 uppercase tracking-widest w-48">Incident Details</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest min-w-[250px]">User Report</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest w-32">Queue Status</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-l border-neutral-200 bg-brand-50/50 pr-6">Moderation Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-neutral-500 font-medium">
                    No support tickets found using current filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const draft = getDraft(report);
                  const isBusy = busyAction === report.id;
                  
                  return (
                    <tr key={report.id} className="hover:bg-neutral-50/30 transition-colors group">
                      <td className="p-4 pl-6 align-top">
                        <div className="font-extrabold text-primary text-sm uppercase mb-1">
                          <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded mr-2">{report.targetType || 'Item'}</span>
                        </div>
                        <div className="font-mono text-xs text-neutral-500 font-bold tracking-wider mb-2">ID: {report.targetId ? report.targetId.slice(-8) : 'UNK'}</div>
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                          {formatDateTime(report.createdAt)}
                        </div>
                      </td>
                      
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1.5 pr-4">
                           <strong className="text-sm font-extrabold text-primary flex items-center gap-1.5">
                             <FiAlertTriangle className="text-red-500 shrink-0" /> {report.reason || 'Flagged Content'}
                           </strong>
                           <p className="text-xs font-medium text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200 shadow-inner">
                             {report.details || 'No expanded details provided by user.'}
                           </p>
                        </div>
                      </td>
                      
                      <td className="p-4 align-top pt-5">
                         <span className={`px-3 py-1.5 rounded-lg text-xs uppercase font-black tracking-wider border inline-block ${getStatusBadge(report.status || 'open')}`}>
                           {(report.status || 'open').replace('_', ' ')}
                         </span>
                      </td>
                      
                      <td className="p-4 border-l border-neutral-100 bg-brand-50/20 align-top pr-6 w-[400px]">
                        <div className="space-y-3">
                           <div className="flex items-center gap-2">
                             <select
                               className={`flex-1 py-1.5 px-3 border rounded-lg text-xs font-bold uppercase tracking-wide appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-sm ${
                                 draft.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                 draft.status === 'in_review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                 draft.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                 'bg-amber-50 text-amber-700 border-amber-200'
                               }`}
                               value={draft.status}
                               onChange={(e) => updateDraft(report.id, 'status', e.target.value)}
                             >
                                <option value="open">Queue as Open</option>
                                <option value="in_review">Take Under Review</option>
                                <option value="resolved">Mark Resolved</option>
                                <option value="rejected">Reject Report</option>
                             </select>
                             
                             <button 
                               className="bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-500 transition-colors disabled:opacity-50 shrink-0 font-bold text-xs flex items-center gap-1.5 shadow-sm border border-brand-700"
                               onClick={() => handleUpdateReport(report)}
                               disabled={isBusy || (draft.status === report.status && draft.adminNote === report.adminNote && !draft.escalationAction && !draft.assignedTeam)}
                               title="Save Resolution"
                             >
                               {isBusy ? '...' : <><FiCheck size={14} /> Update</>}
                             </button>
                           </div>
                           
                           <div className="relative">
                             <FiMessageSquare className="absolute left-3 top-3 text-neutral-400" />
                             <textarea
                               className="w-full py-2.5 pl-9 pr-3 bg-white border border-brand-200 rounded-xl text-xs font-medium placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm resize-none h-20 custom-scrollbar"
                               placeholder="Record internal resolution note or investigation details here..."
                               value={draft.adminNote}
                               onChange={(e) => updateDraft(report.id, 'adminNote', e.target.value)}
                             />
                           </div>
                           <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                             <select
                               value={draft.escalationAction}
                               onChange={(e) => updateDraft(report.id, 'escalationAction', e.target.value)}
                               className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm focus:ring-2 focus:ring-brand-500"
                             >
                               <option value="">Next workflow action</option>
                               <option value="Escalate to resolver team">Escalate to resolver team</option>
                               <option value="Assign owner for final review">Assign owner for final review</option>
                               <option value="Send for resolution">Send for resolution</option>
                             </select>
                             <select
                               value={draft.assignedTeam}
                               onChange={(e) => updateDraft(report.id, 'assignedTeam', e.target.value)}
                               className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm focus:ring-2 focus:ring-brand-500"
                             >
                               <option value="">Responsible team</option>
                               <option value="Trust & Safety">Trust & Safety</option>
                               <option value="Support Desk">Support Desk</option>
                               <option value="Platform Ops">Platform Ops</option>
                               <option value="Audit Desk">Audit Desk</option>
                             </select>
                           </div>
                           {(draft.escalationAction || draft.assignedTeam) ? (
                             <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
                               <FiSend size={13} />
                               {draft.escalationAction || 'Workflow selected'}{draft.assignedTeam ? ` - ${draft.assignedTeam}` : ''}
                             </div>
                           ) : null}
                           {report.adminNote && report.adminNote !== draft.adminNote && (
                              <div className="text-[10px] text-neutral-500 font-medium">
                                Last saved note: <span className="italic">&ldquo;{report.adminNote}&rdquo;</span>
                              </div>
                           )}
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

export default AdminReportsPage;
