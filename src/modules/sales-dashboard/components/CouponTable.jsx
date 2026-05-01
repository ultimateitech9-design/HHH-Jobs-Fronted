import DataTable from '../../../shared/components/DataTable';
import StatusPill from '../../../shared/components/StatusPill';
import { formatDateTime } from '../utils/dateFormat';

const CouponTable = ({ rows = [] }) => {
  const columns = [
    { key: 'code', label: 'Coupon Code' },
    { key: 'discountType', label: 'Type' },
    { key: 'discountValue', label: 'Discount' },
    { key: 'audienceRoles', label: 'Audience', render: (value) => Array.isArray(value) && value.length > 0 ? value.join(', ') : 'All' },
    { key: 'planSlugs', label: 'Plans', render: (value) => Array.isArray(value) && value.length > 0 ? value.join(', ') : 'All' },
    { key: 'usageCount', label: 'Usage' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusPill value={value || 'active'} />
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} />;
};

export default CouponTable;
