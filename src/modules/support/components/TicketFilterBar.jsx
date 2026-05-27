import { SUPPORT_CATEGORIES } from '../constants/supportCategories';
import { TICKET_PRIORITY } from '../constants/ticketPriority';
import { TICKET_STATUS } from '../constants/ticketStatus';
import { SUPPORT_DEPARTMENT_OPTIONS } from '../utils/ticketHelpers';
import SearchBar from './SearchBar';

const TicketFilterBar = ({ filters, onChange }) => {
  return (
    <div className="student-inline-controls">
      <label>
        Status
        <select value={filters.status} onChange={(event) => onChange('status', event.target.value)}>
          <option value="">All</option>
          {TICKET_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Priority
        <select value={filters.priority} onChange={(event) => onChange('priority', event.target.value)}>
          <option value="">All</option>
          {TICKET_PRIORITY.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Category
        <select value={filters.category} onChange={(event) => onChange('category', event.target.value)}>
          <option value="">All</option>
          {SUPPORT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Queue
        <select value={filters.department} onChange={(event) => onChange('department', event.target.value)}>
          <option value="">All</option>
          {SUPPORT_DEPARTMENT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="full-width-control">
        Search
        <SearchBar value={filters.search} placeholder="Ticket ID, title, customer, owner" onChange={(value) => onChange('search', value)} />
      </label>
    </div>
  );
};

export default TicketFilterBar;
