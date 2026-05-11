import SearchBar from './SearchBar';

const FilterBar = ({ filters, onChange, fields = [], actions }) => {
  return (
    <div className="filter-bar">
      <div className="filter-bar__search">
        <SearchBar value={filters.search || ''} placeholder="Search by name, email, company, ID, or title" onChange={(value) => onChange('search', value)} />
      </div>
      {fields.map((field) => (
        <label key={field.key} className="filter-bar__field">
          {field.label}
          <select value={filters[field.key] || ''} onChange={(event) => onChange(field.key, event.target.value)}>
            <option value="">All</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {actions ? <div className="filter-bar__actions">{actions}</div> : null}
    </div>
  );
};

export default FilterBar;
