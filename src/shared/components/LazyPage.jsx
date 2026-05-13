import { Suspense } from 'react';

const PageSkeleton = () => (
  <div className="mx-auto w-full max-w-[1200px] animate-pulse space-y-4 px-4 py-6">
    <div className="h-8 w-48 rounded-lg bg-slate-100" />
    <div className="h-4 w-72 rounded bg-slate-100" />
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 rounded-xl border border-slate-100 bg-white" />
      ))}
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="h-64 rounded-xl border border-slate-100 bg-white" />
      <div className="h-64 rounded-xl border border-slate-100 bg-white" />
    </div>
  </div>
);

const LazyPage = ({ children, fallback }) => (
  <Suspense fallback={fallback || <PageSkeleton />}>
    {children}
  </Suspense>
);

export default LazyPage;
export { PageSkeleton };
