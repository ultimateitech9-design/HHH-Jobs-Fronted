import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const useDashboardView = (viewKeys, defaultView) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedViews = useMemo(() => new Set(viewKeys), [viewKeys]);
  const requestedView = searchParams.get('view');
  const activeView = allowedViews.has(requestedView) ? requestedView : defaultView;

  const setActiveView = useCallback((nextView) => {
    if (!allowedViews.has(nextView)) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextView === defaultView) next.delete('view');
      else next.set('view', nextView);
      return next;
    }, { replace: false });
  }, [allowedViews, defaultView, setSearchParams]);

  return [activeView, setActiveView];
};

export default useDashboardView;
