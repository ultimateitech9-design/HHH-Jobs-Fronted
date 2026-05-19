import DataTable from '../../../shared/components/DataTable';
import { formatDateTime } from '../utils/formatDate';

const FeedbackTable = ({ rows = [] }) => {
  const columns = [
    { key: 'id', label: 'Feedback ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'channel', label: 'Channel' },
    { key: 'rating', label: 'Rating' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'message', label: 'Message' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => formatDateTime(value)
    }
  ];

  return <DataTable columns={columns} rows={rows} searchable pagination itemsPerPage={10} searchPlaceholder="Search feedback, customer, channel, rating, sentiment, or message" />;
};

export default FeedbackTable;
