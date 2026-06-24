import GooglePagination from '../../../shared/components/GooglePagination';

const Pagination = ({ className = '', ...props }) => (
  <GooglePagination {...props} className={`pt-1 ${className}`.trim()} />
);

export default Pagination;
