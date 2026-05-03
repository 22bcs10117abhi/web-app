// Static UI data + helpers. Project gradients are visual-only and live on the client.

export const projectGradients = [
  { from: '#5b6cff', to: '#8b54f7' },
  { from: '#10b981', to: '#34d399' },
  { from: '#f59e0b', to: '#fbbf24' },
  { from: '#ef4444', to: '#fb7185' },
  { from: '#06b6d4', to: '#3b82f6' },
  { from: '#ec4899', to: '#a575ff' },
];

export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const daysUntil = (iso: string | null | undefined) => {
  if (!iso) return Infinity;
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
};

export const dueLabel = (iso: string | null | undefined): { text: string; tone: 'red' | 'amber' | 'gray' } => {
  if (!iso) return { text: 'No due date', tone: 'gray' };
  const n = daysUntil(iso);
  if (n < 0) return { text: `${Math.abs(n)}d overdue`, tone: 'red' };
  if (n === 0) return { text: 'Due today', tone: 'amber' };
  if (n === 1) return { text: 'Due tomorrow', tone: 'amber' };
  if (n <= 4) return { text: `Due in ${n}d`, tone: 'amber' };
  return { text: `Due ${fmtDate(iso)}`, tone: 'gray' };
};
