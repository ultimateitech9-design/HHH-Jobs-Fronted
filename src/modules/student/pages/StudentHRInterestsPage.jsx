import { useEffect, useRef, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiRefreshCw,
  FiSend,
  FiToggleLeft,
  FiToggleRight,
  FiX,
  FiXCircle,
  FiZap
} from 'react-icons/fi';
import { apiFetch } from '../../../utils/api';

const parseJson = async (r) => { try { return await r.json(); } catch { return null; } };

const strictRequest = async ({ path, options = {} }) => {
  const r = await apiFetch(path, options);
  const p = await parseJson(r);
  if (!r.ok) throw new Error(p?.message || `Request failed (${r.status})`);
  return p || {};
};

const safeRequest = async ({ path, options, emptyData }) => {
  try {
    const data = await strictRequest({ path, options });
    return { data, error: '' };
  } catch (err) {
    return { data: emptyData, error: err.message || 'Request failed.' };
  }
};

const getDiscovery = () =>
  safeRequest({
    path: '/student/profile/discovery',
    emptyData: { discovery: { isDiscoverable: false, availableToHire: false } }
  });

const updateDiscovery = (isDiscoverable, availableToHire) =>
  strictRequest({
    path: '/student/profile/discovery',
    options: { method: 'PUT', body: JSON.stringify({ isDiscoverable, availableToHire }) }
  });

const getHrInterests = () =>
  safeRequest({ path: '/student/hr-interests', emptyData: { interests: [] } });

const respondToInterest = (interestId, status) =>
  strictRequest({
    path: `/student/hr-interests/${interestId}`,
    options: { method: 'PUT', body: JSON.stringify({ status }) }
  });

const STATUS_CONFIG = {
  pending: { label: 'Pending', style: 'border-amber-200 bg-amber-50 text-amber-700', icon: FiClock },
  accepted: { label: 'Accepted', style: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: FiCheckCircle },
  declined: { label: 'Declined', style: 'border-red-200 bg-red-50 text-red-600', icon: FiXCircle }
};

