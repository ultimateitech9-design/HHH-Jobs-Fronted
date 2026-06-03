import PortalWorkbenchSidebar from './PortalWorkbenchSidebar';

const PortalWorkbenchMobileDrawer = ({
  open,
  brandPath,
  portalLabel,
  navItems,
  profilePath,
  support,
  user,
  onLogout,
  onClose
}) => {
  return (
    open ? (
      <>
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm xl:hidden"
          onClick={onClose}
          aria-label="Close mobile navigation"
        />
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-2xl xl:hidden">
          <PortalWorkbenchSidebar
            viewport="mobile"
            brandPath={brandPath}
            portalLabel={portalLabel}
            navItems={navItems}
            profilePath={profilePath}
            support={support}
            user={user}
            onLogout={onLogout}
            onClose={onClose}
          />
        </aside>
      </>
    ) : null
  );
};

export default PortalWorkbenchMobileDrawer;
