import { useEffect, useRef, useState } from 'react';
import {
  FiCheckCircle,
  FiEdit2,
  FiGlobe,
  FiImage,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiUpload,
  FiUser
} from 'react-icons/fi';
import AuthSelectField from '../../auth/components/AuthSelectField';
import { getCampusProfile, updateCampusProfile, uploadCampusProfileLogo } from '../services/campusConnectApi';
import { apiFetch } from '../../../utils/api';

const EMPTY_FORM = {
  name: '', city: '', state: '', stateId: '', stateName: '', districtId: '', districtName: '', affiliation: '', establishedYear: '',
  website: '', contactEmail: '', contactPhone: '', about: '',
  placementOfficerName: '', logoUrl: ''
};

const compressImageFile = (file) => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith('image/')) {
    reject(new Error('Please choose an image file.'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Unable to read image file.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Unable to load image file.'));
    image.onload = () => {
      const maxSize = 720;
      const scale = Math.min(1, maxSize / Math.max(image.width || maxSize, image.height || maxSize));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((image.width || maxSize) * scale));
      canvas.height = Math.max(1, Math.round((image.height || maxSize) * scale));
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Unable to compress image.'));
          return;
        }
        resolve(new File([blob], 'college-logo.webp', { type: 'image/webp' }));
      }, 'image/webp', 0.82);
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const hydrateProfileForm = (profile = {}) => ({
  name: profile.name || '',
  city: profile.city || profile.district_name || profile.districtName || '',
  state: profile.state || profile.state_name || profile.stateName || '',
  stateId: profile.state_id || profile.stateId || '',
  stateName: profile.state_name || profile.stateName || profile.state || '',
  districtId: profile.district_id || profile.districtId || '',
  districtName: profile.district_name || profile.districtName || profile.city || '',
  affiliation: profile.affiliation || '',
  establishedYear: profile.established_year || profile.establishedYear || '',
  website: profile.website || '',
  contactEmail: profile.contact_email || profile.contactEmail || profile.email || '',
  contactPhone: profile.contact_phone || profile.contactPhone || profile.mobile || '',
  about: profile.about || '',
  placementOfficerName: profile.placement_officer_name || profile.placementOfficerName || '',
  logoUrl: profile.logo_url || profile.logoUrl || ''
});

