import { Priority } from '../lib/api';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = ({ low: 'Low', med: 'Medium', high: 'High' } as const)[priority];
  return (
    <span className={`priority priority--${priority}`}>
      <span className="priority__bars"><span /><span /><span /></span>
      {label}
    </span>
  );
}
