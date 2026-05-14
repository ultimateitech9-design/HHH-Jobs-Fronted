import { ChevronLeft, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const PortalWorkbenchBrand = ({
  brandPath = '/',
  collapsed = false,
  viewport = 'desktop',
  onCollapseToggle,
  onClose
}) => {
  if (viewport === 'mobile') {
    return (
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
        <Link to={brandPath} onClick={onClose} className="flex items-center gap-3">
          <img
            src="/hhh-job-logo.png"
            alt="HHH Jobs"
            className="h-10 w-10 rounded-2xl object-cover"
          />
          <div className="leading-none">
            <p className="font-heading font-bold text-slate-900">HHH Jobs</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Career Compass
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="flex h-16 items-center justify-center border-b border-slate-200/80 px-3">
        <button
          type="button"
          onClick={onCollapseToggle}
          className="rounded-2xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-4">
      <Link to={brandPath} className="flex min-w-0 items-center gap-3">
        <img
          src="/hhh-job-logo.png"
          alt="HHH Jobs"
          className="h-10 w-10 rounded-2xl object-cover"
        />
        <div className="leading-none">
          <p className="font-heading font-bold text-slate-900">HHH Jobs</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Career Compass
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={onCollapseToggle}
        className="ml-auto rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PortalWorkbenchBrand;
