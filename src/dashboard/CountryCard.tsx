import type { CountryStatus } from '../calculations/types';
import { formatDate } from '../calculations/date-utils';
import { ProgressBar } from './ProgressBar';

interface Props {
  status: CountryStatus;
}

export function CountryCard({ status }: Props): JSX.Element {
  const {
    name,
    flag,
    daysPresent,
    threshold,
    percentage,
    daysRemaining,
    windowStart,
    windowEnd,
    isDefaultRule,
  } = status;

  const dateRange = `${formatDate(windowStart)} – ${formatDate(windowEnd)}`;

  return (
    <div className="rounded-lg bg-gray-900 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`font-semibold text-lg ${isDefaultRule ? 'text-gray-500' : 'text-white'}`}>
          {flag} {name}
        </span>
        <span className="text-gray-300 text-sm">
          {daysPresent} / {threshold} days
        </span>
      </div>
      <ProgressBar percentage={percentage} />
      <div className="flex items-center justify-between text-sm">
        {daysRemaining >= 0 ? (
          <span className="text-gray-300">{daysRemaining} days remaining</span>
        ) : (
          <span className="text-red-400">EXCEEDED by {Math.abs(daysRemaining)} days</span>
        )}
        <span className="text-gray-500">{dateRange}</span>
      </div>
    </div>
  );
}
