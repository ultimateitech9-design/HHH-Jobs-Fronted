import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { INDIAN_STATES } from '../constants/indianStates';

const DEFAULT_STATE = 'Andhra Pradesh';

const normalizeSelectedStates = (value = []) => {
  const selected = Array.isArray(value) ? value : [];
  return selected.filter((state) => INDIAN_STATES.includes(state));
};

const StateScopePicker = ({
  value = [DEFAULT_STATE],
  onChange,
  helper = 'Admin can assign one or more states to this account.'
}) => {
  const selectedStates = normalizeSelectedStates(value);
  const availableStates = useMemo(
    () => INDIAN_STATES.filter((state) => !selectedStates.includes(state)),
    [selectedStates]
  );
  const [draftState, setDraftState] = useState(availableStates[0] || '');

  useEffect(() => {
    if (!availableStates.includes(draftState)) {
      setDraftState(availableStates[0] || '');
    }
  }, [availableStates, draftState]);

  const addState = () => {
    if (!draftState || selectedStates.includes(draftState)) return;
    onChange?.([...selectedStates, draftState]);
  };

  const removeState = (stateName) => {
    const nextStates = selectedStates.filter((state) => state !== stateName);
    onChange?.(nextStates.length ? nextStates : [DEFAULT_STATE]);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={draftState}
          onChange={(event) => setDraftState(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          disabled={!availableStates.length}
        >
          {availableStates.length ? availableStates.map((state) => (
            <option key={state} value={state}>{state}</option>
          )) : (
            <option value="">All states selected</option>
          )}
        </select>
        <button
          type="button"
          onClick={addState}
          disabled={!draftState}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlus size={15} /> Add
        </button>
      </div>

      <div className="flex min-h-[38px] flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
        {selectedStates.map((state) => (
          <span
            key={state}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 shadow-sm"
          >
            <span className="truncate">{state}</span>
            <button
              type="button"
              onClick={() => removeState(state)}
              className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Remove ${state}`}
              title={`Remove ${state}`}
            >
              <FiX size={12} />
            </button>
          </span>
        ))}
      </div>

      {helper ? <p className="text-xs font-semibold text-slate-500">{helper}</p> : null}
    </div>
  );
};

export default StateScopePicker;
