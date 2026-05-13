import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatCard from '../../../shared/components/StatCard';
import { countryCodeOptions } from '../../auth/config/authOptions';
import { getSelectedCountry, validatePhoneByCountryCode } from '../../auth/utils/signupValidation';
import DataEntryProfileForm from '../components/DataEntryProfileForm';
import { getAssignedTasks, getDataEntryProfile, updateDataEntryProfile } from '../services/dataentryApi';

const parseProfileDraft = (profile = {}) => {
  const rawMobile = String(profile.mobile || '').trim();
  const matchedCountry = [...countryCodeOptions]
    .sort((left, right) => right.code.length - left.code.length)
    .find((item) => rawMobile.startsWith(item.code));
  const mobileCountryCode = matchedCountry?.code || '+91';
  const mobile = matchedCountry
    ? rawMobile.slice(mobileCountryCode.length).replace(/\D/g, '')
    : rawMobile.replace(/\D/g, '');

  return {
    mobileCountryCode,
    ...profile,
    mobile
  };
};

const Profile = () => {
  const [draft, setDraft] = useState({});
  const [taskCount, setTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [profileRes, taskRes] = await Promise.all([getDataEntryProfile(), getAssignedTasks()]);
      if (!mounted) return;

      const profile = profileRes.data || {};
      setDraft(parseProfileDraft(profile));
      setTaskCount((taskRes.data || []).length);
      setError(profileRes.error || taskRes.error || '');
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => ([
    { label: 'Employee ID', value: draft.employeeId || '-', helper: 'Operator identity', tone: 'info' },
    { label: 'Shift', value: draft.shift || '-', helper: draft.location || 'Assigned location', tone: 'default' },
    { label: 'Daily Target', value: draft.dailyTarget || '-', helper: 'Expected entries per day', tone: 'warning' },
    { label: 'Assigned Tasks', value: String(taskCount), helper: 'Current operator queue', tone: 'success' }
  ]), [draft, taskCount]);

  const setField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const selectedCountry = getSelectedCountry(draft.mobileCountryCode || '+91');
  const mobileValue = String(draft.mobile || '').replace(/\D/g, '').slice(0, selectedCountry.digits);
  const mobileError = validatePhoneByCountryCode(selectedCountry.code, mobileValue, { required: true });
  const mobileValidationMessage = mobileValue
    ? (mobileError || `Valid mobile number for ${selectedCountry.label}.`)
    : `Enter exactly ${selectedCountry.digits} digits for ${selectedCountry.label}.`;

  const handleFieldChange = (field, value) => {
    if (field === 'mobileCountryCode') {
      const nextCountry = getSelectedCountry(value);
      setDraft((current) => ({
        ...current,
        mobileCountryCode: nextCountry.code,
        mobile: String(current.mobile || '').replace(/\D/g, '').slice(0, nextCountry.digits)
      }));
      return;
    }

    if (field === 'mobile') {
      setDraft((current) => ({
        ...current,
        mobile: String(value || '').replace(/\D/g, '').slice(0, getSelectedCountry(current.mobileCountryCode || '+91').digits)
      }));
      return;
    }

    setField(field, value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (mobileError) {
      setError(mobileError);
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await updateDataEntryProfile({
        ...draft,
        mobileCountryCode: selectedCountry.code,
        mobile: mobileValue
      });
      setDraft(parseProfileDraft(updated));
      setMessage('Profile updated successfully.');
    } catch (actionError) {
      setError(actionError.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page module-page--dataentry">
      <SectionHeader eyebrow="Data Entry" title="Profile" subtitle="Manage operator identity, shift details, output targets, and working notes." />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {loading ? <p className="module-note">Loading profile...</p> : null}

      {!loading ? (
        <>
          <div className="stats-grid">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
          <section className="panel-card">
            <DataEntryProfileForm draft={draft} saving={saving} mobileError={mobileError} mobileValidationMessage={mobileValidationMessage} onChange={handleFieldChange} onSubmit={handleSubmit} />
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Profile;
