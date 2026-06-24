import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiPlus, FiSearch } from 'react-icons/fi';

const normalizeText = (value = '') => String(value || '').trim();
const normalizeKey = (value = '') => normalizeText(value).toLowerCase();

const getSectorId = (sector = {}) => String(sector.id || sector.value || sector.name || '');
const getSectorName = (sector = {}) => normalizeText(sector.name || sector.label || sector.value);
const makeLocalSectorId = (name = '') => `custom:${normalizeKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now()}`;

const mergeSectors = (sectors = []) => {
  const seen = new Set();
  return (sectors || [])
    .map((sector) => ({
      ...sector,
      id: getSectorId(sector),
      name: getSectorName(sector)
    }))
    .filter((sector) => {
      const key = normalizeKey(sector.name);
      if (!key || key === 'other' || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
};

const SearchableSectorSelect = ({
  sectors = [],
  value = '',
  valueName = '',
  placeholder = 'Select Sector',
  className = '',
  inputClassName = '',
  onChange,
  onCreateSector
}) => {
  const rootRef = useRef(null);
  const [localSectors, setLocalSectors] = useState([]);
  const normalizedSectors = useMemo(() => mergeSectors([...sectors, ...localSectors]), [sectors, localSectors]);
  const selectedSector = normalizedSectors.find((sector) => getSectorId(sector) === String(value || ''));
  const selectedName = selectedSector?.name || normalizeText(valueName);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedName);
  const [customName, setCustomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) setQuery(selectedName);
  }, [open, selectedName]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setError('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filteredSectors = useMemo(() => {
    const search = normalizeKey(query);
    if (!search) return normalizedSectors.slice(0, 80);
    return normalizedSectors
      .filter((sector) => normalizeKey(sector.name).includes(search))
      .slice(0, 80);
  }, [normalizedSectors, query]);

  const selectSector = (sector) => {
    const id = getSectorId(sector);
    const name = getSectorName(sector);
    onChange?.({ sectorId: id, sectorName: name, sector });
    setQuery(name);
    setOpen(false);
    setCustomName('');
    setError('');
  };

  const rememberLocalSector = (sector) => {
    if (!sector?.name) return;
    setLocalSectors((current) => {
      const key = normalizeKey(sector.name);
      if (!key || current.some((item) => normalizeKey(item.name) === key)) return current;
      return [...current, sector];
    });
  };

  const handleCreate = async () => {
    const name = normalizeText(customName || query);
    if (!name) {
      setError('Sector name is required.');
      return;
    }

    const existing = normalizedSectors.find((sector) => normalizeKey(sector.name) === normalizeKey(name));
    if (existing) {
      selectSector(existing);
      return;
    }

    setCreating(true);
    setError('');
    const optimisticSector = { id: makeLocalSectorId(name), name };
    rememberLocalSector(optimisticSector);
    selectSector(optimisticSector);

    try {
      const createdSector = await onCreateSector?.(name);
      if (createdSector?.name) {
        rememberLocalSector(createdSector);
        selectSector(createdSector);
      }
    } catch (createError) {
      setError(createError.message || 'Unable to add sector.');
      setOpen(true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={open ? query : selectedName}
          onFocus={() => {
            setOpen(true);
            setQuery(selectedName);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-xl border border-neutral-200 bg-neutral-50 px-11 py-3 font-medium text-primary transition-all focus:ring-2 focus:ring-brand-500 ${inputClassName}`.trim()}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:bg-slate-100"
          onClick={() => setOpen((current) => !current)}
          aria-label="Toggle sector options"
        >
          <FiChevronDown size={18} />
        </button>
      </div>

      {open ? (
        <div className="absolute z-40 mt-2 max-h-80 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
              onClick={() => selectSector({ id: '', name: '' })}
            >
              {placeholder}
              {!value ? <FiCheck size={15} className="text-emerald-600" /> : null}
            </button>
            {filteredSectors.map((sector) => {
              const id = getSectorId(sector);
              const selected = id === String(value || '');
              return (
                <button
                  type="button"
                  key={id || sector.name}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold ${selected ? 'bg-amber-50 text-amber-800' : 'text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => selectSector(sector)}
                >
                  <span className="truncate">{sector.name}</span>
                  {selected ? <FiCheck size={15} className="text-emerald-600" /> : null}
                </button>
              );
            })}
            {!filteredSectors.length ? (
              <p className="px-4 py-3 text-sm font-medium text-slate-500">No matching sector</p>
            ) : null}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-3">
            <button
              type="button"
              className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700"
              onClick={() => {
                setCustomName(normalizeText(query));
                setError('');
              }}
            >
              <FiPlus size={14} /> Other
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="Write sector name"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Adding...' : 'Add'}
              </button>
            </div>
            {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SearchableSectorSelect;
