import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AUTH_OR_LEGAL_ROUTE_PATTERN = /^\/(?:login|sign-up|forgot-password|verify-otp|oauth|privacy-policy|terms-and-conditions|summons-notices)\b/i;
const DIRECTORY_ROUTE_PATTERN = /^\/jobs\/(?:cities|sectors|categories)\/?$/i;

const getRouteFlow = (pathname = '/') => {
  if (pathname === '/') return { from: 'TALENT', signal: 'MATCH', to: 'HIRED' };
  if (/^\/govt-jobs\b/i.test(pathname)) return { from: 'ALERT', signal: 'TRACK', to: 'FORM' };
  if (/^\/companies\b/i.test(pathname)) return { from: 'PROFILE', signal: 'FIT', to: 'TEAM' };
  if (/^\/consultancy\b/i.test(pathname)) return { from: 'BRIEF', signal: 'DELIVER', to: 'PARTNER' };
  if (/^\/(?:campus-connect|freshers)\b/i.test(pathname)) return { from: 'CAMPUS', signal: 'PLACE', to: 'CAREER' };
  if (/^\/(?:ats|job-seekers|veterans|retired-employee)\b/i.test(pathname)) return { from: 'PROFILE', signal: 'SCORE', to: 'ROLE' };
  if (/^\/(?:recruiters|emp-verify)\b/i.test(pathname)) return { from: 'ROLE', signal: 'VERIFY', to: 'HIRE' };
  if (/^\/(?:services|pricing)\b/i.test(pathname)) return { from: 'PLAN', signal: 'VALUE', to: 'SCALE' };
  if (/^\/(?:about|about-us)\b/i.test(pathname)) return { from: 'TRUST', signal: 'CONNECT', to: 'GROW' };
  if (/^\/blog\b/i.test(pathname)) return { from: 'STORY', signal: 'INSIGHT', to: 'ACTION' };
  if (/^\/contact\b/i.test(pathname)) return { from: 'ASK', signal: 'SUPPORT', to: 'SOLVE' };
  if (/^\/jobs\/[^/]+\/?$/i.test(pathname)) return { from: 'ROLE', signal: 'PROOF', to: 'APPLY' };
  if (/^\/jobs\b/i.test(pathname)) return { from: 'SEARCH', signal: 'MATCH', to: 'APPLY' };
  return { from: 'DISCOVER', signal: 'CONNECT', to: 'GROW' };
};

const getRouteKind = (pathname = '/') => {
  if (pathname === '/') return 'home';
  if (/^\/jobs\/cities\/?$/i.test(pathname)) return 'location';
  if (/^\/jobs\/sectors\/?$/i.test(pathname)) return 'sector';
  if (/^\/jobs\/categories\/?$/i.test(pathname)) return 'category';
  if (/^\/govt-jobs\b/i.test(pathname)) return 'government';
  if (/^\/companies\b/i.test(pathname)) return 'companies';
  if (/^\/consultancy\b/i.test(pathname)) return 'consultancy';
  if (/^\/(?:campus-connect|freshers)\b/i.test(pathname)) return 'campus';
  if (/^\/(?:services|pricing)\b/i.test(pathname)) return 'commercial';
  if (/^\/(?:about|about-us)\b/i.test(pathname)) return 'about';
  if (/^\/blog\b/i.test(pathname)) return 'editorial';
  if (/^\/contact\b/i.test(pathname)) return 'support';
  if (/^\/jobs\/[^/]+\/?$/i.test(pathname)) return 'job-detail';
  if (/^\/jobs\b/i.test(pathname)) return 'jobs';
  return 'platform';
};

const getRevealSections = (root) =>
  Array.from(root.querySelectorAll('section, [data-cinematic-reveal]')).filter((element) => {
    if (element.hasAttribute('data-no-cinematic-reveal')) return false;
    if (element.closest('[role="dialog"], [aria-modal="true"]')) return false;

    const parentSection = element.parentElement?.closest('section');
    return !parentSection || !root.contains(parentSection);
  });

const PublicCinematicEnhancements = () => {
  const { pathname } = useLocation();
  const flow = getRouteFlow(pathname);
  const routeKind = getRouteKind(pathname);
  const hideCinematicDetails = AUTH_OR_LEGAL_ROUTE_PATTERN.test(pathname);
  const hideRouteSignal = pathname === '/' || hideCinematicDetails || DIRECTORY_ROUTE_PATTERN.test(pathname);
  const isCompactViewport = typeof window !== 'undefined'
    && window.matchMedia('(max-width: 767px)').matches;

  useEffect(() => {
    if (isCompactViewport) return undefined;

    const root = document.querySelector('.public-route-stage');
    if (!root) return undefined;

    root.dataset.cinematicRoute = routeKind;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const trackedSections = new Set();
    const revealObserver = !prefersReducedMotion && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in-view');
            revealObserver.unobserve(entry.target);
          });
        }, {
          rootMargin: '0px 0px -8%',
          threshold: 0.08
        })
      : null;

    const registerSections = () => {
      getRevealSections(root).forEach((section) => {
        if (trackedSections.has(section)) return;
        const order = trackedSections.size;
        trackedSections.add(section);
        section.classList.add('public-cinematic-section');
        section.style.setProperty('--cinematic-order', String(Math.min(order, 5)));
        section.dataset.cinematicIndex = String(order + 1).padStart(2, '0');

        if (!revealObserver || order < 2) {
          section.classList.add('is-in-view');
        } else {
          revealObserver.observe(section);
        }
      });
    };

    registerSections();
    const mutationObserver = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(registerSections)
      : null;
    mutationObserver?.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver?.disconnect();
      revealObserver?.disconnect();
      trackedSections.forEach((section) => {
        section.classList.remove('public-cinematic-section', 'is-in-view');
        section.style.removeProperty('--cinematic-order');
        delete section.dataset.cinematicIndex;
      });
      delete root.dataset.cinematicRoute;
    };
  }, [isCompactViewport, pathname, routeKind]);

  if (hideCinematicDetails || isCompactViewport) return null;

  return (
    <>
      <div className={`public-route-frame public-route-frame--${routeKind}`} aria-hidden="true">
        <span className="public-route-frame__corner public-route-frame__corner--left" />
        <span className="public-route-frame__track">
          <span className="public-route-frame__pulse" />
        </span>
        <span className="public-route-frame__corner public-route-frame__corner--right" />
      </div>

      {!hideRouteSignal ? (
        <div className={`public-route-signal public-route-signal--${routeKind}`} aria-hidden="true">
          <span className="public-route-signal__line" />
          <span className="public-route-signal__node public-route-signal__node--from">{flow.from}</span>
          <span className="public-route-signal__packet">{flow.signal}</span>
          <span className="public-route-signal__node public-route-signal__node--to">{flow.to}</span>
        </div>
      ) : null}
    </>
  );
};

export default PublicCinematicEnhancements;
