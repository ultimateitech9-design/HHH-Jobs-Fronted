import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Building2, ChevronDown, LogOut } from 'lucide-react';
import PortalWorkbenchBrand from './PortalWorkbenchBrand';
import PortalWorkbenchSupportCard from './PortalWorkbenchSupportCard';
import PortalWorkbenchUserCard from './PortalWorkbenchUserCard';

const normalizePath = (value = '') => String(value || '').replace(/\/+$/, '');

const pathMatches = (pathname = '', targetPath = '') => {
  const currentPath = normalizePath(pathname);
  const basePath = normalizePath(targetPath);

  if (!basePath) return false;
  return currentPath === basePath || currentPath.startsWith(`${basePath}/`);
};

const getItemKey = (item) => item.key || item.to || item.label;

const PortalWorkbenchSidebar = ({
  collapsed = false,
  hideBrand = false,
  viewport = 'desktop',
  brandPath,
  portalLabel,
  navItems = [],
  profilePath,
  support,
  user,
  onLogout,
  onCollapseToggle,
  onClose
}) => {
  const location = useLocation();
  const isCollapsed = viewport === 'desktop' ? collapsed : false;
  const avatarLetter = String(user?.name || user?.email || 'U').trim().slice(0, 1).toUpperCase();
  const avatarUrl = user?.avatarUrl || user?.avatar_url || '';
  const normalizedPortalLabel = String(portalLabel || '').toLowerCase();
  const profileShortcutLabel = normalizedPortalLabel.includes('hr')
    ? 'Company Profile'
    : normalizedPortalLabel.includes('campus')
      ? 'College Profile'
    : 'My Profile';
  const groupedItemKeys = useMemo(
    () => navItems
      .filter((item) => Array.isArray(item.children) && item.children.length > 0)
      .map((item) => getItemKey(item)),
    [navItems]
  );
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(
      navItems
        .filter((item) => Array.isArray(item.children) && item.children.length > 0)
        .map((item) => [
          getItemKey(item),
          item.children.some((child) => pathMatches(location.pathname, child.to))
        ])
    )
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setOpenGroups((current) => {
      const nextState = { ...current };
      let changed = false;

      groupedItemKeys.forEach((key) => {
        if (!(key in nextState)) {
          nextState[key] = false;
          changed = true;
        }
      });

      navItems.forEach((item) => {
        if (!Array.isArray(item.children) || item.children.length === 0) return;
        const itemKey = getItemKey(item);
        const isActiveGroup = item.children.some((child) => pathMatches(location.pathname, child.to));

        if (isActiveGroup && !nextState[itemKey]) {
          nextState[itemKey] = true;
          changed = true;
        }
      });

      return changed ? nextState : current;
    });
  }, [groupedItemKeys, location.pathname, navItems]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname, isCollapsed]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [userMenuOpen]);

  return (
    <div className="flex h-full flex-col">
      {hideBrand && viewport === 'desktop' ? null : (
        <PortalWorkbenchBrand
          brandPath={brandPath}
          collapsed={isCollapsed}
          viewport={viewport}
          onCollapseToggle={onCollapseToggle}
          onClose={onClose}
        />
      )}

      {isCollapsed ? null : (
        <div className="space-y-2 px-4 py-2">
          <span className="inline-flex max-w-full rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
            {portalLabel}
          </span>

          {profilePath ? (
            <Link
              to={profilePath}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.94rem] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{profileShortcutLabel}</span>
            </Link>
          ) : null}
        </div>
      )}

      <nav className={`flex-1 space-y-0.5 overflow-y-auto ${isCollapsed ? 'px-2 py-2' : 'px-3 py-1'}`}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const itemKey = getItemKey(item);
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const showSectionLabel = !isCollapsed && item.section && item.section !== navItems[index - 1]?.section;
          const isGroupedItemActive = hasChildren
            ? item.children.some((child) => pathMatches(location.pathname, child.to))
            : false;

          const sectionLabel = showSectionLabel ? (
            <p className={`${index === 0 ? 'pb-1' : 'pb-1 pt-3'} px-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400`}>
              {item.section}
            </p>
          ) : null;

          if (hasChildren && !isCollapsed) {
            return (
              <Fragment key={itemKey}>
                {sectionLabel}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setOpenGroups((current) => ({ ...current, [itemKey]: !current[itemKey] }))}
                  className={`group flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-[0.94rem] font-medium transition-all duration-150 ${
                    isGroupedItemActive
                      ? 'border-brand-500 bg-brand-50 text-slate-900'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {Icon ? (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                        isGroupedItemActive
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-700'
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                  ) : null}

                  <span className={`flex-1 truncate text-left ${isGroupedItemActive ? 'font-semibold' : ''}`}>{item.label}</span>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-150 ${openGroups[itemKey] ? 'rotate-180' : ''}`}
                  />
                </button>

                {openGroups[itemKey] ? (
                  <div className="ml-6 space-y-1 border-l border-slate-200 pl-5">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;

                      return (
                        <NavLink
                          key={getItemKey(child)}
                          to={child.to}
                          className={({ isActive }) =>
                            `flex items-center gap-2 rounded-lg px-3 py-2.5 text-[0.9rem] transition-colors ${
                              isActive
                                ? 'bg-brand-50 text-brand-700'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {ChildIcon ? (
                                <span className={`shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`}>
                                  <ChildIcon size={15} />
                                </span>
                              ) : null}
                              <span className={`truncate ${isActive ? 'font-semibold' : ''}`}>{child.label}</span>
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              </Fragment>
            );
          }

          if (hasChildren && isCollapsed) {
            const targetChild = item.children[0];

            return (
              <NavLink
                key={itemKey}
                to={targetChild?.to || '/'}
                className={({ isActive }) =>
                  `group flex w-full items-center text-[0.94rem] font-medium transition-all duration-150 ${
                    isCollapsed ? 'justify-center rounded-lg px-0 py-1.5' : 'gap-3 rounded-lg px-3 py-2.5'
                  } ${
                    isActive || isGroupedItemActive
                      ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {Icon ? (
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                          isActive || isGroupedItemActive
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-700'
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <Fragment key={itemKey}>
            {sectionLabel}
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `group flex w-full items-center border-l-2 text-[0.94rem] font-medium transition-all duration-150 ${
                  isCollapsed ? 'justify-center rounded-lg border-transparent px-0 py-1.5' : 'gap-3 rounded-lg px-3 py-2.5'
                } ${
                  isActive
                    ? 'border-brand-500 bg-brand-50 text-slate-900'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {Icon ? (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-700'
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                  ) : null}
                  {isCollapsed ? null : (
                    <span className={`truncate ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
            </Fragment>
          );
        })}
      </nav>

      {isCollapsed || support?.showCard === false ? null : <PortalWorkbenchSupportCard support={support} />}

      <div className="border-t border-slate-200 p-2.5">
        {user ? (
          <div ref={userMenuRef} className="relative mb-2">
            {userMenuOpen ? (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (onClose) onClose();
                    if (onLogout) onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setUserMenuOpen((current) => !current)}
              className="block w-full text-left"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <PortalWorkbenchUserCard
                avatarLetter={avatarLetter}
                avatarUrl={avatarUrl}
                collapsed={isCollapsed}
                name={user.name}
                subtitle={portalLabel}
              />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PortalWorkbenchSidebar;
