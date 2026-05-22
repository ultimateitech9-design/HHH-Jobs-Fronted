import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeader from '../../../shared/components/SectionHeader';
import {
  createJobEntry,
  defaultJobEntryDraft,
  formatJobEntryPayload,
  getDataEntryEntryById,
  getRegisteredJobCompanies,
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

const fieldLabelClassName = 'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500';
const fieldControlClassName = 'mt-1.5 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100';
const textareaClassName = `${fieldControlClassName} min-h-[136px] resize-y`;
const registeredCompaniesListId = 'dataentry-registered-job-companies';

const normalizeCompanyKey = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const AddJob = () => {
  const [searchParams] = useSearchParams();
  const entryId = searchParams.get('entryId') || '';
  const [draft, setDraft] = useState(defaultJobEntryDraft);
  const [existingEntry, setExistingEntry] = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [registeredCompanies, setRegisteredCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isEditMode = Boolean(entryId);

  const setField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    let active = true;

    const loadCompanies = async () => {
      setLoadingCompanies(true);
      setCompaniesError('');

      const response = await getRegisteredJobCompanies();
      if (!active) return;

      setRegisteredCompanies(Array.isArray(response.data) ? response.data : []);
      setCompaniesError(response.error || '');
      setLoadingCompanies(false);
    };

    loadCompanies();

    return () => {
      active = false;
    };
  }, []);

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
      ? (isEditMode ? 'Updating...' : 'Posting...')
      : (isEditMode ? 'Update Job Post' : 'Post Job')
  ), [isEditMode, saving]);
  const registeredCompany = useMemo(() => {
    const companyKey = normalizeCompanyKey(draft.companyName);
    if (!companyKey) return null;

    return registeredCompanies.find((company) => normalizeCompanyKey(company.companyName) === companyKey) || null;
  }, [draft.companyName, registeredCompanies]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.title || !draft.companyName || !draft.location || !draft.salaryMax || !draft.description) {
      setError('Title, registered company, location, max salary, and description are required before posting.');
      return;
    }

    if (loadingCompanies) {
      setError('Registered companies are still loading. Try again in a moment.');
      return;
    }

    if (companiesError) {
      setError(`Unable to check registered companies. ${companiesError}`);
      return;
    }

    if (!registeredCompany) {
      setError('Select a registered company from the employer portal list before saving this job entry.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const registeredDraft = {
        ...draft,
        companyName: registeredCompany.companyName
      };
      const payload = formatJobEntryPayload(registeredDraft);

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
        setMessage(`Job post ${saved.id || draft.title} updated in the HR account.`);
      } else {
        const saved = await createJobEntry(registeredDraft);
        setMessage(`Job ${saved.id || draft.title} posted to the registered HR account.`);
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

      <section className="admin-ops-panel overflow-hidden">
        <div className="admin-ops-panel-header">
          <div className="max-w-3xl">
            <h2 className="admin-ops-panel-title">Entry details</h2>
            <p className="admin-ops-panel-note">Complete the employer, salary, skills, and description fields below to keep the entry consistent and publication-ready.</p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1100px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
          {loadingEntry ? <p className="module-note">Loading entry details...</p> : null}
          <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="grid gap-0.5">
              <span className={fieldLabelClassName}>Job Title</span>
              <input className={fieldControlClassName} value={draft.title} onChange={(event) => setField('title', event.target.value)} />
            </label>
            <label className="grid gap-0.5">
              <span className={fieldLabelClassName}>Company Name</span>
              <input
                className={fieldControlClassName}
                list={registeredCompaniesListId}
                value={draft.companyName}
                placeholder={loadingCompanies ? 'Loading registered companies...' : 'Select registered company'}
                autoComplete="off"
                onChange={(event) => setField('companyName', event.target.value)}
              />
              <datalist id={registeredCompaniesListId}>
                {registeredCompanies.map((company) => (
                  <option key={company.id || company.companyName} value={company.companyName} />
                ))}
              </datalist>
              {companiesError ? <span className="text-xs font-medium text-rose-600">{companiesError}</span> : null}
            </label>
            <label className="grid gap-0.5">
              <span className={fieldLabelClassName}>Location</span>
              <input className={fieldControlClassName} value={draft.location} onChange={(event) => setField('location', event.target.value)} />
            </label>
            <label className="grid gap-0.5">
              <span className={fieldLabelClassName}>Employment Type</span>
              <select className={fieldControlClassName} value={draft.employmentType} onChange={(event) => setField('employmentType', event.target.value)}>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </label>
            <label className="grid gap-0.5">
              <span className={fieldLabelClassName}>Experience Level</span>
              <select className={fieldControlClassName} value={draft.experienceLevel} onChange={(event) => setField('experienceLevel', event.target.value)}>
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </label>
            <label className="grid gap-0.5">
              <span className={fieldLabelClassName}>Min Salary</span>
              <input className={fieldControlClassName} type="number" value={draft.salaryMin} onChange={(event) => setField('salaryMin', event.target.value)} />
            </label>
            <label className="grid gap-0.5">
              <span className={fieldLabelClassName}>Max Salary</span>
              <input className={fieldControlClassName} type="number" value={draft.salaryMax} onChange={(event) => setField('salaryMax', event.target.value)} />
            </label>
            <label className="grid gap-0.5 md:col-span-2">
              <span className={fieldLabelClassName}>Skills</span>
              <input className={fieldControlClassName} value={draft.skillsInput} placeholder="Sales, CRM, Field Work" onChange={(event) => setField('skillsInput', event.target.value)} />
            </label>
            <label className="grid gap-0.5 md:col-span-2">
              <span className={fieldLabelClassName}>Description</span>
              <textarea className={textareaClassName} rows="4" maxLength="250" value={draft.description} onChange={(event) => setField('description', event.target.value)} />
            </label>
            <div className="md:col-span-2 mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                className="btn-link"
                onClick={() => setDraft(isEditMode && existingEntry ? buildDraftFromEntry(existingEntry) : defaultJobEntryDraft)}
              >
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={saving || loadingEntry}>{submitLabel}</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AddJob;
