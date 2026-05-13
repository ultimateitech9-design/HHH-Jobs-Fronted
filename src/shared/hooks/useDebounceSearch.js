import { useCallback, useEffect, useRef, useState } from 'react';

export const useDebounce = (value, delay = 350) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export const useDebounceSearch = ({
  searchFn,
  delay = 400,
  minChars = 0,
  initialData = null
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const debouncedQuery = useDebounce(query, delay);

  const executeSearch = useCallback(async (searchQuery) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (minChars > 0 && searchQuery.length < minChars) {
      setResults(initialData);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const data = await searchFn(searchQuery, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setResults(data);
        setLoading(false);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.message || 'Search failed');
        setLoading(false);
      }
    }
  }, [searchFn, minChars, initialData]);

  useEffect(() => {
    executeSearch(debouncedQuery);
  }, [debouncedQuery, executeSearch]);

  const reset = useCallback(() => {
    setQuery('');
    setResults(initialData);
    setError('');
  }, [initialData]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    reset
  };
};

export default useDebounceSearch;
