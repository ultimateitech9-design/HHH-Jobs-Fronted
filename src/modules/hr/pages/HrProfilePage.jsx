import { useEffect, useState } from 'react';
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
  FiHash
} from 'react-icons/fi';
import { getHrProfile, updateHrProfile } from '../services/hrApi';
import { getCurrentUser, getToken, setAuthSession } from '../../../utils/auth';

const HrProfilePage = () => {
  const currentUser = getCurrentUser();
  const [form, setForm] = useState({
    companyName: '',
    companyWebsite: '',
    companySize: '',
    industryType: '',
    foundedYear: '',
    companyType: '',
    location: '',
    about: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const response = await getHrProfile();
      if (!mounted) return;

      setForm(response.data);
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

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateHrProfile(form);
      setForm(updated);
      const token = getToken();
      if (token && currentUser) {
        setAuthSession(token, {
          ...currentUser,
          companyName: updated.companyName || currentUser.companyName,
          hrEmployerId: currentUser?.hrEmployerId
        });
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
          <h1 className="text-3xl font-extrabold font-heading text-primary tracking-tight mb-2">Company Profile</h1>
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
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-neutral-50 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center p-2 mb-6 shadow-sm overflow-hidden relative group">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <FiImage size={32} className="text-neutral-300 mb-2" />
                    <span className="text-xs font-bold text-neutral-400">No Logo</span>
                  </>
                )}
                {/* Overlay for generic aesthetics - in a real app this would be an upload button */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">Image URL Field</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-extrabold text-primary mb-1 w-full truncate">
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
                <h3 className="text-lg font-extrabold text-primary border-b border-neutral-100 pb-2 mb-4">General Details</h3>
                
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
                    <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiTarget className="text-neutral-400"/> Industry Type</label>
                    <input
                      value={form.industryType}
                      onChange={(e) => updateField('industryType', e.target.value)}
                      placeholder="e.g. Software Development"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                    />
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
                <h3 className="text-lg font-extrabold text-primary border-b border-neutral-100 pb-2">Media & Summary</h3>
                
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
                  <label className="text-sm font-bold text-neutral-700 flex items-center gap-1.5"><FiMapPin className="text-neutral-400"/> Headquarter Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium transition-colors text-primary"
                  />
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
    </div>
  );
};

export default HrProfilePage;
