import { AnimatePresence, motion } from 'framer-motion';
import PortalWorkbenchSidebar from './PortalWorkbenchSidebar';

const PortalWorkbenchMobileDrawer = ({
  open,
  portalLabel,
  navItems,
  profilePath,
  support,
  user,
  onLogout,
  onClose
}) => {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm xl:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-2xl xl:hidden"
          >
            <PortalWorkbenchSidebar
              viewport="mobile"
              portalLabel={portalLabel}
              navItems={navItems}
              profilePath={profilePath}
              support={support}
              user={user}
              onLogout={onLogout}
              onClose={onClose}
            />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default PortalWorkbenchMobileDrawer;
