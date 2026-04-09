import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiFileText,
  FiTarget,
  FiTrendingUp
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard
} from '../components/StudentExperience';
import { getStudentAnalytics } from '../services/studentApi';

const stageLabelMap = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interviewed: 'Interviewed',
  offered: 'Offered',
  rejected: 'Rejected',
  hired: 'Hired'
};

const stageToneMap = {
  applied: 'from-slate-900 to-slate-700',
  shortlisted: 'from-brand-500 to-amber-400',
  interviewed: 'from-sky-600 to-secondary-500',
  offered: 'from-emerald-600 to-emerald-400',
  rejected: 'from-rose-500 to-red-400',
  hired: 'from-teal-600 to-emerald-400'
};

const StudentAnalyticsPage = () => {
  const [state, setState] = useState({ loading: true, error: '', isDemo: false, analytics: null });

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      const response = await getStudentAnalytics();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error && !response.isDemo ? response.error : '',
        isDemo: response.isDemo,
        analytics: response.data
      });
    };

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const pipeline = state.analytics?.pipeline || {
    applied: 0,
    shortlisted: 0,
    interviewed: 0,
    offered: 0,
    rejected: 0,
    hired: 0
  };

  const maxPipeline = Math.max(1, ...Object.values(pipeline).map((value) => Number(value || 0)));

  const insights = useMemo(() => {
    const totalApplications = Number(state.analytics?.totalApplications || 0);
    const shortlisted = Number(pipeline.shortlisted || 0);
    const interviewed = Number(pipeline.interviewed || 0);
    const hired = Number(pipeline.hired || 0);
    const atsChecks = Number(state.analytics?.atsChecks || 0);
    const shortlistRate = totalApplications ? Math.round((shortlisted / totalApplications) * 100) : 0;
    const interviewRate = totalApplications ? Math.round((interviewed / totalApplications) * 100) : 0;
    const hireRate = totalApplications ? Math.round((hired / totalApplications) * 100) : 0;

    return {
      totalApplications,
      shortlisted,
      hired,
      atsChecks,
      shortlistRate,
      interviewRate,
      hireRate
    };
  }, [pipeline.hired, pipeline.interviewed, pipeline.shortlisted, state.analytics?.atsChecks, state.analytics?.totalApplications]);

  const topStats = [
    {
      label: 'Total Applications',
      value: String(insights.totalApplications),
      helper: 'All submitted applications under one view',
      icon: FiFileText
    },
    {
      label: 'Shortlist Rate',
      value: `${insights.shortlistRate}%`,
      helper: 'Applications turning into shortlist movement',
      icon: FiTarget
    },
    {
      label: 'Interview Rate',
      value: `${insights.interviewRate}%`,
      helper: 'How often your applications reach interviews',
      icon: FiTrendingUp
    }
  ];

  const stageRows = Object.entries(pipeline).map(([stage, count]) => ({
    stage,
    label: stageLabelMap[stage] || stage,
    count: Number(count || 0),
    percent: Math.round((Number(count || 0) / maxPipeline) * 100)
  }));

  return (
    <StudentPageShell
      eyebrow="Analytics"
      badge="Conversion"
      title="See how your application momentum is actually moving"
      subtitle="Track conversion across each stage, measure ATS effort against outcomes, and spot where your profile needs better quality rather than more volume."
      stats={topStats}
    >
      {state.error ? <StudentNotice type="error" text={state.error} /> : null}
      {state.isDemo ? <StudentNotice type="info" text="Live analytics is unavailable right now, so sample-safe fallback values are being shown." /> : null}

      {state.loading ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {[1, 2].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-[2rem] bg-slate-100" />
          ))}
        </div>
      ) : state.analytics ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <StudentSurfaceCard
            eyebrow="Pipeline"
            title="Stage-by-stage application spread"
            subtitle="The larger the bar, the more of your current journey is concentrated at that stage."
          >
            <div className="space-y-5">
              {stageRows.map((item) => (
                <div key={item.stage}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${stageToneMap[item.stage] || 'from-slate-700 to-slate-500'}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </StudentSurfaceCard>

          <div className="space-y-6">
            <StudentSurfaceCard
              eyebrow="Efficiency"
              title="Signal quality"
              subtitle="A quick read on whether search activity is translating into meaningful progress."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.7rem] border border-emerald-200 bg-emerald-50/80 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Hire Rate</p>
                  <p className="mt-3 font-heading text-4xl font-black text-emerald-900">{insights.hireRate}%</p>
                  <p className="mt-3 text-sm leading-6 text-emerald-800">Final outcomes compared to total applications sent.</p>
                </div>
                <div className="rounded-[1.7rem] border border-sky-200 bg-sky-50/80 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-700">ATS Checks</p>
                  <p className="mt-3 font-heading text-4xl font-black text-sky-900">{insights.atsChecks}</p>
                  <p className="mt-3 text-sm leading-6 text-sky-800">Resume matching runs completed against target roles.</p>
                </div>
              </div>
            </StudentSurfaceCard>

            <StudentSurfaceCard
              eyebrow="Interpretation"
              title="What these numbers suggest"
            >
              <ul className="space-y-3 text-sm leading-6 text-slate-600">
                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  Higher shortlist rate means your profile and role targeting are aligned well.
                </li>
                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  If interview rate stays low, improve resume depth and tailor applications more aggressively.
                </li>
                <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  ATS checks help most when the missing keywords from your target roles are actually added into projects, skills, and summary.
                </li>
              </ul>
            </StudentSurfaceCard>
          </div>
        </div>
      ) : (
        <StudentEmptyState
          icon={FiBarChart2}
          title="Analytics will appear as your activity grows"
          description="Once you start applying and running ATS checks, this page will highlight conversion and quality signals."
        />
      )}
    </StudentPageShell>
  );
};

export default StudentAnalyticsPage;
