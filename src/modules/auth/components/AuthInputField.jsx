const AuthInputField = ({ label, error, helper, className = '', ...inputProps }) => {
  return (
    <label className="grid h-fit content-start gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <input
        {...inputProps}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all ${
          error
            ? 'border-rose-300 bg-rose-50 text-rose-900'
            : 'border-slate-200 bg-slate-50 focus:border-brand-300 focus:bg-white'
        } ${className}`.trim()}
      />
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      {!error && helper ? <span className="text-xs font-medium text-slate-500">{helper}</span> : null}
    </label>
  );
};

export default AuthInputField;
