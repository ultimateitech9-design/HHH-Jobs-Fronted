import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { getLoginPortalConfig } from '../../../../modules/auth/config/loginPortals';
import { getPublicJobsNavPath } from '../../../../modules/common/utils/publicAccess';
import { isExternalHref } from '../../../utils/externalLinks.js';
import { getPublicNavItems } from './publicNavigation';

const LoginPanelContent = lazy(() => import('../../../../modules/auth/components/LoginPanelContent'));

const pathMatches = (pathname, matchers = []) => matchers.some((matcher) => matcher.test(pathname));

const PublicNavbar = ({ dashboardPath, onLogout, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [loginDrawerOpen, setLoginDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();

  const jobsNavPath = getPublicJobsNavPath(Boolean(user));
  const defaultLoginPortal = getLoginPortalConfig('default');

  const publicNavItems = useMemo(
    () => getPublicNavItems({
      jobsNavPath,
      govtJobsNavPath: '/govt-jobs',
      dashboardPath
    }),
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

  useEffect(() => {
    let frameId = 0;
    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        setIsScrolled(window.scrollY > 12);
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

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
        <>
          <div
            className="fixed inset-0 z-[120] bg-slate-950/12 backdrop-blur-[3px]"
            onClick={() => setLoginDrawerOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-[121] flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_72px_rgba(15,23,42,0.18)] sm:max-w-[500px] sm:px-5 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-5"
          >
            <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-100" />}>
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
            </Suspense>
          </aside>
        </>,
        document.body
      )
      : null;

  return (
    <>
      <header
        ref={headerRef}
        className={`public-navbar fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl ${isScrolled ? 'public-navbar--scrolled border-[#e7ddca] bg-[#fffdf9]/96' : 'border-[#ebe3d5] bg-[#fffdf9]/94'}`}
      >
        <div className="public-navbar__inner vw-shell flex min-h-16 items-center justify-between gap-3 py-2 sm:gap-4">
          <Link to="/" className="public-navbar__brand group flex min-w-0 items-center gap-2.5">
            <img
              src="/favicon-circle.svg?v=20260713"
              alt="HHH Jobs"
              className="h-14 w-14 object-contain"
              width="56"
              height="56"
              decoding="sync"
              fetchPriority="high"
            />
            <div className="public-navbar__brand-text min-w-0 flex flex-col leading-none">
              <span className="truncate font-heading text-base font-extrabold text-[#151922] transition-colors group-hover:text-[#14549a] sm:text-lg">
                HHH Jobs
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#14549a]">
                Connecting Future
              </span>
            </div>
          </Link>

          <nav className="public-navbar__nav hidden items-center gap-1 border-x border-[#ebe3d5] px-3 py-1 lg:flex">
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
                      className={`group relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-[#14549a]' : 'text-slate-600 hover:text-[#151922]'
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

                    {dropdownOpen === link.key ? (
                      <div className="absolute left-0 top-full mt-1 min-w-[220px] rounded-lg border border-[#e7ddca] bg-[#fffdf9] p-2 shadow-dropdown">
                        {link.children.map((child) => {
                          const isChildActive = isNavItemActive(child);
                          const isExternal = isExternalHref(child.to);
                          const className = `block rounded-md px-3 py-2 text-sm transition-all ${isChildActive
                              ? 'bg-secondary-50 text-secondary-700'
                              : 'text-slate-600 hover:bg-brand-50 hover:text-[#151922]'
                            }`;

                          return isExternal ? (
                            <a
                              key={child.key}
                              href={child.to}
                              onClick={() => setDropdownOpen(null)}
                              className={className}
                            >
                              {child.label}
                            </a>
                          ) : (
                            <Link
                              key={child.key}
                              to={child.to}
                              state={child.state}
                              onClick={() => setDropdownOpen(null)}
                              className={className}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              const isExternal = isExternalHref(link.to);
              const className = `group relative rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-[#14549a]' : 'text-slate-600 hover:text-[#151922]'
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
                  state={link.state}
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
                className="rounded-md border border-[#ded4c2] px-4 py-2 text-sm font-semibold text-[#151922] transition-colors hover:border-[#d99b20] hover:bg-brand-50"
              >
                Dashboard
              </Link>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={handleLogoutClick}
                className="rounded-md border border-[#ded4c2] px-4 py-2 text-sm font-semibold text-[#151922] transition-colors hover:border-[#d99b20] hover:bg-brand-50"
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
                  className="rounded-md px-4 py-2 text-sm font-semibold text-[#151922] transition-colors hover:text-[#14549a]"
                >
                  Log in
                </Link>
                <Link to="/sign-up">
                  <span
                    className="inline-flex rounded-md bg-[#d99b20] px-4 py-2 text-sm font-bold text-[#151922] shadow-[0_8px_20px_rgba(185,121,8,0.2)] transition hover:bg-[#e8b23c]"
                  >
                    Start Free
                  </span>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="rounded-md border border-[#e7ddca] p-2 text-[#14549a] lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen ? (
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-[#e7ddca] bg-[#fffdf9]/98 lg:hidden">
            <div className="vw-shell flex flex-col gap-2 py-4">
              {publicNavItems.map((link) => {
                  const isActive = isNavItemActive(link);

                  if (link.children) {
                    return (
                      <div key={link.key}>
                        <p className="px-3 py-2 text-sm font-semibold text-navy">{link.label}</p>
                        {link.children.map((child) => {
                          const isChildActive = isNavItemActive(child);
                          const isExternal = isExternalHref(child.to);
                          const className = `block rounded-md px-6 py-2 text-sm transition-colors ${isChildActive
                              ? 'bg-secondary-50 text-secondary-700'
                              : 'text-slate-600 hover:bg-brand-50 hover:text-[#151922]'
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
                              state={child.state}
                              onClick={() => setIsMenuOpen(false)}
                              className={className}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  }

                  const isExternal = isExternalHref(link.to);
                  const className = `block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive
                      ? 'bg-secondary-50 text-secondary-700'
                      : 'text-slate-600 hover:bg-brand-50 hover:text-[#151922]'
                    }`;

                  return isExternal ? (
                    <a
                      key={link.key}
                      href={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={className}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.key}
                      to={link.to}
                      state={link.state}
                      onClick={() => setIsMenuOpen(false)}
                      className={className}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {user ? (
                    <>
                      {dashboardPath ? (
                        <Link
                          to={dashboardPath}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex-1 rounded-md border border-[#ded4c2] px-4 py-2 text-center text-sm font-semibold text-[#151922]"
                        >
                          Dashboard
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="flex-1 rounded-md bg-[#d99b20] px-4 py-2 text-sm font-bold text-[#151922]"
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
                        className="flex-1 rounded-md border border-[#ded4c2] px-4 py-2 text-center text-sm font-semibold text-[#151922]"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/sign-up"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex-1 rounded-md bg-[#d99b20] px-4 py-2 text-center text-sm font-bold text-[#151922]"
                      >
                        Start Free
                      </Link>
                    </>
                  )}
                </div>
            </div>
          </div>
        ) : null}
      </header>
      {loginDrawer}
    </>
  );
};

export default PublicNavbar;
