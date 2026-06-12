import { useEffect, useRef, useState } from 'react';
import { 
  FiBriefcase, 
  FiGlobe, 
  FiUsers, 
  FiTarget, 
  FiCalendar, 
  FiMapPin, 
  FiImage, 
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiSave,
  FiHash,
  FiShield,
  FiUpload,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import {
  deleteHrCompany,
  getHrCompanies,
  getHrProfile,
  getJobDistricts,
  getJobSectors,
  getJobStates,
  saveHrCompany,
  updateHrProfile,
  uploadHrProfileLogo
} from '../services/hrApi';
import { getCurrentUser, getToken, setAuthSession } from '../../../utils/auth';
import { generateHrEmployerId } from '../../../utils/hrIdentity';

const EMPTY_HR_PROFILE_FORM = {
  companyName: '',
  companyWebsite: '',
  companySize: '',
  industryType: '',
  sectorId: '',
  sectorName: '',
  foundedYear: '',
  companyType: '',
  location: '',
  stateId: '',
  stateName: '',
  districtId: '',
  districtName: '',
  about: '',
  logoUrl: '',
  hrEmployerId: '',
  employeeCode: ''
};

const EMPTY_HIRING_COMPANY_FORM = {
  companyKey: '',
  companyName: '',
  logoUrl: '',
  websiteUrl: '',
  location: '',
  stateId: '',
  stateName: '',
  districtId: '',
  districtName: '',
  sectorId: '',
  sectorName: '',
  industryType: '',
  companyType: '',
  companySize: '',
  about: ''
};

const hasText = (value) => String(value ?? '').trim().length > 0;
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
const isReadableHrId = (value) => /^HHHJ-[A-Z0-9]+-[0-9]{3}-[0-9]{4}$/i.test(String(value || '').trim());
const normalizeLookupText = (value = '') => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeCompanyKey = (value = '') => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const findOptionById = (options = [], id = '') => options.find((option) => String(option.id) === String(id));
const findOptionByName = (options = [], name = '') => options.find((option) => normalizeLookupText(option.name) === normalizeLookupText(name));

const resolveHrEmployerId = ({ user = {}, profile = {} } = {}) => {
  const directValue = user.hrEmployerId || user.employeeCode || profile.hrEmployerId || profile.employeeCode;
  if (isReadableHrId(directValue)) return String(directValue).trim().toUpperCase();
  if (directValue && !isUuid(directValue)) return String(directValue).trim().toUpperCase();

  const companyName = profile.companyName || user.companyName || user.name || '';
  const mobile = user.mobile || '';
  if (!companyName && !mobile) return 'Not assigned';

  return generateHrEmployerId({ companyName, mobile });
};

const buildProfileFallbackFromUser = (user = {}) => ({
  companyName: user.companyName || user.company_name || '',
  companyWebsite: user.companyWebsite || user.company_website || '',
  companySize: user.companySize || user.company_size || '',
  industryType: user.industryType || user.industry_type || user.sectorName || user.sector_name || '',
  sectorId: user.sectorId || user.sector_id || '',
  sectorName: user.sectorName || user.sector_name || user.industryType || user.industry_type || '',
  foundedYear: user.foundedYear || user.founded_year || '',
  companyType: user.companyType || user.company_type || '',
  location: user.location || user.companyLocation || user.company_location || '',
  stateId: user.stateId || user.state_id || '',
  stateName: user.stateName || user.state_name || user.state || '',
  districtId: user.districtId || user.district_id || '',
  districtName: user.districtName || user.district_name || user.city || '',
  about: user.about || user.companyAbout || '',
  logoUrl: user.logoUrl || user.logo_url || user.companyLogo || '',
  hrEmployerId: user.hrEmployerId || user.hr_employer_id || '',
  employeeCode: user.employeeCode || user.employee_code || ''
});

const mergeProfileForm = (...sources) => (
  Object.keys(EMPTY_HR_PROFILE_FORM).reduce((acc, key) => {
    const value = sources
      .map((source) => source?.[key])
      .find((item) => hasText(item));
    acc[key] = value || '';
    return acc;
  }, { ...EMPTY_HR_PROFILE_FORM })
);

const mergeUserWithProfile = (user = {}, profile = {}) => ({
  ...user,
  companyName: profile.companyName || user.companyName,
  companyWebsite: profile.companyWebsite || user.companyWebsite,
  companySize: profile.companySize || user.companySize,
  industryType: profile.industryType || user.industryType,
  sectorId: profile.sectorId || user.sectorId,
  sectorName: profile.sectorName || user.sectorName,
  foundedYear: profile.foundedYear || user.foundedYear,
  companyType: profile.companyType || user.companyType,
  location: profile.location || user.location,
  stateId: profile.stateId || user.stateId,
  stateName: profile.stateName || user.stateName,
  districtId: profile.districtId || user.districtId,
  districtName: profile.districtName || user.districtName,
  about: profile.about || user.about,
  logoUrl: profile.logoUrl || user.logoUrl,
  employeeCode: profile.employeeCode || user.employeeCode,
  hrEmployerId: resolveHrEmployerId({ user, profile })
});

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
        resolve(new File([blob], 'company-logo.webp', { type: 'image/webp' }));
      }, 'image/webp', 0.82);
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const HrProfilePage = () => {
  const currentUser = getCurrentUser();
  const logoInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_HR_PROFILE_FORM);
  const [hiringCompanyForm, setHiringCompanyForm] = useState(EMPTY_HIRING_COMPANY_FORM);
  const [managedCompanies, setManagedCompanies] = useState([]);
  const [companyDistricts, setCompanyDistricts] = useState([]);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyDeletingKey, setCompanyDeletingKey] = useState('');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const hrEmployerId = resolveHrEmployerId({ user: currentUser, profile: form });

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const [response, companiesResponse, sectorsResponse, statesResponse] = await Promise.all([
        getHrProfile(),
        getHrCompanies(),
        getJobSectors(),
        getJobStates()
      ]);
      if (!mounted) return;

      const nextProfile = mergeProfileForm(
        response.data,
        buildProfileFallbackFromUser(currentUser)
      );
      const stateOptions = statesResponse.data || [];
      let hydratedProfile = nextProfile;
      let hydratedDistricts = [];
      const matchedState = findOptionById(stateOptions, nextProfile.stateId) || findOptionByName(stateOptions, nextProfile.stateName);
      if (matchedState) {
        hydratedProfile = {
          ...hydratedProfile,
          stateId: matchedState.id || '',
          stateName: matchedState.name || ''
        };
        const districtsResponse = await getJobDistricts(matchedState.id);
        hydratedDistricts = districtsResponse.data || [];
        const matchedDistrict = findOptionById(hydratedDistricts, nextProfile.districtId) || findOptionByName(hydratedDistricts, nextProfile.districtName);
        if (matchedDistrict) {
          hydratedProfile = {
            ...hydratedProfile,
            districtId: matchedDistrict.id || '',
            districtName: matchedDistrict.name || ''
          };
        }
      } else if (nextProfile.stateId) {
        const districtsResponse = await getJobDistricts(nextProfile.stateId);
        hydratedDistricts = districtsResponse.data || [];
      }

      if (!mounted) return;

      setForm(hydratedProfile);
      const token = getToken();
      if (token && currentUser) {
        setAuthSession(token, mergeUserWithProfile(currentUser, hydratedProfile));
      }
      setSectors(sectorsResponse.data || []);
      setStates(stateOptions);
      setDistricts(hydratedDistricts);
      setIsDemo(Boolean(response.isDemo));
      setManagedCompanies(companiesResponse.data || []);
      setError(response.error && !response.isDemo ? response.error : '');
      setLoading(false);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateHiringCompanyField = (key, value) => {
    setHiringCompanyForm((current) => ({ ...current, [key]: value }));
  };

  const handleSectorChange = (sectorId) => {
    const sector = findOptionById(sectors, sectorId);
    setForm((current) => ({
      ...current,
      sectorId,
      sectorName: sector?.name || '',
      industryType: sector?.name || current.industryType
    }));
  };

  const handleStateChange = async (stateId) => {
    const state = findOptionById(states, stateId);
    setForm((current) => ({
      ...current,
      stateId,
      stateName: state?.name || '',
      districtId: '',
      districtName: ''
    }));
    if (!stateId) {
      setDistricts([]);
      return;
    }
    const response = await getJobDistricts(stateId);
    setDistricts(response.data || []);
  };

  const handleHiringCompanySectorChange = (sectorId) => {
    const sector = findOptionById(sectors, sectorId);
    setHiringCompanyForm((current) => ({
      ...current,
      sectorId,
      sectorName: sector?.name || '',
      industryType: sector?.name || current.industryType
    }));
  };

  const handleHiringCompanyStateChange = async (stateId) => {
    const state = findOptionById(states, stateId);
    setHiringCompanyForm((current) => ({
      ...current,
      stateId,
      stateName: state?.name || '',
      districtId: '',
      districtName: ''
    }));
    if (!stateId) {
      setCompanyDistricts([]);
      return;
    }
    const response = await getJobDistricts(stateId);
    setCompanyDistricts(response.data || []);
  };

  const handleHiringCompanyDistrictChange = (districtId) => {
    const district = findOptionById(companyDistricts, districtId);
    setHiringCompanyForm((current) => {
      const districtName = district?.name || '';
      return {
        ...current,
        districtId,
        districtName,
        location: current.location || [districtName, current.stateName].filter(Boolean).join(', ')
      };
    });
  };

  const hydrateHiringCompanyLocation = async (company) => {
    const matchedState = findOptionById(states, company.stateId) || findOptionByName(states, company.stateName);
    const stateId = matchedState?.id || company.stateId || '';
    const stateName = matchedState?.name || company.stateName || '';
    let nextDistricts = [];

    if (stateId) {
      try {
        const response = await getJobDistricts(stateId);
        nextDistricts = response.data || [];
      } catch (districtError) {
        nextDistricts = [];
      }
    }

    const matchedDistrict =
      findOptionById(nextDistricts, company.districtId) ||
      findOptionByName(nextDistricts, company.districtName);

    return {
      company: {
        ...company,
        stateId,
        stateName,
        districtId: matchedDistrict?.id || company.districtId || '',
        districtName: matchedDistrict?.name || company.districtName || ''
      },
      districts: nextDistricts
    };
  };

  const beginAddHiringCompany = async () => {
    const hydrated = await hydrateHiringCompanyLocation({
      ...EMPTY_HIRING_COMPANY_FORM,
      sectorId: form.sectorId,
      sectorName: form.sectorName,
      industryType: form.industryType || form.sectorName,
      stateId: form.stateId,
      stateName: form.stateName,
      districtId: form.districtId,
      districtName: form.districtName
    });
    setHiringCompanyForm(hydrated.company);
    setCompanyDistricts(hydrated.districts);
    setShowCompanyForm(true);
    setError('');
    setSuccess('');
  };

  const beginEditHiringCompany = async (company) => {
    const hydrated = await hydrateHiringCompanyLocation({ ...EMPTY_HIRING_COMPANY_FORM, ...company });
    setHiringCompanyForm(hydrated.company);
    setCompanyDistricts(hydrated.districts);
    setShowCompanyForm(true);
    setError('');
    setSuccess('');
  };

  const cancelHiringCompanyEdit = () => {
    setHiringCompanyForm(EMPTY_HIRING_COMPANY_FORM);
    setCompanyDistricts([]);
    setShowCompanyForm(false);
  };

  const handleSaveHiringCompany = async (event) => {
    event.preventDefault();
    setCompanySaving(true);
    setError('');
    setSuccess('');

    try {
      if (!hiringCompanyForm.companyName.trim()) {
        throw new Error('Hiring company name is required.');
      }
      if (!hiringCompanyForm.sectorName || !hiringCompanyForm.location || !hiringCompanyForm.stateName || !hiringCompanyForm.districtName) {
        throw new Error('Hiring company sector, location, state, and city/district are required.');
      }
      const saved = await saveHrCompany(hiringCompanyForm);
      const companiesResponse = await getHrCompanies();
      setManagedCompanies(companiesResponse.data?.length ? companiesResponse.data : [saved]);
      setHiringCompanyForm(EMPTY_HIRING_COMPANY_FORM);
      setCompanyDistricts([]);
      setShowCompanyForm(false);
      setSuccess('Hiring company saved. It is now available while posting jobs.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save hiring company.');
    } finally {
      setCompanySaving(false);
    }
  };

  const handleDeleteHiringCompany = async (company) => {
    const companyKey = normalizeCompanyKey(company?.companyKey || company?.companyName || '');
    if (!companyKey) return;

    const isPrimaryCompany = String(company?.source || '').toLowerCase() === 'hr_profile';
    if (isPrimaryCompany) {
      setError('Primary profile company cannot be deleted. Edit Company Profile details instead.');
      return;
    }

    if (!window.confirm(`Remove ${company.companyName || 'this company'} from your hiring companies? Existing job posts will stay saved.`)) {
      return;
    }

    setCompanyDeletingKey(companyKey);
    setError('');
    setSuccess('');

    try {
      await deleteHrCompany(companyKey);
      const companiesResponse = await getHrCompanies();
      setManagedCompanies(companiesResponse.data || []);

      if (normalizeCompanyKey(hiringCompanyForm.companyKey || hiringCompanyForm.companyName) === companyKey) {
        cancelHiringCompanyEdit();
      }

      setSuccess('Hiring company removed. Existing jobs remain saved.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to remove hiring company.');
    } finally {
      setCompanyDeletingKey('');
    }
  };

  const handleDistrictChange = (districtId) => {
    const district = findOptionById(districts, districtId);
    setForm((current) => {
      const districtName = district?.name || '';
      const location = current.location || [districtName, current.stateName].filter(Boolean).join(', ');
      return {
        ...current,
        districtId,
        districtName,
        location
      };
    });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLogoUploading(true);
    setError('');
    setSuccess('');
    try {
      const compressedFile = await compressImageFile(file);
      const uploaded = await uploadHrProfileLogo(compressedFile);
      const nextProfile = mergeProfileForm(uploaded.profile, form, { logoUrl: uploaded.logoUrl });
      setForm(nextProfile);
      const token = getToken();
      if (token && currentUser) {
        setAuthSession(token, mergeUserWithProfile(currentUser, nextProfile));
      }
      setSuccess('Company logo uploaded and compressed automatically.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload company logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!form.sectorName || !form.stateName || !form.districtName || !form.location) {
        throw new Error('Sector, company location, state, and city/district are required.');
      }
      const updated = await updateHrProfile(form);
      setForm(updated);
      const token = getToken();
      if (token && currentUser) {
        setAuthSession(token, mergeUserWithProfile(currentUser, updated));
      }
      setSuccess('Company profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3s
    } catch (saveError) {
      setError(saveError.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary tracking-tight mb-2">Company Profile</h1>
          <p className="text-neutral-500 text-lg">Manage your organization&apos;s brand, details, and verification data.</p>
        </div>
        <div className="bg-brand-50 text-brand-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-brand-100 shadow-sm shrink-0">
          <FiShield className="text-brand-500" />
          <span className="text-sm font-bold">HR ID: <span className="font-mono tracking-wider ml-1">{hrEmployerId}</span></span>
        </div>
      </header>

      {isDemo && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl border border-amber-200 shadow-sm font-semibold">
          Demo Mode: Showing placeholder data. Profile changes won&apos;t be saved to a backend server.
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200 shadow-sm animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {success && !error && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200 shadow-sm animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-[2rem] border border-neutral-100 h-96 animate-pulse p-10 flex flex-col gap-6">
          <div className="h-24 w-24 bg-neutral-100 rounded-3xl mb-4"></div>
          <div className="h-10 bg-neutral-50 rounded-xl w-1/3"></div>
          <div className="h-20 bg-neutral-50 rounded-xl w-full"></div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-[2rem] shadow-sm border border-neutral-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-bl-full pointer-events-none opacity-50"></div>
          
          <div className="p-6 md:p-10 relative z-10 flex flex-col lg:flex-row gap-10">
            
            {/* Left Side: Logo & Basic Overview */}
            <div className="w-full lg:w-1/3 shrink-0 flex flex-col items-center lg:items-start text-center lg:text-left">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-neutral-50 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center p-2 mb-6 shadow-sm overflow-hidden relative group">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <FiImage size={32} className="text-neutral-300 mb-2" />
                    <span className="text-xs font-bold text-neutral-400">No Logo</span>
                  </>
                )}
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-primary shadow-sm disabled:opacity-60"
                  >
                    {logoUploading ? (
                      <span className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    ) : (
                      <FiUpload />
                    )}
                    {logoUploading ? 'Uploading' : 'Upload logo'}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="mb-5 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
              >
                {logoUploading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-700 animate-spin" />
                ) : (
                  <FiUpload />
                )}
                {logoUploading ? 'Compressing...' : 'Upload company logo'}
              </button>
              
              <h2 className="text-2xl font-bold text-primary mb-1 w-full truncate">
                {form.companyName || 'Your Company'}
              </h2>
              <p className="text-sm font-bold text-neutral-400 mb-6 flex items-center justify-center lg:justify-start gap-1">
                <FiMapPin /> {form.location || 'Location not set'}
              </p>

              <div className="w-full space-y-4">
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">Company Admin</span>
                  <div className="font-medium text-primary flex items-center gap-2">
                    <div className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                      {currentUser?.name?.substring(0,2).toUpperCase() || 'HR'}
                    </div>
                    <span className="truncate">{currentUser?.name || 'Recruiter'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form Fields */}
            <div className="w-full lg:w-2/3 flex-1 space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary border-b border-neutral-100 pb-2 mb-4">General Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiBriefcase className="text-neutral-400"/> Company Name *</label>
                    <input
                      required
                      value={form.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      placeholder="e.g. NovaTech Solutions"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiGlobe className="text-neutral-400"/> Website URL</label>
                    <input
                      value={form.companyWebsite}
                      onChange={(e) => updateField('companyWebsite', e.target.value)}
                      placeholder="https://www.example.com"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiTarget className="text-neutral-400"/> Sector *</label>
                    <select
                      value={form.sectorId}
                      onChange={(e) => handleSectorChange(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary appearance-none"
                    >
                      <option value="">Select Sector</option>
                      {sectors.map((sector) => (
                        <option key={sector.id || sector.name} value={sector.id}>{sector.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiHash className="text-neutral-400"/> Company Type</label>
                    <select
                      value={form.companyType}
                      onChange={(e) => updateField('companyType', e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary appearance-none"
                    >
                      <option value="">Select Type</option>
                      <option value="Startup">Startup</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="MNC">MNC</option>
                      <option value="Agency">Agency</option>
                      <option value="Government">Government</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiUsers className="text-neutral-400"/> Employee Size</label>
                    <select
                      value={form.companySize}
                      onChange={(e) => updateField('companySize', e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary appearance-none"
                    >
                      <option value="">Select Size</option>
                      <option value="1-10">1-10 Employees</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="201-500">201-500 Employees</option>
                      <option value="500+">500+ Employees</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiCalendar className="text-neutral-400"/> Year Founded</label>
                    <input
                      type="number"
                      value={form.foundedYear}
                      onChange={(e) => updateField('foundedYear', e.target.value)}
                      placeholder="e.g. 2018"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-lg font-bold text-primary border-b border-neutral-100 pb-2">Media & Summary</h3>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiImage className="text-neutral-400"/> Logo Image URL</label>
                  <input
                    value={form.logoUrl}
                    onChange={(e) => updateField('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                  />
                  <p className="text-xs font-medium text-neutral-400 mt-1">Provide a direct link to your company&apos;s logo for best rendering on job posts.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiMapPin className="text-neutral-400"/> Company Location *</label>
                  <input
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="Office area, city, or full address"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiMapPin className="text-neutral-400"/> State *</label>
                    <select
                      value={form.stateId}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary appearance-none"
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.id || state.name} value={state.id}>{state.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiMapPin className="text-neutral-400"/> City / District *</label>
                    {districts.length > 0 ? (
                      <select
                        value={form.districtId}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        disabled={!form.stateId}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary appearance-none disabled:opacity-60"
                      >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                          <option key={district.id || district.name} value={district.id}>{district.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={form.districtName}
                        onChange={(e) => updateField('districtName', e.target.value)}
                        placeholder="Enter city or district"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiFileText className="text-neutral-400"/> About Company</label>
                  <textarea
                    rows={5}
                    value={form.about}
                    onChange={(e) => updateField('about', e.target.value)}
                    placeholder="Describe your company, mission, work culture, and what makes it a great place to work..."
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-50 p-6 md:px-10 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500 font-medium">Keep your company profile updated to attract top talent.</p>
            <button 
              type="submit" 
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiSave /> Save Profile Settings</>}
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <section className="rounded-[2rem] border border-neutral-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-neutral-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-primary">
                <FiBriefcase className="text-brand-600" /> Hiring companies
              </h2>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                Add your own company and client companies here. Job posting will only use companies saved in this list.
              </p>
            </div>
            <button
              type="button"
              onClick={beginAddHiringCompany}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-primary/90"
            >
              <FiPlus /> Add hiring company
            </button>
          </div>

          {managedCompanies.length > 0 ? (
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {managedCompanies.map((company) => {
                const companyKey = company.companyKey || company.id || company.companyName;
                const isPrimaryCompany = String(company.source || '').toLowerCase() === 'hr_profile';
                const isDeletingCompany = String(companyDeletingKey) === String(companyKey);

                return (
                  <article key={companyKey} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt={company.companyName} className="h-full w-full object-contain p-1" />
                        ) : (
                          <FiBriefcase className="text-neutral-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-black text-primary">{company.companyName}</h3>
                        <p className="truncate text-sm font-semibold text-neutral-500">{company.location || 'Location not set'}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {company.sectorName && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-600">{company.sectorName}</span>}
                          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{company.openJobsCount || 0} open jobs</span>
                          {isPrimaryCompany && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Primary profile</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => beginEditHiringCompany(company)}
                          className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 hover:border-brand-200 hover:text-brand-700"
                          title="Edit hiring company"
                        >
                          <FiEdit2 />
                        </button>
                        {!isPrimaryCompany ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteHiringCompany(company)}
                            disabled={isDeletingCompany}
                            className="rounded-xl border border-red-100 bg-white p-2 text-red-600 hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Delete hiring company"
                          >
                            {isDeletingCompany ? (
                              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                            ) : (
                              <FiTrash2 />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm font-semibold text-neutral-500">
              No hiring companies added yet. Add your primary company first, then add client companies if you post jobs for multiple organizations.
            </div>
          )}

          {showCompanyForm && (
            <form onSubmit={handleSaveHiringCompany} className="rounded-2xl border border-brand-100 bg-brand-50/30 p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-primary">
                    {hiringCompanyForm.companyKey ? 'Edit hiring company' : 'Add hiring company'}
                  </h3>
                  <p className="text-sm font-medium text-neutral-500">Complete these details so public company cards and job posts look clean.</p>
                </div>
                <button
                  type="button"
                  onClick={cancelHiringCompanyEdit}
                  className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 hover:text-red-600"
                  title="Cancel"
                >
                  <FiX />
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Company Name *</label>
                  <input
                    required
                    value={hiringCompanyForm.companyName}
                    onChange={(e) => updateHiringCompanyField('companyName', e.target.value)}
                    placeholder="e.g. PDCE Group, Indian Trade Mart"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Logo Image URL</label>
                  <input
                    value={hiringCompanyForm.logoUrl}
                    onChange={(e) => updateHiringCompanyField('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Website URL</label>
                  <input
                    value={hiringCompanyForm.websiteUrl}
                    onChange={(e) => updateHiringCompanyField('websiteUrl', e.target.value)}
                    placeholder="https://company.com"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Sector *</label>
                  <select
                    value={hiringCompanyForm.sectorId}
                    onChange={(e) => handleHiringCompanySectorChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Sector</option>
                    {sectors.map((sector) => (
                      <option key={sector.id || sector.name} value={sector.id}>{sector.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Company Type</label>
                  <select
                    value={hiringCompanyForm.companyType}
                    onChange={(e) => updateHiringCompanyField('companyType', e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Startup">Startup</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="MNC">MNC</option>
                    <option value="Agency">Agency</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">Employee Size</label>
                  <select
                    value={hiringCompanyForm.companySize}
                    onChange={(e) => updateHiringCompanyField('companySize', e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Size</option>
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="201-500">201-500 Employees</option>
                    <option value="500+">500+ Employees</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">State *</label>
                  <select
                    value={hiringCompanyForm.stateId || ''}
                    onChange={(e) => handleHiringCompanyStateChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.id || state.name} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-neutral-700">City / District *</label>
                  {companyDistricts.length > 0 ? (
                    <select
                      value={hiringCompanyForm.districtId || ''}
                      onChange={(e) => handleHiringCompanyDistrictChange(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Select District</option>
                      {companyDistricts.map((district) => (
                        <option key={district.id || district.name} value={district.id}>{district.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={hiringCompanyForm.districtName}
                      onChange={(e) => updateHiringCompanyField('districtName', e.target.value)}
                      placeholder="Enter city or district"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-neutral-700">Company Location *</label>
                  <input
                    value={hiringCompanyForm.location}
                    onChange={(e) => updateHiringCompanyField('location', e.target.value)}
                    placeholder="Office area, city, or full address"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-neutral-700">About Company</label>
                  <textarea
                    rows={4}
                    value={hiringCompanyForm.about}
                    onChange={(e) => updateHiringCompanyField('about', e.target.value)}
                    placeholder="Short summary for public company profile and job pages."
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium text-primary focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelHiringCompanyEdit}
                  className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={companySaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-brand-500 disabled:opacity-60"
                >
                  {companySaving ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <FiSave />}
                  Save hiring company
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
};

export default HrProfilePage;
