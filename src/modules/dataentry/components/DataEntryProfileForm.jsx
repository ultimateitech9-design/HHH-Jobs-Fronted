import { countryCodeOptions } from '../../auth/config/authOptions';

const DataEntryProfileForm = ({ draft, saving, mobileError, mobileValidationMessage, onChange, onSubmit }) => {
  const countryCode = draft.mobileCountryCode || '+91';

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Name
        <input value={draft.name || ''} onChange={(event) => onChange('name', event.target.value)} />
      </label>
      <label>
        Email
        <input value={draft.email || ''} readOnly disabled title="Email is managed through the login account." />
      </label>
      <label>
        Mobile
        <div className="flex gap-2">
          <select value={countryCode} onChange={(event) => onChange('mobileCountryCode', event.target.value)} className="max-w-[180px]">
            {countryCodeOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
          <input
            value={draft.mobile || ''}
            type="tel"
            inputMode="numeric"
            onChange={(event) => onChange('mobile', event.target.value.replace(/\D/g, ''))}
            placeholder="Mobile number"
            aria-invalid={Boolean(mobileError)}
          />
        </div>
        <span className={`text-xs font-semibold ${mobileError ? 'text-red-600' : 'text-slate-500'}`}>{mobileValidationMessage}</span>
      </label>
      <label>
        Employee ID
        <input value={draft.employeeId || ''} onChange={(event) => onChange('employeeId', event.target.value)} />
      </label>
      <label>
        Shift
        <select value={draft.shift || 'Morning'} onChange={(event) => onChange('shift', event.target.value)}>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Night">Night</option>
        </select>
      </label>
      <label>
        Location
        <input value={draft.location || ''} onChange={(event) => onChange('location', event.target.value)} />
      </label>
      <label className="full-row">
        Headline
        <input value={draft.headline || ''} onChange={(event) => onChange('headline', event.target.value)} />
      </label>
      <label>
        Daily Target
        <input value={draft.dailyTarget || ''} onChange={(event) => onChange('dailyTarget', event.target.value)} />
      </label>
      <label className="full-row">
        Notes
        <textarea rows="4" value={draft.notes || ''} onChange={(event) => onChange('notes', event.target.value)} />
      </label>
      <div className="student-job-actions full-row">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </div>
    </form>
  );
};

export default DataEntryProfileForm;
