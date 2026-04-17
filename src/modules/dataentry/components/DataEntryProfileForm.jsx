const DataEntryProfileForm = ({ draft, saving, onChange, onSubmit }) => {
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
        <input value={draft.mobile || ''} onChange={(event) => onChange('mobile', event.target.value)} />
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
