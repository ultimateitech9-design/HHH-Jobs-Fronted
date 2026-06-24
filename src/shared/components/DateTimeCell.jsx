import { formatDateTimeParts } from '../utils/dateTime';

const DateTimeCell = ({
  value,
  fallbackValue = null,
  emptyLabel = '-',
  className = '',
  dateClassName = '',
  timeClassName = ''
}) => {
  const parts = formatDateTimeParts(value || fallbackValue);

  if (!parts) {
    return <span className={`text-xs font-semibold text-slate-400 ${className}`.trim()}>{emptyLabel}</span>;
  }

  return (
    <span className={`inline-flex min-w-0 flex-col leading-5 ${className}`.trim()} title={`${parts.dateText}, ${parts.timeText}`}>
      <span className={`whitespace-nowrap text-xs font-bold text-slate-700 ${dateClassName}`.trim()}>{parts.dateText}</span>
      <span className={`whitespace-nowrap text-[11px] font-semibold text-slate-500 ${timeClassName}`.trim()}>{parts.timeText}</span>
    </span>
  );
};

export default DateTimeCell;