export default function CampusProfilePage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [flash, setFlash] = useState({ type: '', text: '' });
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const logoInputRef = useRef(null);
  const timerRef = useRef(null);

  const showFlash = (type, text) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlash({ type, text });
    timerRef.current = setTimeout(() => setFlash({ type: '', text: '' }), 5000);
  };

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getCampusProfile(),
      apiFetch('/jobs/meta/states')
        .then((res) => res.json())
        .then((payload) => payload?.states || [])
        .catch(() => [])
    ]).then(async ([{ data, error }, stateRows]) => {
      if (!mounted) return;
      setStates(stateRows);
      if (data && Object.keys(data).length > 0) {
        const stateName = data.state_name || data.stateName || data.state || '';
        const selectedState = data.state_id
          ? stateRows.find((item) => String(item.id) === String(data.state_id))
          : stateRows.find((item) => String(item.name || '').toLowerCase() === String(stateName).toLowerCase());
        let districtRows = [];
        if (selectedState?.id) {
          try {
            const response = await apiFetch(`/jobs/meta/districts?stateId=${encodeURIComponent(selectedState.id)}`);
            const payload = await response.json();
            districtRows = payload?.districts || [];
          } catch {
            districtRows = [];
          }
          if (mounted) setDistricts(districtRows);
        }
        if (!mounted) return;
        const districtName = data.district_name || data.districtName || data.city || '';
        const selectedDistrict = data.district_id
          ? districtRows.find((item) => String(item.id) === String(data.district_id))
          : districtRows.find((item) => String(item.name || '').toLowerCase() === String(districtName).toLowerCase());
        setForm({
          ...hydrateProfileForm(data),
          city: data.city || districtName || '',
          state: data.state || stateName || '',
          stateId: selectedState?.id || data.state_id || '',
          stateName: selectedState?.name || stateName || '',
          districtId: selectedDistrict?.id || data.district_id || '',
          districtName: selectedDistrict?.name || districtName || ''
        });
      }
      if (error) showFlash('error', error);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleStateSelect = async (stateId) => {
    const selectedState = states.find((item) => String(item.id) === String(stateId));
    setForm((current) => ({
      ...current,
      stateId,
      stateName: selectedState?.name || '',
      state: selectedState?.name || '',
      districtId: '',
      districtName: '',
      city: ''
    }));
    setDistricts([]);

    if (!stateId) return;

    try {
      const response = await apiFetch(`/jobs/meta/districts?stateId=${encodeURIComponent(stateId)}`);
      const payload = await response.json();
      setDistricts(payload?.districts || []);
    } catch {
      setDistricts([]);
    }
  };

  const handleDistrictSelect = (districtId) => {
    const selectedDistrict = districts.find((item) => String(item.id) === String(districtId));
    setForm((current) => ({
      ...current,
      districtId,
      districtName: selectedDistrict?.name || '',
      city: selectedDistrict?.name || ''
    }));
  };

  const handleSave = async () => {
    if (!form.name) { showFlash('error', 'College name is required.'); return; }
    setSaving(true);
    try {
      const updated = await updateCampusProfile(form);
      setForm((current) => ({ ...current, ...hydrateProfileForm(updated) }));
      showFlash('success', 'College profile saved successfully.');
    } catch (err) {
      showFlash('error', err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLogoUploading(true);
    try {
      const compressedFile = await compressImageFile(file);
      const uploaded = await uploadCampusProfileLogo(compressedFile);
      setForm((current) => ({
        ...current,
        ...hydrateProfileForm(uploaded.profile),
        logoUrl: uploaded.logoUrl || uploaded.profile?.logo_url || current.logoUrl
      }));
      showFlash('success', 'College logo uploaded and compressed automatically.');
    } catch (err) {
      showFlash('error', err.message || 'Unable to upload college logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100';
  const cardClass = 'rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]';

  return (
    <div className="vw-shell space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">College Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            This is how your college appears to companies browsing the Campus Connect network.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef5c30] disabled:opacity-70"
        >
          {saving ? <FiRefreshCw size={15} className="animate-spin" /> : <FiCheckCircle size={15} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {flash.text && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
          flash.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {flash.text}
        </div>
      )}

      {/* Profile preview banner */}
      <div className="rounded-[1.75rem] border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-6">
        {loading ? (
          <div className="flex gap-4">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-white/80" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-white/80" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/70" />
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-white text-2xl font-bold text-brand-600 disabled:opacity-70"
              title="Upload college logo"
            >
              {form.logoUrl
                ? <img src={form.logoUrl} alt="College logo" className="h-full w-full object-cover" />
                : <FiImage className="text-brand-300" />
              }
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-white opacity-0 transition group-hover:opacity-100">
                {logoUploading ? <FiRefreshCw className="animate-spin" /> : <FiUpload />}
              </span>
            </button>
            <div>
              <h2 className="text-xl font-bold text-navy">{form.name || 'Your College Name'}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                {form.city && <span className="flex items-center gap-1"><FiMapPin size={11} />{form.city}{form.state ? `, ${form.state}` : ''}</span>}
                {form.affiliation && <span>{form.affiliation}</span>}
                {form.establishedYear && <span>Est. {form.establishedYear}</span>}
                {form.website && <span className="flex items-center gap-1"><FiGlobe size={11} />{form.website}</span>}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm transition hover:bg-brand-50 disabled:opacity-70"
              >
                {logoUploading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiUpload size={13} />}
                {logoUploading ? 'Compressing...' : 'Upload logo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Basic info */}
      <div className={cardClass}>
        <h2 className="mb-5 text-lg font-bold text-navy">Basic Information</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`${index === 0 ? 'md:col-span-2' : ''} space-y-2`}>
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">College / University Name <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Veermata Jijabai Technological Institute (VJTI)"
              className={inputClass} />
          </div>
          <div>
            {districts.length > 0 ? (
              <AuthSelectField
                label="City / district"
                value={form.districtId}
                onChange={(event) => handleDistrictSelect(event.target.value)}
                searchable
                placeholder="Select city / district"
                options={[
                  { value: '', label: 'Select city / district' },
                  ...districts.map((district) => ({ value: district.id, label: district.name }))
                ]}
                className="!rounded-xl !border-slate-200 !bg-white !px-4 !py-3 !text-sm focus:!border-brand-300 focus:!ring-2 focus:!ring-brand-100"
              />
            ) : (
              <>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">City / district</label>
                <input value={form.city} onChange={(e) => update('city', e.target.value)}
                  placeholder="e.g. Mumbai" className={inputClass} />
              </>
            )}
          </div>
          <div>
            {states.length > 0 ? (
              <AuthSelectField
                label="State"
                value={form.stateId}
                onChange={(event) => handleStateSelect(event.target.value)}
                searchable
                placeholder="Select state"
                options={[
                  { value: '', label: 'Select state' },
                  ...states.map((state) => ({ value: state.id, label: state.name }))
                ]}
                className="!rounded-xl !border-slate-200 !bg-white !px-4 !py-3 !text-sm focus:!border-brand-300 focus:!ring-2 focus:!ring-brand-100"
              />
            ) : (
              <>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">State</label>
                <input value={form.state} onChange={(e) => update('state', e.target.value)}
                  placeholder="e.g. Maharashtra" className={inputClass} />
              </>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Affiliation / University</label>
            <input value={form.affiliation} onChange={(e) => update('affiliation', e.target.value)}
              placeholder="e.g. Mumbai University, Autonomous" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Established Year</label>
            <input type="number" value={form.establishedYear} onChange={(e) => update('establishedYear', e.target.value)}
              placeholder="e.g. 1887" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">College Website</label>
            <input value={form.website} onChange={(e) => update('website', e.target.value)}
              placeholder="https://vjti.ac.in" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Logo URL</label>
            <input value={form.logoUrl} onChange={(e) => update('logoUrl', e.target.value)}
              placeholder="https://yoursite.com/logo.png" className={inputClass} />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-70"
            >
              {logoUploading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiUpload size={13} />}
              {logoUploading ? 'Uploading...' : 'Upload file instead'}
            </button>
          </div>
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className={cardClass}>
        <h2 className="mb-5 text-lg font-bold text-navy">Placement Cell Contact</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              <FiUser size={11} className="mr-1 inline" />
              Placement Officer Name
            </label>
            <input value={form.placementOfficerName} onChange={(e) => update('placementOfficerName', e.target.value)}
              placeholder="e.g. Prof. Ramesh Sharma" className={inputClass} />
          </div>
          <div />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              <FiMail size={11} className="mr-1 inline" />
              Contact Email
            </label>
            <input type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)}
              placeholder="placements@college.edu" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              <FiPhone size={11} className="mr-1 inline" />
              Contact Phone
            </label>
            <input value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)}
              placeholder="+91 98765 43210" className={inputClass} />
          </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className={cardClass}>
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-navy">
          <FiEdit2 size={18} />
          About the College
        </h2>
        {loading ? (
          <div className="h-36 animate-pulse rounded-[1.25rem] bg-slate-100" />
        ) : (
          <textarea
            rows="5"
            value={form.about}
            onChange={(e) => update('about', e.target.value)}
            placeholder="Write a short description of your college — history, specializations, notable alumni, NAAC grade, NBA accreditation, etc. This is shown to companies browsing your campus profile."
            className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6b3d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#ef5c30] disabled:opacity-70"
        >
          {saving ? <FiRefreshCw size={15} className="animate-spin" /> : <FiCheckCircle size={15} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
