import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiLink,
  FiRefreshCw,
  FiTrendingUp,
  FiUploadCloud,
  FiUsers
} from 'react-icons/fi';
import {
  checkoutCampusRolePlan,
  getCampusRolePlanQuote,
  getCampusRolePlans,
  getCampusStats,
  getCurrentCampusRoleSubscription
} from '../services/campusConnectApi';

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-1 text-3xl font-extrabold ${color || 'text-navy'}`}>{value ?? '—'}</p>
        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      </div>
      {Icon && (
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${color ? 'bg-brand-50' : 'bg-slate-100'}`}>
          <Icon size={20} className={color || 'text-slate-500'} />
        </span>
      )}
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
  const [stats, setStats] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [billingMessage, setBillingMessage] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getCampusStats(),
      getCampusRolePlans(),
      getCurrentCampusRoleSubscription()
    ]).then(([statsRes, plansRes, subscriptionRes]) => {
      if (!mounted) return;
      setStats({ ...empty, ...(statsRes.data || {}) });
      setPlans(plansRes.data || []);
      setSelectedPlanSlug((plansRes.data || [])[0]?.slug || '');
      setCurrentPlan(subscriptionRes.data || null);
      setError([statsRes.error, plansRes.error, subscriptionRes.error].filter(Boolean).join(' | '));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const activePlan = plans.find((plan) => plan.slug === selectedPlanSlug);
    if (!activePlan) {
      setQuote(null);
      return;
    }

    getCampusRolePlanQuote({ planSlug: activePlan.slug, quantity: 1, couponCode })
      .then((response) => setQuote(response))
      .catch(() => setQuote(null));
  }, [plans, selectedPlanSlug, couponCode]);

  const handleCheckout = async () => {
    if (!selectedPlanSlug) return;
    setBillingLoading(true);
    setBillingMessage('');
    try {
      const response = await checkoutCampusRolePlan({ planSlug: selectedPlanSlug, quantity: 1, couponCode, paymentStatus: 'pending' });
      setBillingMessage(response?.purchase?.status === 'paid'
        ? 'Campus plan activated successfully.'
        : 'Campus plan request submitted for admin approval.');
      const subscriptionRes = await getCurrentCampusRoleSubscription();
      setCurrentPlan(subscriptionRes.data || null);
    } catch (checkoutError) {
      setBillingMessage(String(checkoutError.message || 'Unable to submit campus plan request.'));
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Campus Connect Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live placement overview for your college.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/portal/campus-connect/students"
            className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ef5c30]"
          >
            <FiUploadCloud size={15} />
            Import Students
          </Link>
          <Link
            to="/portal/campus-connect/drives"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          >
            <FiBriefcase size={15} />
            Schedule Drive
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {error} — showing cached data.
        </div>
      )}

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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Campus Plans</p>
              <h2 className="mt-2 text-xl font-extrabold text-navy">Placement workflow subscriptions</h2>
              <p className="mt-1 text-sm text-slate-500">Choose the operational plan for drives, student import scale, and onboarding support.</p>
            </div>
            <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Current Plan</p>
              <p className="mt-1 text-lg font-black text-brand-800">{currentPlan?.role_plan_slug || 'No active plan'}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {plans.map((plan) => (
              <button
                type="button"
                key={plan.slug}
                onClick={() => setSelectedPlanSlug(plan.slug)}
                className={`rounded-[1.25rem] border p-4 text-left transition ${selectedPlanSlug === plan.slug ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-brand-200'}`}
              >
                <p className="text-lg font-extrabold text-navy">{plan.name}</p>
                <p className="mt-1 text-sm text-slate-500">{plan.description || 'Campus workflow plan'}</p>
                <p className="mt-3 text-2xl font-black text-brand-700">{plan.currency} {plan.price}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
          <h2 className="text-lg font-extrabold text-navy">Activate Campus Plan</h2>
          <p className="mt-1 text-sm text-slate-500">Admin approval flow stays intact after you submit this request.</p>
          <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Coupon code" className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold uppercase" />
          {quote ? (
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{quote.currency} {quote.subtotal}</span></div>
              <div className="mt-1 flex justify-between text-emerald-700"><span>Discount</span><span>-{quote.currency} {quote.discountAmount}</span></div>
              <div className="mt-1 flex justify-between"><span>GST</span><span>{quote.currency} {quote.gstAmount}</span></div>
              <div className="mt-2 flex justify-between border-t border-brand-200 pt-2 font-black text-brand-800"><span>Total</span><span>{quote.currency} {quote.totalAmount}</span></div>
            </div>
          ) : null}
          {billingMessage ? <p className="mt-4 text-sm font-semibold text-brand-700">{billingMessage}</p> : null}
          <button onClick={handleCheckout} disabled={billingLoading || !selectedPlanSlug} className="mt-5 w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-50">
            {billingLoading ? 'Submitting...' : 'Request Campus Plan'}
          </button>
        </div>
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
          <h2 className="mb-5 text-lg font-extrabold text-navy">Branch-wise Placement</h2>
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
              {stats.branchStats.map((b) => (
                <div key={b.branch}>
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
            <h2 className="text-lg font-extrabold text-navy">Recent Drives</h2>
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
              {stats.recentDrives.map((drive) => (
                <div key={drive.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
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

      {/* Quick actions */}
      <div className="rounded-[1.75rem] border border-dashed border-brand-200 bg-brand-50 p-6">
        <h2 className="mb-4 text-base font-extrabold text-brand-800">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { to: '/portal/campus-connect/students', label: 'Import Students via CSV', icon: FiUploadCloud },
            { to: '/portal/campus-connect/drives', label: 'Schedule Campus Drive', icon: FiBriefcase },
            { to: '/portal/campus-connect/connections', label: 'Review Company Requests', icon: FiLink },
            { to: '/portal/campus-connect/reports', label: 'Export Placement Report', icon: FiAward }
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              <action.icon size={15} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
