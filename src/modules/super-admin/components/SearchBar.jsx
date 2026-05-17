import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ value, onChange, placeholder = 'Search records...' }) => {
  return (
    <label className="full-width-control">
      <span className="sr-only">Search</span>
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="pl-9"
        />
      </div>
    </label>
  );
};

export default SearchBar;
