import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatusPill from '../../../shared/components/StatusPill';
import {
  createAdminCategory,
  createAdminDistrict,
  createAdminIndustry,
  createAdminLocation,
  createAdminPincode,
  createAdminSkill,
  createAdminState,
  createAdminTehsil,
  createAdminVillage,
  deleteAdminCategory,
  deleteAdminDistrict,
  deleteAdminIndustry,
  deleteAdminLocation,
  deleteAdminPincode,
  deleteAdminSkill,
  deleteAdminState,
  deleteAdminTehsil,
  deleteAdminVillage,
  getAdminCategories,
  getAdminDistricts,
  getAdminIndustries,
  getAdminLocations,
  getAdminPincodes,
  getAdminSkills,
  getAdminStates,
  getAdminTehsils,
  getAdminVillages,
  updateAdminCategory,
  updateAdminDistrict,
  updateAdminIndustry,
  updateAdminLocation,
  updateAdminSkill,
  updateAdminState,
  updateAdminTehsil,
  updateAdminVillage
} from '../services/adminApi';

const initialForm = {
  categoryName: '',
  locationName: '',
  stateName: '',
  stateCode: '',
  districtName: '',
  districtStateId: '',
  tehsilName: '',
  tehsilDistrictId: '',
  villageName: '',
  villageTehsilId: '',
  villagePincode: '',
  pincode: '',
  pincodeStateId: '',
  pincodeDistrictId: '',
  pincodeVillageId: '',
  industryName: '',
  skillName: '',
  skillIndustryId: ''
};

const isActive = (value) => value !== false;
const actionButtonClass = 'inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-black text-neutral-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700';
const dangerButtonClass = 'inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-100';

