import GooglePagination from './GooglePagination';

const Pagination = ({ className = '', ...props }) => (
  <GooglePagination {...props} className={`pt-2 ${className}`.trim()} />
);

export default Pagination;