export default function StudentHRInterestsPage() {
  const [discovery, setDiscovery] = useState({ isDiscoverable: false, availableToHire: false });
  const [discoveryLoaded, setDiscoveryLoaded] = useState(false);
  const [savingDiscovery, setSavingDiscovery] = useState(false);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState({});
  const [flash, setFlash] = useState('');
  const timerRef = useRef(null);

  const showFlash = (msg) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlash(msg);
    timerRef.current = setTimeout(() => setFlash(''), 4000);
  };

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  useEffect(() => {
    let mounted = true;
    Promise.all([getDiscovery(), getHrInterests()]).then(([disc, ints]) => {
      if (!mounted) return;
      if (disc.data?.discovery) setDiscovery(disc.data.discovery);
      setDiscoveryLoaded(true);
      setInterests(ints.data?.interests || []);
      setError(ints.error || '');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleToggle = async (field, value) => {
    const next = { ...discovery, [field]: value };
    setDiscovery(next);
    setSavingDiscovery(true);
    try {
      const result = await updateDiscovery(next.isDiscoverable, next.availableToHire);
      if (result?.discovery) setDiscovery(result.discovery);
      showFlash('Discovery settings saved.');
    } catch (err) {
      setDiscovery((prev) => ({ ...prev, [field]: !value }));
      alert(err.message);
    }
    setSavingDiscovery(false);
  };

  const respond = async (interestId, status) => {
    setResponding((prev) => ({ ...prev, [interestId]: true }));
    try {
      const result = await respondToInterest(interestId, status);
      setInterests((prev) => prev.map((i) => i.id === interestId ? { ...i, status, responded_at: result?.interest?.responded_at } : i));
    } catch (err) {
      alert(err.message);
    }
    setResponding((prev) => ({ ...prev, [interestId]: false }));
  };

  const pending = interests.filter((i) => i.status === 'pending');
  const accepted = interests.filter((i) => i.status === 'accepted');
  const declined = interests.filter((i) => i.status === 'declined');

  const ToggleRow = ({ label, desc, field, value }) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-bold text-navy">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        disabled={savingDiscovery}
        onClick={() => handleToggle(field, !value)}
        className="shrink-0 mt-0.5 disabled:opacity-60"
      >
        {value
          ? <FiToggleRight size={28} className="text-brand-500" />
          : <FiToggleLeft size={28} className="text-slate-300" />}
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">HR Interests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your discoverability and respond to recruiters who are interested in your profile.
        </p>
      </div>

      {flash && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{flash}</div>
      )}
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      )}

      {/* Discovery Settings Card */}
      <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
        <div className="mb-2 flex items-center gap-2">
          <FiEye size={18} className="text-brand-500" />
          <h2 className="text-lg font-extrabold text-navy">Discovery Settings</h2>
          {savingDiscovery && <FiRefreshCw size={13} className="animate-spin text-slate-400 ml-auto" />}
        </div>
        <p className="mb-4 text-sm text-slate-500">Control whether HRs can find and contact you on HHH Jobs.</p>

        {discoveryLoaded ? (
          <>
            <ToggleRow
              label="Make my profile discoverable"
              desc="When ON, HR users can find your profile in the Candidate Database and send you interest requests."
              field="isDiscoverable"
              value={discovery.isDiscoverable}
            />
            <ToggleRow
              label="Available to hire right now"
              desc="Shows a green 'Available' badge on your profile card — helps HRs prioritise you for immediate openings."
              field="availableToHire"
              value={discovery.availableToHire}
            />
            {discovery.isDiscoverable && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <FiCheckCircle size={16} />
                Your profile is currently <strong>discoverable</strong> by HR users.
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center py-6"><FiRefreshCw size={22} className="animate-spin text-brand-500" /></div>
        )}
      </div>

      {/* Interest Requests */}
      {loading ? (
        <div className="flex justify-center py-10">
          <FiRefreshCw size={26} className="animate-spin text-brand-500" />
        </div>
      ) : interests.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white text-center">
          <FiSend size={34} className="mb-3 text-slate-300" />
          <p className="font-bold text-slate-400">No HR interest requests yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Enable discoverability above so recruiters can find and reach out to you.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-amber-700">
                <FiClock size={16} /> New Requests ({pending.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {pending.map((interest) => (
                  <InterestRequestCard
                    key={interest.id}
                    interest={interest}
                    onAccept={() => respond(interest.id, 'accepted')}
                    onDecline={() => respond(interest.id, 'declined')}
                    isLoading={responding[interest.id]}
                  />
                ))}
              </div>
            </section>
          )}
          {accepted.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-emerald-700">
                <FiCheckCircle size={16} /> Connected Recruiters ({accepted.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {accepted.map((interest) => (
                  <ConnectedCard key={interest.id} interest={interest} />
                ))}
              </div>
            </section>
          )}
          {declined.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-400">
                <FiXCircle size={16} /> Declined ({declined.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {declined.map((interest) => (
                  <div key={interest.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 opacity-60">
                    <p className="text-sm font-bold text-slate-700">{interest.hrProfile?.company_name || interest.hrUser?.name || 'A Recruiter'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Declined · {new Date(interest.created_at).toDateString()}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function InterestRequestCard({ interest, onAccept, onDecline, isLoading }) {
  const profile = interest.hrProfile || {};
  const user = interest.hrUser || {};
  const company = profile.company_name || user.name || 'A Recruiter';
  const initial = company.charAt(0).toUpperCase();

  return (
    <div className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-sm font-black text-amber-600">
            {initial}
          </div>
          <div>
            <p className="text-sm font-extrabold text-navy">{company}</p>
            {profile.industry_type && <p className="text-[11px] text-slate-500">{profile.industry_type}</p>}
            {profile.location && <p className="text-[11px] text-slate-400">{profile.location}</p>}
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">New</span>
      </div>

      {interest.message && (
        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 italic">
          "{interest.message}"
        </div>
      )}
      <p className="mb-4 text-[11px] text-slate-400">Received {new Date(interest.created_at).toDateString()}</p>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onDecline}
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
        >
          <FiX size={12} />Decline
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isLoading ? <FiRefreshCw size={12} className="animate-spin" /> : <FiCheckCircle size={12} />}
          Accept
        </button>
      </div>
    </div>
  );
}

function ConnectedCard({ interest }) {
  const profile = interest.hrProfile || {};
  const user = interest.hrUser || {};
  const company = profile.company_name || user.name || 'A Recruiter';
  const initial = company.charAt(0).toUpperCase();

  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-sm font-black text-emerald-600">
          {initial}
        </div>
        <div>
          <p className="text-sm font-extrabold text-navy">{company}</p>
          {profile.industry_type && <p className="text-[11px] text-slate-500">{profile.industry_type}</p>}
        </div>
      </div>
      {interest.message && (
        <p className="text-xs text-slate-500 italic mb-2">"{interest.message}"</p>
      )}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
          <FiCheckCircle size={9} />Connected
        </span>
        {profile.company_website && (
          <a href={profile.company_website} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#2d5bff] hover:underline">
            Visit site
          </a>
        )}
      </div>
    </div>
  );
}
