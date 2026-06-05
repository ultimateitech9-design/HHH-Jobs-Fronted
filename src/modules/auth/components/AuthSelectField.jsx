import { useEffect, useMemo, useRef, useState } from 'react';

const AuthSelectField = ({
  label,
  options = [],
  error,
  helper,
  required = false,
  hideErrorText = false,
  className = '',
  searchable = false,
  placeholder = 'Select option',
  value = '',
  onChange,
  disabled = false,
  ...selectProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const selectedOption = useMemo(
    () => options.find((option) => String(option.value ?? option.code) === String(value)),
    [options, value]
  );
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return options.filter((option) => {
      const optionValue = String(option.value ?? option.code ?? '');
      const optionLabel = String(option.label ?? '');
      if (!optionValue) return !term;
      return !term || optionLabel.toLowerCase().includes(term);
    });
  }, [options, query]);

  useEffect(() => {
    if (!searchable || !isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, searchable]);

  const selectOption = (nextValue) => {
    onChange?.({ target: { value: nextValue } });
    setIsOpen(false);
    setQuery('');
  };

  const controlClassName = `w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all ${
    error
      ? 'border-rose-300 bg-rose-50 text-rose-900'
      : 'border-slate-200 bg-slate-50 focus:border-brand-300 focus:bg-white'
  } ${className}`.trim();

  if (searchable) {
    return (
      <label ref={rootRef} className="relative grid h-fit content-start gap-1.5 text-sm font-semibold text-slate-700">
        <span>
          {label}
          {required ? <span className="ml-1 text-amber-600">*</span> : null}
        </span>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setIsOpen((current) => !current);
          }}
          className={`${controlClassName} flex min-h-[3.25rem] items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <span className={`truncate ${selectedOption ? '' : 'text-slate-400'}`}>
            {selectedOption?.label || placeholder}
          </span>
          <span className={`shrink-0 text-lg leading-none transition-transform ${isOpen ? 'rotate-180' : ''}`}>v</span>
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%-0.15rem)] z-50 overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
            <div className="border-b border-slate-100 p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}`}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none focus:border-amber-300 focus:bg-white"
              />
            </div>
            <div role="listbox" className="max-h-64 overflow-y-auto py-1">
              {filteredOptions.length ? filteredOptions.map((option) => {
                const optionValue = String(option.value ?? option.code ?? '');
                const isSelected = String(value) === optionValue;

                return (
                  <button
                    key={optionValue || option.label}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(optionValue)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'bg-[#172033] text-white'
                        : optionValue
                          ? 'text-slate-700 hover:bg-amber-50'
                          : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <span className="text-xs">Selected</span> : null}
                  </button>
                );
              }) : (
                <div className="px-4 py-4 text-sm font-semibold text-slate-400">No options found</div>
              )}
            </div>
          </div>
        ) : null}

        {error && !hideErrorText ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
        {!error && helper ? <span className="text-xs font-medium text-slate-500">{helper}</span> : null}
      </label>
    );
  }

  return (
    <label className="grid h-fit content-start gap-1.5 text-sm font-semibold text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-amber-600">*</span> : null}
      </span>
      <select
        {...selectProps}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={controlClassName}
      >
        {options.map((option) => (
          <option key={option.value || option.code || option.label} value={option.value ?? option.code}>
            {option.label}
          </option>
        ))}
      </select>
      {error && !hideErrorText ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      {!error && helper ? <span className="text-xs font-medium text-slate-500">{helper}</span> : null}
    </label>
  );
};

export default AuthSelectField;
