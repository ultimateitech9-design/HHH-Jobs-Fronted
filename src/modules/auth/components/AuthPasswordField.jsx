import { FiEye, FiEyeOff } from 'react-icons/fi';

const AuthPasswordField = ({
  label,
  error,
  helper,
  showPassword,
  onTogglePassword,
  className = '',
  ...inputProps
}) => {
  return (
    <label className="grid h-fit content-start gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all ${
          error
            ? 'border-rose-300 bg-rose-50'
            : 'border-slate-200 bg-slate-50 focus-within:border-brand-300 focus-within:bg-white'
        } ${className}`.trim()}
      >
        <input
          {...inputProps}
          type={showPassword ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
          className="text-slate-500 transition-colors hover:text-slate-700"
          disabled={inputProps.disabled}
        >
          {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
        </button>
      </div>
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      {!error && helper ? <span className="text-xs font-medium text-slate-500">{helper}</span> : null}
    </label>
  );
};

export default AuthPasswordField;
