import { useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLock,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSend,
  FiXCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getHrCandidateInterests } from '../services/hrApi';

const boxClass = 'rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.22)]';
const statusConfig = {
  pending: { icon: FiClock, label: 'Pending', style: 'border-amber-200 bg-amber-50 text-amber-700' },
  accepted: { icon: FiCheckCircle, label: 'Accepted', style: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  declined: { icon: FiXCircle, label: 'Declined', style: 'border-red-200 bg-red-50 text-red-600' }
};

export default function HrInterestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [access, setAccess] = useState({ hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
  const [summary, setSummary] = useState({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    let mounted = true;
    getHrCandidateInterests().then((response) => {
      if (!mounted) return;
      setAccess(response.data?.access || { hasPaidAccess: false, requiresUpgrade: true, activePlanName: 'Free' });
      setSummary(response.data?.summary || { total: 0, pending: 0, accepted: 0, declined: 0 });
      setInterests(response.data?.interests || []);
      setError(response.error || '');
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <FiRefreshCw size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-4 pb-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy">
            <FiSend size={20} className="text-brand-600" />
            Sent interests
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Track who accepted, who is pending, and which profiles are fully unlocked.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Plan access</p>
          <p className="mt-1 text-base font-extrabold text-navy">{access.activePlanName || 'Free'}</p>
        </div>
      </section>

      {!access.hasPaidAccess ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <div className="flex items-start gap-3">
            <FiLock size={16} className="mt-0.5 shrink-0" />
            <p>Accepted interests are still plan-gated. Upgrade to a paid hiring plan to unlock contact details and resumes for connected candidates.</p>
          </div>
          <Link to="/portal/hr/jobs" className="rounded-full bg-amber-600 px-4 py-2 font-bold text-white transition hover:bg-amber-700">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Pending" value={summary.pending} tone="amber" />
        <SummaryCard label="Accepted" value={summary.accepted} tone="emerald" />
        <SummaryCard label="Declined" value={summary.declined} tone="red" />
      </section>

      {interests.length === 0 ? (
        <div className={`${boxClass} flex min-h-[260px] flex-col items-center justify-center text-center`}>
          <FiSend size={36} className="text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">No interest requests sent yet.</p>
          <p className="mt-2 text-sm text-slate-400">Use the Candidate Database to start proactive sourcing.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {interests.map((interest) => (
            <InterestCard key={interest.id} interest={interest} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone = 'default' }) {
  const styles = {
    default: 'text-navy bg-white border-slate-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    red: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm ${styles[tone] || styles.default}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1.5 text-2xl font-black">{value}</p>
    </div>
  );
}

function InterestCard({ interest }) {
  const candidate = interest.candidate || {};
  const status = statusConfig[interest.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <article className={boxClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-navy">{candidate.user?.name || 'Candidate'}</h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.style}`}>
              <StatusIcon size={11} className="mr-1 inline" />
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-600">{candidate.profile?.headline || 'Student profile'}</p>
          <p className="mt-2 text-xs text-slate-400">
            Sent on {interest.created_at ? new Date(interest.created_at).toDateString() : '-'}
          </p>
        </div>
      </div>

      {interest.message ? (
        <div className="mt-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          &ldquo;{interest.message}&rdquo;
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info label="College" value={candidate.education?.college || '-'} />
        <Info label="Batch year" value={candidate.education?.batchYear || '-'} />
        <Info label="Location" value={candidate.profile?.location || '-'} />
        <Info label="Resume" value={candidate.profile?.hasResume ? (candidate.access?.canViewResume ? 'Unlocked' : 'Locked') : 'Not uploaded'} />
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-200 px-4 py-3">
        {candidate.access?.canViewContact ? (
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2"><FiMail size={14} />{candidate.user?.email || '-'}</span>
            <span className="inline-flex items-center gap-2"><FiPhone size={14} />{candidate.user?.mobile || '-'}</span>
            {candidate.profile?.resumeUrl ? (
              <a href={candidate.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-brand-700 hover:underline">
                <FiFileText size={14} />
                View resume
              </a>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-slate-500">
            <FiLock size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <p>{candidate.access?.blurReason || 'Contact details unlock after candidate acceptance.'}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-[1rem] border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}
