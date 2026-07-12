import { useLocation } from 'react-router-dom';

const pulseBlockClassName = 'animate-pulse bg-slate-200/80';

const CatalogCardSkeleton = ({ company = false }) => (
  <div className="flex min-h-[238px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
    <div className="flex items-start gap-3">
      <div className={`${pulseBlockClassName} h-11 w-11 shrink-0 rounded-lg`} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className={`${pulseBlockClassName} h-4 w-3/4 rounded`} />
        <div className={`${pulseBlockClassName} h-3 w-1/2 rounded`} />
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <div className={`${pulseBlockClassName} h-14 rounded-lg`} />
      <div className={`${pulseBlockClassName} h-14 rounded-lg`} />
    </div>
    <div className="mt-4 space-y-2">
      <div className={`${pulseBlockClassName} h-3 w-full rounded`} />
      <div className={`${pulseBlockClassName} h-3 w-4/5 rounded`} />
    </div>
    <div className="mt-auto flex gap-2 pt-5">
      <div className={`${pulseBlockClassName} h-9 flex-1 rounded-full`} />
      {company ? <div className={`${pulseBlockClassName} h-9 w-24 rounded-full`} /> : null}
    </div>
  </div>
);

const PublicHeroSkeleton = ({ compact = false, metrics = 3 }) => (
  <section className={`relative overflow-hidden border-b border-slate-800 bg-slate-950 ${compact ? 'min-h-[270px]' : 'min-h-[430px]'}`}>
    <div className={`vw-shell-wide flex ${compact ? 'min-h-[270px]' : 'min-h-[430px]'} flex-col justify-end py-8`}>
      <div className={`${pulseBlockClassName} h-3 w-40 rounded bg-slate-700/80`} />
      <div className={`${pulseBlockClassName} mt-4 h-9 max-w-2xl rounded bg-slate-700/80 sm:h-12`} />
      <div className={`${pulseBlockClassName} mt-3 h-4 max-w-xl rounded bg-slate-700/70`} />
      <div className={`${pulseBlockClassName} mt-2 h-4 w-4/5 max-w-lg rounded bg-slate-700/70`} />
      <div className={`mt-7 grid border-y border-white/10 ${metrics === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {Array.from({ length: metrics }, (_, index) => (
          <div key={index} className="space-y-2 border-white/10 py-3 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
            <div className={`${pulseBlockClassName} h-2.5 w-20 rounded bg-slate-700/70`} />
            <div className={`${pulseBlockClassName} h-6 w-16 rounded bg-slate-700/80`} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CatalogSkeleton = ({ company = false, government = false }) => (
  <div className="min-h-screen bg-slate-50" aria-busy="true">
    <PublicHeroSkeleton compact metrics={government ? 3 : 4} />
    <div className="vw-shell-wide py-5 sm:py-7">
      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-4">
        <div className={`${pulseBlockClassName} h-10 rounded-lg lg:col-span-2`} />
        <div className={`${pulseBlockClassName} h-10 rounded-lg`} />
        <div className={`${pulseBlockClassName} h-10 rounded-lg`} />
      </div>
      <div className="mt-5 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: company ? 8 : 6 }, (_, index) => (
          <CatalogCardSkeleton key={index} company={company} />
        ))}
      </div>
    </div>
  </div>
);

const HomeSkeleton = () => (
  <div className="min-h-screen bg-white" aria-busy="true">
    <PublicHeroSkeleton metrics={3} />
    <div className="vw-shell-wide grid gap-4 py-8 sm:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className={`${pulseBlockClassName} h-10 w-10 rounded-full`} />
          <div className={`${pulseBlockClassName} mt-4 h-4 w-2/3 rounded`} />
          <div className={`${pulseBlockClassName} mt-3 h-3 w-full rounded`} />
        </div>
      ))}
    </div>
  </div>
);

const DetailSkeleton = () => (
  <div className="min-h-screen bg-slate-50" aria-busy="true">
    <PublicHeroSkeleton compact metrics={3} />
    <div className="vw-shell-wide grid gap-5 py-7 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div className={`${pulseBlockClassName} h-6 w-2/5 rounded`} />
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className={`${pulseBlockClassName} h-3 rounded ${index % 3 === 2 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </div>
      <aside className="h-72 rounded-lg border border-slate-200 bg-white p-5">
        <div className={`${pulseBlockClassName} h-5 w-1/2 rounded`} />
        <div className={`${pulseBlockClassName} mt-5 h-11 w-full rounded-full`} />
        <div className={`${pulseBlockClassName} mt-3 h-11 w-full rounded-full`} />
      </aside>
    </div>
  </div>
);

const ContentSkeleton = () => (
  <div className="vw-shell min-h-screen py-10" aria-busy="true">
    <div className={`${pulseBlockClassName} h-3 w-32 rounded`} />
    <div className={`${pulseBlockClassName} mt-4 h-10 max-w-2xl rounded`} />
    <div className={`${pulseBlockClassName} mt-4 h-4 max-w-xl rounded`} />
    <div className="mt-8 grid gap-5 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-52 rounded-lg border border-slate-200 bg-white p-5">
          <div className={`${pulseBlockClassName} h-5 w-2/3 rounded`} />
          <div className={`${pulseBlockClassName} mt-4 h-3 w-full rounded`} />
          <div className={`${pulseBlockClassName} mt-2 h-3 w-4/5 rounded`} />
        </div>
      ))}
    </div>
  </div>
);

