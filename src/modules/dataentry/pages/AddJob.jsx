import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeader from '../../../shared/components/SectionHeader';
import {
  createJobEntry,
  defaultJobEntryDraft,
  formatJobEntryPayload,
  getDataEntryEntryById,
  updateDataEntry
} from '../services/dataentryApi';

const buildDraftFromEntry = (entry = {}) => {
  const source = entry?.data && typeof entry.data === 'object' ? entry.data : {};

  return {
    ...defaultJobEntryDraft,
    title: entry?.title || source.title || '',
    companyName: source.companyName || source.company_name || '',
    location: source.location || '',
    salaryMin: source.salaryMin != null ? String(source.salaryMin) : '',
    salaryMax: source.salaryMax != null ? String(source.salaryMax) : '',
    employmentType: source.employmentType || 'Full-Time',
    experienceLevel: source.experienceLevel || 'Entry',
    description: source.description || '',
    skillsInput: Array.isArray(source.skills) ? source.skills.join(', ') : ''
  };
};

const AddJob = () => {
  const [searchParams] = useSearchParams();
  const entryId = searchParams.get('entryId') || '';
  const [draft, setDraft] = useState(defaultJobEntryDraft);
  const [existingEntry, setExistingEntry] = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isEditMode = Boolean(entryId);

  const setField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (!entryId) {
      setExistingEntry(null);
      setDraft(defaultJobEntryDraft);
      setLoadingEntry(false);
      return;
    }

    let active = true;

    const loadEntry = async () => {
      setLoadingEntry(true);
      setError('');
      setMessage('');

      const response = await getDataEntryEntryById(entryId);
      if (!active) return;

      if (response.error) {
        setError(response.error);
        setExistingEntry(null);
        setLoadingEntry(false);
        return;
      }

      const nextEntry = response.data || {};
      setExistingEntry(nextEntry);
      setDraft(buildDraftFromEntry(nextEntry));
      setLoadingEntry(false);
    };

    loadEntry();

    return () => {
      active = false;
    };
  }, [entryId]);

  const submitLabel = useMemo(() => (
    saving
      ? (isEditMode ? 'Updating...' : 'Saving...')
      : (isEditMode ? 'Update Job Entry' : 'Save Job Entry')
  ), [isEditMode, saving]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.title || !draft.companyName || !draft.location) {
      setError('Title, company name, and location are required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = formatJobEntryPayload(draft);

      if (isEditMode) {
        const saved = await updateDataEntry(entryId, {
          title: payload.title,
          data: {
            ...(existingEntry?.data || {}),
            ...payload
          }
        });
        setExistingEntry(saved);
        setDraft(buildDraftFromEntry(saved));
        setMessage(`Job entry ${saved.id || draft.title} updated successfully.`);
      } else {
        const saved = await createJobEntry(draft);
        setMessage(`Job entry ${saved.id || draft.title} saved successfully.`);
        setDraft(defaultJobEntryDraft);
      }
    } catch (actionError) {
      setError(actionError.message || `Unable to ${isEditMode ? 'update' : 'create'} job entry.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page module-page--dataentry">
      <SectionHeader
        eyebrow="Data Entry"
        title={isEditMode ? 'Edit Job Entry' : 'Add Job'}
        subtitle={isEditMode
          ? 'Update the selected entry without leaving the data entry workflow.'
          : 'Create job records for HHH Jobs employers with location, salary, skill, and employment details.'}
      />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <section className="panel-card">
        {loadingEntry ? <p className="module-note">Loading entry details...</p> : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Job Title
            <input value={draft.title} onChange={(event) => setField('title', event.target.value)} />
          </label>
          <label>
            Company Name
            <input value={draft.companyName} onChange={(event) => setField('companyName', event.target.value)} />
          </label>
          <label>
            Location
            <input value={draft.location} onChange={(event) => setField('location', event.target.value)} />
          </label>
          <label>
            Employment Type
            <select value={draft.employmentType} onChange={(event) => setField('employmentType', event.target.value)}>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </label>
          <label>
            Experience Level
            <select value={draft.experienceLevel} onChange={(event) => setField('experienceLevel', event.target.value)}>
              <option value="Entry">Entry</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
            </select>
          </label>
          <label>
            Min Salary
            <input type="number" value={draft.salaryMin} onChange={(event) => setField('salaryMin', event.target.value)} />
          </label>
          <label>
            Max Salary
            <input type="number" value={draft.salaryMax} onChange={(event) => setField('salaryMax', event.target.value)} />
          </label>
          <label className="full-row">
            Skills
            <input value={draft.skillsInput} placeholder="Sales, CRM, Field Work" onChange={(event) => setField('skillsInput', event.target.value)} />
          </label>
          <label className="full-row">
            Description
            <textarea rows="6" value={draft.description} onChange={(event) => setField('description', event.target.value)} />
          </label>
          <div className="student-job-actions full-row">
            <button type="submit" className="btn-primary" disabled={saving || loadingEntry}>{submitLabel}</button>
            <button
              type="button"
              className="btn-link"
              onClick={() => setDraft(isEditMode && existingEntry ? buildDraftFromEntry(existingEntry) : defaultJobEntryDraft)}
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AddJob;
