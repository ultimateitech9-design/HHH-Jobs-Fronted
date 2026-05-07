import { useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiLink,
  FiRefreshCw,
  FiX,
  FiXCircle
} from 'react-icons/fi';
import { getCampusConnections, respondToConnection } from '../services/campusConnectApi';

const STATUS_CONFIG = {
  pending: { label: 'Pending', style: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
  accepted: { label: 'Connected', style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FiCheckCircle },
  rejected: { label: 'Declined', style: 'bg-red-50 text-red-600 border-red-200', icon: FiXCircle }
};

export default function CampusConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCampusConnections().then(({ data, error: err }) => {
      if (!mounted) return;
      setConnections(data || []);
      setError(err || '');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const respond = async (id, status) => {
    setResponding((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await respondToConnection(id, status);
      setConnections((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } catch (err) {
      alert(err.message);
    } finally {
      setResponding((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pending = connections.filter((c) => c.status === 'pending');
  const accepted = connections.filter((c) => c.status === 'accepted');
  const rejected = connections.filter((c) => c.status === 'rejected');

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-7 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">Company Connections</h1>
        <p className="mt-1 text-sm text-slate-500">
          {pending.length} pending · {accepted.length} connected · {rejected.length} declined
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <FiRefreshCw size={24} className="animate-spin text-brand-500" />
        </div>
      ) : connections.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white text-center">
          <FiLink size={36} className="mb-3 text-slate-300" />
          <p className="font-semibold text-slate-400">No company requests yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            When companies express interest in your students, their requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-amber-700">
                <FiClock size={16} />
                Pending Requests ({pending.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {pending.map((conn) => (
                  <ConnectionCard
                    key={conn.id}
                    conn={conn}
                    onAccept={() => respond(conn.id, 'accepted')}
                    onReject={() => respond(conn.id, 'rejected')}
                    isLoading={responding[conn.id]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Accepted */}
          {accepted.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-emerald-700">
                <FiCheckCircle size={16} />
                Connected Companies ({accepted.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {accepted.map((conn) => (
                  <div key={conn.id} className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                    <p className="font-extrabold text-slate-800">{conn.company_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Connected on {conn.responded_at ? new Date(conn.responded_at).toDateString() : '—'}
                    </p>
                    {conn.message && (
                      <p className="mt-2 text-xs text-slate-500 italic">&ldquo;{conn.message}&rdquo;</p>
                    )}
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        <FiCheckCircle size={11} />
                        Connected
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-400">
                <FiXCircle size={16} />
                Declined ({rejected.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rejected.map((conn) => (
                  <div key={conn.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 opacity-60">
                    <p className="font-extrabold text-slate-700">{conn.company_name}</p>
                    <p className="mt-1 text-xs text-slate-400">Declined</p>
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

function ConnectionCard({ conn, onAccept, onReject, isLoading }) {
  return (
    <div className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-extrabold text-navy">{conn.company_name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Requested on {new Date(conn.created_at).toDateString()}
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
          Pending
        </span>
      </div>

      {conn.message && (
        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 italic">
          &ldquo;{conn.message}&rdquo;
        </div>
      )}

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={onReject}
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
        >
          <FiX size={13} />
          Decline
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {isLoading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiCheckCircle size={13} />}
          Accept
        </button>
      </div>
    </div>
  );
}