const PortalSkeleton = () => (
  <div className="w-full animate-pulse space-y-4 p-4 sm:p-6" aria-busy="true">
    <div className={`${pulseBlockClassName} h-7 w-44 rounded`} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-24 rounded-lg border border-slate-200 bg-white" />
      ))}
    </div>
    <div className="h-80 rounded-lg border border-slate-200 bg-white" />
  </div>
);

const AuthSkeleton = () => (
  <div className="flex min-h-[calc(100vh-var(--public-navbar-height,74px))] items-center justify-center bg-slate-50 px-4" aria-busy="true">
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`${pulseBlockClassName} h-8 w-2/3 rounded`} />
      <div className={`${pulseBlockClassName} mt-3 h-3 w-full rounded`} />
      <div className={`${pulseBlockClassName} mt-7 h-11 w-full rounded-lg`} />
      <div className={`${pulseBlockClassName} mt-3 h-11 w-full rounded-lg`} />
      <div className={`${pulseBlockClassName} mt-5 h-11 w-full rounded-full`} />
    </div>
  </div>
);

const getRouteKind = (pathname = '/') => {
  if (/^\/(?:portal|management)\b/i.test(pathname)) return 'portal';
  if (/^\/(?:login|sign-up|forgot-password|verify-otp|oauth)\b/i.test(pathname)) return 'auth';
  if (pathname === '/') return 'home';
  if (/^\/jobs\/[^/]+/i.test(pathname) || /^\/govt-jobs\/[^/]+/i.test(pathname) || /^\/companies\/[^/]+/i.test(pathname)) return 'detail';
  if (/^\/govt-jobs\b/i.test(pathname)) return 'government';
  if (/^\/jobs\b/i.test(pathname)) return 'jobs';
  if (/^\/companies\b/i.test(pathname)) return 'companies';
  return 'content';
};

const RouteLoadingFallback = () => {
  const { pathname } = useLocation();
  const routeKind = getRouteKind(pathname);

  return (
    <div role="status" aria-label="Loading page">
      <span className="sr-only">Loading page</span>
      {routeKind === 'portal' ? <PortalSkeleton /> : null}
      {routeKind === 'auth' ? <AuthSkeleton /> : null}
      {routeKind === 'home' ? <HomeSkeleton /> : null}
      {routeKind === 'detail' ? <DetailSkeleton /> : null}
      {routeKind === 'government' ? <CatalogSkeleton government /> : null}
      {routeKind === 'jobs' ? <CatalogSkeleton /> : null}
      {routeKind === 'companies' ? <CatalogSkeleton company /> : null}
      {routeKind === 'content' ? <ContentSkeleton /> : null}
    </div>
  );
};

export default RouteLoadingFallback;
