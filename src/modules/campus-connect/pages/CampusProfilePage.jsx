import { useEffect, useRef, useState } from 'react';
import {
  FiCheckCircle,
  FiEdit2,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiUser
} from 'react-icons/fi';
import { getCampusProfile, updateCampusProfile } from '../services/campusConnectApi';

const EMPTY_FORM = {
  name: '', city: '', state: '', affiliation: '', establishedYear: '',
  website: '', contactEmail: '', contactPhone: '', about: '',
  placementOfficerName: '', logoUrl: ''
};

export default function CampusProfilePage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState({ type: '', text: '' });
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
    getCampusProfile().then(({ data, error }) => {
      if (!mounted) return;
      if (data && Object.keys(data).length > 0) {
        setForm({
          name: data.name || '',
          city: data.city || '',
          state: data.state || '',
          affiliation: data.affiliation || '',
          establishedYear: data.established_year || '',
          website: data.website || '',
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || '',
          about: data.about || '',
          placementOfficerName: data.placement_officer_name || '',
          logoUrl: data.logo_url || ''
        });
      }
      if (error) showFlash('error', error);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name) { showFlash('error', 'College name is required.'); return; }
    setSaving(true);
    try {
      await updateCampusProfile(form);
      showFlash('success', 'College profile saved successfully.');
    } catch (err) {
      showFlash('error', err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100';
  const cardClass = 'rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]';

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">College Profile</h1>
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
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-white text-2xl font-extrabold text-brand-600">
              {form.logoUrl
                ? <img src={form.logoUrl} alt="College logo" className="h-full w-full object-cover" />
                : (form.name || 'C').charAt(0).toUpperCase()
              }
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-navy">{form.name || 'Your College Name'}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                {form.city && <span className="flex items-center gap-1"><FiMapPin size={11} />{form.city}{form.state ? `, ${form.state}` : ''}</span>}
                {form.affiliation && <span>{form.affiliation}</span>}
                {form.establishedYear && <span>Est. {form.establishedYear}</span>}
                {form.website && <span className="flex items-center gap-1"><FiGlobe size={11} />{form.website}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Basic info */}
      <div className={cardClass}>
        <h2 className="mb-5 text-lg font-extrabold text-navy">Basic Information</h2>
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">City</label>
            <input value={form.city} onChange={(e) => update('city', e.target.value)}
              placeholder="e.g. Mumbai" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">State</label>
            <input value={form.state} onChange={(e) => update('state', e.target.value)}
              placeholder="e.g. Maharashtra" className={inputClass} />
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
          </div>
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className={cardClass}>
        <h2 className="mb-5 text-lg font-extrabold text-navy">Placement Cell Contact</h2>
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
        <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-navy">
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
