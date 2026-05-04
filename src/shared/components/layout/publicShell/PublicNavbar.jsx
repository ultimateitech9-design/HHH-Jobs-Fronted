import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import LoginPanelContent from '../../../../modules/auth/components/LoginPanelContent';
import { getLoginPortalConfig } from '../../../../modules/auth/config/loginPortals';
import { getPublicJobsNavPath } from '../../../../modules/common/utils/publicAccess';
import { isExternalHref } from '../../../utils/externalLinks.js';
import { getPublicNavItems } from './publicNavigation';

const pathMatches = (pathname, matchers = []) => matchers.some((matcher) => matcher.test(pathname));

const PublicNavbar = ({ dashboardPath, onLogout, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [loginDrawerOpen, setLoginDrawerOpen] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();

  const jobsNavPath = getPublicJobsNavPath(Boolean(user));
  const defaultLoginPortal = getLoginPortalConfig('default');

  const publicNavItems = useMemo(
    () => getPublicNavItems({ jobsNavPath, dashboardPath }),
    [dashboardPath, jobsNavPath]
  );

  useEffect(() => {
    setIsMenuOpen(false);
    setDropdownOpen(null);
    setLoginDrawerOpen(false);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateNavbarHeightVar = () => {
      const navbarHeight = Math.ceil(headerRef.current?.getBoundingClientRect().height || 0);
      if (!navbarHeight) return;
      document.documentElement.style.setProperty('--public-navbar-height', `${navbarHeight}px`);
    };

    updateNavbarHeightVar();

    window.addEventListener('resize', updateNavbarHeightVar, { passive: true });

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      resizeObserver = new ResizeObserver(updateNavbarHeightVar);
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateNavbarHeightVar);
      resizeObserver?.disconnect();
    };
  }, [location.pathname, user]);

  const isNavItemActive = (item) => {
    if (item.children) {
      return item.children.some((child) => isNavItemActive(child));
    }

    return pathMatches(location.pathname, item.matchers);
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setDropdownOpen(null);
    onLogout();
  };

  const handleLoginClick = () => {
    setIsMenuOpen(false);
    setDropdownOpen(null);
    setLoginDrawerOpen(true);
  };

  const loginDrawer =
    loginDrawerOpen && !user && typeof document !== 'undefined'
      ? createPortal(
        <AnimatePresence>
          <motion.div
            key="login-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-950/12 backdrop-blur-[3px]"
            onClick={() => setLoginDrawerOpen(false)}
          />
          <motion.aside
            key="login-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 110, damping: 26, mass: 1.05 }}
            className="fixed inset-y-0 right-0 z-[121] flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_72px_rgba(15,23,42,0.18)] sm:max-w-[500px] sm:px-5 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-5"
          >
            <LoginPanelContent
              portalLabel="Login"
              allowSocialLogin={defaultLoginPortal.allowSocialLogin}
              socialRole={defaultLoginPortal.socialRole}
              showCreateAccount={defaultLoginPortal.showCreateAccount}
              createAccountPath={defaultLoginPortal.createAccountPath}
              createAccountLabel={defaultLoginPortal.createAccountLabel}
              showOtpLogin={defaultLoginPortal.showOtpLogin}
              allowedLoginRoles={defaultLoginPortal.allowedLoginRoles}
              showHeader
              onRequestClose={() => setLoginDrawerOpen(false)}
            />
          </motion.aside>
        </AnimatePresence>,
        document.body
      )
      : null;

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="fixed inset-x-0 top-0 z-50 bg-white/86 backdrop-blur-xl"
      >
        <div className="container mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-4">
          <Link to="/" className="group flex min-w-0 items-center gap-2.5">
            <motion.img
              src="/hhh-job-logo.png"
              alt="HHH Jobs"
              className="h-14 w-14 object-contain"
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            />
            <div className="min-w-0 flex flex-col leading-none">
              <span className="truncate font-heading text-base font-bold text-navy transition-colors group-hover:text-gold-dark sm:text-lg">
                HHH Jobs
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Connecting Future
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {publicNavItems.map((link) => {
              const isActive = isNavItemActive(link);

              if (link.children) {
                return (
                  <div
                    key={link.key}
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(link.key)}
                    onMouseLeave={() => setDropdownOpen(null)}
                  >
                    <button
                      type="button"
                      aria-expanded={dropdownOpen === link.key}
                      className={`group relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-navy' : 'text-slate-500 hover:text-navy'
                        }`}
                    >
                      {link.label}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${dropdownOpen === link.key ? 'rotate-180 text-gold-dark' : ''
                          }`}
                      />
                      <span
                        className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-gold transition-all duration-300 ${isActive || dropdownOpen === link.key
                            ? 'w-4/5'
                            : 'w-0 group-hover:w-4/5'
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen === link.key ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="absolute left-0 top-full mt-1 min-w-[220px] rounded-[22px] border border-slate-200/80 bg-white p-2 shadow-dropdown"
                        >
                          {link.children.map((child, index) => {
                            const isChildActive = isNavItemActive(child);
                            const isExternal = isExternalHref(child.to);
                            const className = `block rounded-2xl px-3 py-2 text-sm transition-all ${isChildActive
                                ? 'bg-brand-50 text-navy'
                                : 'text-slate-500 hover:bg-gold/5 hover:text-navy'
                              }`;

                            return (
                              <motion.div
                                key={child.key}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                {isExternal ? (
                                  <a
                                    href={child.to}
                                    onClick={() => setDropdownOpen(null)}
                                    className={className}
                                  >
                                    {child.label}
                                  </a>
                                ) : (
                                  <Link
                                    to={child.to}
                                    onClick={() => setDropdownOpen(null)}
                                    className={className}
                                  >
                                    {child.label}
                                  </Link>
                                )}
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              }

              const isExternal = isExternalHref(link.to);
              const className = `group relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-navy' : 'text-slate-500 hover:text-navy'
                }`;

              return isExternal ? (
                <a
                  key={link.key}
                  href={link.to}
                  className={className}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-gold transition-all duration-300 ${isActive ? 'w-4/5' : 'w-0 group-hover:w-4/5'
                      }`}
                  />
                </a>
              ) : (
                <Link
                  key={link.key}
                  to={link.to}
                  className={className}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-gold transition-all duration-300 ${isActive ? 'w-4/5' : 'w-0 group-hover:w-4/5'
                      }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {dashboardPath ? (
              <Link
                to={dashboardPath}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-slate-50"
              >
                Dashboard
              </Link>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={handleLogoutClick}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-slate-50"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  to="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handleLoginClick();
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-navy transition-colors hover:text-gold-dark"
                >
                  Log in
                </Link>
                <Link to="/sign-up">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex rounded-full gradient-gold px-4 py-2 text-sm font-semibold text-primary shadow-lg shadow-gold/20"
                  >
                    Start Free
                  </motion.span>
                </Link>
              </>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            className="rounded-xl p-2 text-slate-700 lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>

        <AnimatePresence>
          {isMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white/96 lg:hidden"
            >
              <div className="container mx-auto flex max-w-7xl flex-col gap-2 px-3 py-4 sm:px-4">
                {publicNavItems.map((link, index) => {
                  const isActive = isNavItemActive(link);

                  if (link.children) {
                    return (
                      <motion.div
                        key={link.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <p className="px-3 py-2 text-sm font-semibold text-navy">{link.label}</p>
                        {link.children.map((child) => {
                          const isChildActive = isNavItemActive(child);
                          const isExternal = isExternalHref(child.to);
                          const className = `block rounded-2xl px-6 py-2 text-sm transition-colors ${isChildActive
                              ? 'bg-brand-50 text-navy'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-navy'
                            }`;

                          return isExternal ? (
                            <a
                              key={child.key}
                              href={child.to}
                              onClick={() => setIsMenuOpen(false)}
                              className={className}
                            >
                              {child.label}
                            </a>
                          ) : (
                            <Link
                              key={child.key}
                              to={child.to}
                              onClick={() => setIsMenuOpen(false)}
                              className={className}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    );
                  }

                  const isExternal = isExternalHref(link.to);
                  const className = `block rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? 'bg-brand-50 text-navy'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                    }`;

                  return (
                    <motion.div
                      key={link.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {isExternal ? (
                        <a
                          href={link.to}
                          onClick={() => setIsMenuOpen(false)}
                          className={className}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          onClick={() => setIsMenuOpen(false)}
                          className={className}
                        >
                          {link.label}
                        </Link>
                      )}
                    </motion.div>
                  );
                })}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {user ? (
                    <>
                      {dashboardPath ? (
                        <Link
                          to={dashboardPath}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-navy"
                        >
                          Dashboard
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="flex-1 rounded-full gradient-gold px-4 py-2 text-sm font-semibold text-primary"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handleLoginClick();
                        }}
                        className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-navy"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/sign-up"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex-1 rounded-full gradient-gold px-4 py-2 text-center text-sm font-semibold text-primary"
                      >
                        Start Free
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.header>
      {loginDrawer}
    </>
  );
};

export default PublicNavbar;
