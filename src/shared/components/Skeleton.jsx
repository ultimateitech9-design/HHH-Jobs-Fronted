const Skeleton = ({ className = '', variant = 'rect', count = 1 }) => {
  const baseClass = 'animate-pulse bg-slate-100 rounded-lg';

  const variants = {
    rect: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-xl',
    avatar: 'h-8 w-8 rounded-full',
    text: 'h-3 w-3/4',
    button: 'h-9 w-24 rounded-lg',
    badge: 'h-5 w-16 rounded-full'
  };

  const variantClass = variants[variant] || variants.rect;

  if (count <= 1) {
    return <div className={`${baseClass} ${variantClass} ${className}`} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${baseClass} ${variantClass} ${className}`} />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-xl border border-slate-100 bg-white p-4 ${className}`}>
    <div className="flex items-start gap-3">
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="mt-3 space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
        <Skeleton variant="avatar" className="h-8 w-8" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton variant="badge" />
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-4">
    <Skeleton className="h-36 w-full rounded-xl" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
