const PortalWorkbenchUserCard = ({ avatarLetter, avatarUrl, collapsed = false, name, subtitle }) => {
  return (
    <div
      className={`flex rounded-2xl text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
        collapsed ? 'items-center justify-center px-0 py-1.5' : 'items-center gap-3 px-3 py-2.5'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full gradient-primary text-sm font-bold text-white shadow-md shadow-brand-500/20">
        {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : avatarLetter}
      </div>

      {collapsed ? null : (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{name || 'Profile'}</p>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
      )}
    </div>
  );
};

export default PortalWorkbenchUserCard;