const AdminMasterDataPage = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [data, setData] = useState({
    categories: [],
    locations: [],
    states: [],
    districts: [],
    tehsils: [],
    villages: [],
    pincodes: [],
    industries: [],
    skills: []
  });

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const stateNameById = useMemo(() => Object.fromEntries(data.states.map((item) => [item.id, item.name])), [data.states]);
  const districtNameById = useMemo(() => Object.fromEntries(data.districts.map((item) => [item.id, item.name])), [data.districts]);
  const tehsilNameById = useMemo(() => Object.fromEntries(data.tehsils.map((item) => [item.id, item.name])), [data.tehsils]);
  const villageNameById = useMemo(() => Object.fromEntries(data.villages.map((item) => [item.id, item.name])), [data.villages]);
  const industryNameById = useMemo(() => Object.fromEntries(data.industries.map((item) => [item.id, item.name])), [data.industries]);

  const loadAll = async () => {
    setLoading(true);
    setError('');

    const results = await Promise.all([
      getAdminCategories(),
      getAdminLocations(),
      getAdminStates(),
      getAdminDistricts(),
      getAdminTehsils(),
      getAdminVillages(),
      getAdminPincodes(),
      getAdminIndustries(),
      getAdminSkills()
    ]);

    setData({
      categories: results[0].data || [],
      locations: results[1].data || [],
      states: results[2].data || [],
      districts: results[3].data || [],
      tehsils: results[4].data || [],
      villages: results[5].data || [],
      pincodes: results[6].data || [],
      industries: results[7].data || [],
      skills: results[8].data || []
    });

    setError(results.find((item) => item.error)?.error || '');
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const runMutation = async (action, successText) => {
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(successText);
      await loadAll();
    } catch (mutationError) {
      setError(mutationError.message || 'Operation failed.');
    }
  };

  return (
    <div className="module-page module-page--admin">
      <SectionHeader
        eyebrow="Master Data"
        title="Lookup and Geography Management"
        subtitle="Maintain categories, location hierarchy, industries, and skills."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {loading ? <p className="module-note">Loading master data...</p> : null}

      <section className="panel-card">
        <SectionHeader eyebrow="Categories" title="Categories" />
        <div className="student-inline-controls">
          <input placeholder="Category name" value={form.categoryName} onChange={(event) => setField('categoryName', event.target.value)} />
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.categoryName.trim()) throw new Error('Category name is required.');
            await createAdminCategory({ name: form.categoryName.trim(), isActive: true });
            setField('categoryName', '');
          }, 'Category created.')}>Add</button>
        </div>
        <ul className="student-list">
          {data.categories.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong></div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminCategory(item.id, { isActive: !isActive(item.is_active) }), 'Category status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminCategory(item.id), 'Category deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-card">
        <SectionHeader eyebrow="Locations" title="Locations" />
        <div className="student-inline-controls">
          <input placeholder="Location name" value={form.locationName} onChange={(event) => setField('locationName', event.target.value)} />
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.locationName.trim()) throw new Error('Location name is required.');
            await createAdminLocation({ name: form.locationName.trim(), isActive: true });
            setField('locationName', '');
          }, 'Location created.')}>Add</button>
        </div>
        <ul className="student-list">
          {data.locations.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong></div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminLocation(item.id, { isActive: !isActive(item.is_active) }), 'Location status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminLocation(item.id), 'Location deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-card">
        <SectionHeader eyebrow="States" title="States" />
        <div className="student-inline-controls">
          <input placeholder="State name" value={form.stateName} onChange={(event) => setField('stateName', event.target.value)} />
          <input placeholder="Code" value={form.stateCode} onChange={(event) => setField('stateCode', event.target.value)} />
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.stateName.trim()) throw new Error('State name is required.');
            await createAdminState({ name: form.stateName.trim(), code: form.stateCode.trim() || null, isActive: true });
            setField('stateName', '');
            setField('stateCode', '');
          }, 'State created.')}>Add</button>
        </div>
        <ul className="student-list">
          {data.states.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong> ({item.code || '-'})</div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminState(item.id, { isActive: !isActive(item.is_active) }), 'State status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminState(item.id), 'State deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-card">
        <SectionHeader eyebrow="Districts / Tehsils / Villages" title="Geography Hierarchy" />
        <div className="student-inline-controls">
          <input placeholder="District name" value={form.districtName} onChange={(event) => setField('districtName', event.target.value)} />
          <select value={form.districtStateId} onChange={(event) => setField('districtStateId', event.target.value)}>
            <option value="">State</option>
            {data.states.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.districtName.trim() || !form.districtStateId) throw new Error('District name and state are required.');
            await createAdminDistrict({ name: form.districtName.trim(), stateId: form.districtStateId, isActive: true });
            setField('districtName', '');
          }, 'District created.')}>Add District</button>
        </div>
        <div className="student-inline-controls">
          <input placeholder="Tehsil name" value={form.tehsilName} onChange={(event) => setField('tehsilName', event.target.value)} />
          <select value={form.tehsilDistrictId} onChange={(event) => setField('tehsilDistrictId', event.target.value)}>
            <option value="">District</option>
            {data.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.tehsilName.trim() || !form.tehsilDistrictId) throw new Error('Tehsil name and district are required.');
            await createAdminTehsil({ name: form.tehsilName.trim(), districtId: form.tehsilDistrictId, isActive: true });
            setField('tehsilName', '');
          }, 'Tehsil created.')}>Add Tehsil</button>
        </div>
        <div className="student-inline-controls">
          <input placeholder="Village name" value={form.villageName} onChange={(event) => setField('villageName', event.target.value)} />
          <select value={form.villageTehsilId} onChange={(event) => setField('villageTehsilId', event.target.value)}>
            <option value="">Tehsil</option>
            {data.tehsils.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input placeholder="Pincode (optional)" value={form.villagePincode} onChange={(event) => setField('villagePincode', event.target.value)} />
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.villageName.trim() || !form.villageTehsilId) throw new Error('Village name and tehsil are required.');
            await createAdminVillage({ name: form.villageName.trim(), tehsilId: form.villageTehsilId, pincode: form.villagePincode.trim() || null, isActive: true });
            setField('villageName', '');
            setField('villagePincode', '');
          }, 'Village created.')}>Add Village</button>
        </div>
        <h4 style={{ marginTop: 12 }}>Districts</h4>
        <ul className="student-list">
          {data.districts.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong> | {stateNameById[item.state_id] || '-'}</div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminDistrict(item.id, { isActive: !isActive(item.is_active) }), 'District status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminDistrict(item.id), 'District deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <h4 style={{ marginTop: 12 }}>Tehsils</h4>
        <ul className="student-list">
          {data.tehsils.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong> | {districtNameById[item.district_id] || '-'}</div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminTehsil(item.id, { isActive: !isActive(item.is_active) }), 'Tehsil status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminTehsil(item.id), 'Tehsil deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <h4 style={{ marginTop: 12 }}>Villages</h4>
        <ul className="student-list">
          {data.villages.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong> | {tehsilNameById[item.tehsil_id] || '-'} | {item.pincode || '-'}</div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminVillage(item.id, { isActive: !isActive(item.is_active) }), 'Village status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminVillage(item.id), 'Village deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-card">
        <SectionHeader eyebrow="Pincodes" title="Pincode Mapping" />
        <div className="student-inline-controls">
          <input placeholder="Pincode" value={form.pincode} onChange={(event) => setField('pincode', event.target.value)} />
          <select value={form.pincodeStateId} onChange={(event) => setField('pincodeStateId', event.target.value)}>
            <option value="">State</option>
            {data.states.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={form.pincodeDistrictId} onChange={(event) => setField('pincodeDistrictId', event.target.value)}>
            <option value="">District</option>
            {data.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={form.pincodeVillageId} onChange={(event) => setField('pincodeVillageId', event.target.value)}>
            <option value="">Village</option>
            {data.villages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.pincode.trim()) throw new Error('Pincode is required.');
            await createAdminPincode({ pincode: form.pincode.trim(), stateId: form.pincodeStateId || null, districtId: form.pincodeDistrictId || null, villageId: form.pincodeVillageId || null, isActive: true });
            setField('pincode', '');
          }, 'Pincode created.')}>Add Pincode</button>
        </div>
        <ul className="student-list">
          {data.pincodes.map((item) => (
            <li key={item.id}>
              <div><strong>{item.pincode}</strong> | {stateNameById[item.state_id] || '-'} | {districtNameById[item.district_id] || '-'} | {villageNameById[item.village_id] || '-'}</div>
              <div className="student-list-actions">
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminPincode(item.id), 'Pincode deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-card">
        <SectionHeader eyebrow="Industries and Skills" title="Industry Skill Taxonomy" />
        <div className="student-inline-controls">
          <input placeholder="Industry name" value={form.industryName} onChange={(event) => setField('industryName', event.target.value)} />
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.industryName.trim()) throw new Error('Industry name is required.');
            await createAdminIndustry({ name: form.industryName.trim(), isActive: true });
            setField('industryName', '');
          }, 'Industry created.')}>Add Industry</button>
        </div>
        <div className="student-inline-controls">
          <input placeholder="Skill name" value={form.skillName} onChange={(event) => setField('skillName', event.target.value)} />
          <select value={form.skillIndustryId} onChange={(event) => setField('skillIndustryId', event.target.value)}>
            <option value="">Industry</option>
            {data.industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="button" className="btn-primary" onClick={() => runMutation(async () => {
            if (!form.skillName.trim()) throw new Error('Skill name is required.');
            await createAdminSkill({ name: form.skillName.trim(), industryId: form.skillIndustryId || null, isActive: true });
            setField('skillName', '');
          }, 'Skill created.')}>Add Skill</button>
        </div>
        <h4 style={{ marginTop: 12 }}>Industries</h4>
        <ul className="student-list">
          {data.industries.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong></div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminIndustry(item.id, { isActive: !isActive(item.is_active) }), 'Industry status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminIndustry(item.id), 'Industry deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <h4 style={{ marginTop: 12 }}>Skills</h4>
        <ul className="student-list">
          {data.skills.map((item) => (
            <li key={item.id}>
              <div><strong>{item.name}</strong> | {industryNameById[item.industry_id] || '-'}</div>
              <div className="student-list-actions">
                <StatusPill value={isActive(item.is_active) ? 'active' : 'inactive'} />
                <button type="button" className={actionButtonClass} onClick={() => runMutation(async () => updateAdminSkill(item.id, { isActive: !isActive(item.is_active) }), 'Skill status updated.')}>{isActive(item.is_active) ? 'Disable' : 'Enable'}</button>
                <button type="button" className={dangerButtonClass} onClick={() => runMutation(async () => deleteAdminSkill(item.id), 'Skill deleted.')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminMasterDataPage;
