import { useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { PriorityBadge } from '../components/PriorityBadge';
import { api, Activity, Project, Stats, Task, User, WeeklyPoint } from '../lib/api';
import { dueLabel } from '../lib/data';
import { useAuth } from '../lib/auth';

type Props = {
  onOpenTask: (id: string) => void;
  onNavigate: (view: 'dashboard' | 'projects' | 'tasks' | 'team', projectId?: string) => void;
};

export function Dashboard({ onOpenTask, onNavigate }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [weekly, setWeekly] = useState<WeeklyPoint[]>([]);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.stats(),
      api.listTasks(),
      api.listProjects(),
      api.listUsers(),
      api.activity(),
      api.weekly(),
    ])
      .then(([s, t, p, u, a, w]) => {
        setStats(s);
        setTasks(t);
        setProjects(p);
        setUsers(u);
        setActivity(a);
        setWeekly(w);
      })
      .catch((e) => setError(e?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error || !stats) return <ErrorState onRetry={load} />;

  const role = user!.role;
  const greeting = user!.name.split(' ')[0];
  const myTasks = role === 'member'
    ? tasks.filter((t) => t.assignee === user!.id && t.status !== 'done').slice(0, 4)
    : tasks.filter((t) => t.status !== 'done').slice(0, 4);

  const inProgressDelta = `${stats.progress} active`;

  return (
    <div className="page">
      {role === 'member' && (
        <div className="role-banner">
          <span className="role-banner__icon"><Icons.Info size={14} /></span>
          You're viewing as a <strong style={{ margin: '0 4px' }}>Member</strong> — you can update tasks assigned to you. Some admin actions are read-only.
        </div>
      )}
      <div className="page__header">
        <div>
          <h1 className="page__title">Good morning, {greeting} 👋</h1>
          <div className="page__sub">Here's what's happening across your workspace today.</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--secondary"><Icons.Calendar size={16} /> This week</button>
          {role === 'admin' && (
            <button className="btn btn--primary" onClick={() => onNavigate('tasks')}>
              <Icons.Plus size={16} /> New task
            </button>
          )}
        </div>
      </div>

      <div className="stats">
        <StatCard tone="blue"   icon={<Icons.Tasks size={18} />}        label="Total tasks"   value={stats.total}    delta="all time"   deltaTone="neutral" hint="across workspace" />
        <StatCard tone="green"  icon={<Icons.CheckCircle size={18} />}  label="Completed"     value={stats.done}     delta={`${pct(stats.done, stats.total)}%`} deltaTone="up" hint="of total" />
        <StatCard tone="purple" icon={<Icons.Clock size={18} />}        label="In progress"   value={stats.progress} delta={inProgressDelta} deltaTone="neutral" hint="open right now" />
        <StatCard tone="red"    icon={<Icons.AlertTriangle size={18} />} label="Overdue"      value={stats.overdue}  delta={stats.overdue > 0 ? 'needs review' : 'all clear'} deltaTone={stats.overdue > 0 ? 'down' : 'up'} hint="past due" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div className="card__title">Tasks completed</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>Last 7 days</div>
            </div>
            <div className="chart-tabs">
              <button className="chart-tab chart-tab--active">7d</button>
              <button className="chart-tab">30d</button>
              <button className="chart-tab">90d</button>
            </div>
          </div>
          <BarChart data={weekly} />
        </div>
        <div className="card chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card__title">Status breakdown</div>
            <button className="icon-btn" style={{ width: 28, height: 28 }}><Icons.More size={14} /></button>
          </div>
          <DonutChart stats={stats} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">{role === 'member' ? 'Your tasks' : 'Tasks needing attention'}</div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => onNavigate('tasks')}>
              View all <Icons.ArrowRight size={14} />
            </button>
          </div>
          <div style={{ padding: '4px 8px' }}>
            {myTasks.length === 0 && (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}>
                Nothing on your plate. Nice. 🎉
              </div>
            )}
            {myTasks.map((t) => {
              const u = users.find((x) => x.id === t.assignee);
              const proj = projects.find((p) => p.id === t.project);
              const due = dueLabel(t.due);
              return (
                <button
                  key={t.id}
                  onClick={() => onOpenTask(t.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', borderRadius: 10, textAlign: 'left', transition: 'background .15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {u && <div className={`avatar avatar--md avatar--${u.color}`}>{u.initials}</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                      {proj?.name} · {u?.name}
                    </div>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <span className={`badge badge--${due.tone}`}><span className="badge__dot" />{due.text}</span>
                  <Icons.ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Recent activity</div>
            <span className="badge badge--blue"><span className="badge__dot" />Live</span>
          </div>
          <div style={{ padding: '0 20px 12px' }}>
            <div className="activity">
              {activity.length === 0 && (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}>
                  No recent activity yet.
                </div>
              )}
              {activity.map((a) => {
                const u = users.find((x) => x.id === a.user);
                const map: Record<string, { i: React.ReactNode; bg: string; c: string }> = {
                  done:    { i: <Icons.Check size={14} />,    bg: 'var(--success-50)', c: 'var(--success-700)' },
                  comment: { i: <Icons.Message size={14} />,  bg: 'var(--brand-50)',   c: 'var(--brand-700)' },
                  create:  { i: <Icons.Plus size={14} />,     bg: 'var(--accent-50)',  c: 'var(--accent-700)' },
                  move:    { i: <Icons.ArrowRight size={14} />, bg: 'var(--info-50)',  c: 'var(--info-500)' },
                  assign:  { i: <Icons.User size={14} />,     bg: 'var(--warn-50)',    c: 'var(--warn-700)' },
                  update:  { i: <Icons.Edit size={14} />,     bg: 'var(--ink-100)',    c: 'var(--ink-700)' },
                };
                const m = map[a.type] || map.update;
                return (
                  <div key={a.id} className="activity__item">
                    <div className="activity__icon" style={{ background: m.bg, color: m.c }}>{m.i}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="activity__text">
                        <strong>{u?.name || 'Someone'}</strong> {a.action} <strong>{a.target}</strong>
                      </div>
                      <div className="activity__time">{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

type Tone = 'blue' | 'green' | 'purple' | 'red';
type DeltaTone = 'up' | 'down' | 'neutral';

function StatCard({ tone, icon, label, value, delta, deltaTone, hint }: {
  tone: Tone; icon: React.ReactNode; label: string; value: number;
  delta: string; deltaTone: DeltaTone; hint: string;
}) {
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__top">
        <div className="stat__icon">{icon}</div>
        <div className={`stat__delta stat__delta--${deltaTone}`}>
          {deltaTone === 'up' && <Icons.TrendUp size={11} />}
          {delta}
        </div>
      </div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 6 }}>{hint}</div>
      <div className="stat__bar" />
    </div>
  );
}

function BarChart({ data }: { data: WeeklyPoint[] }) {
  const safe = data.length === 7 ? data : Array.from({ length: 7 }, (_, i) => ({ d: ['M','T','W','T','F','S','S'][i], done: 0, pending: 0 }));
  const max = Math.max(20, ...safe.map((d) => d.done + d.pending));
  const W = 520, H = 200, bw = 28;
  const gap = (W - safe.length * bw) / (safe.length + 1);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="bar-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b6cff" />
            <stop offset="100%" stopColor="#7a8fff" />
          </linearGradient>
          <linearGradient id="bar-purple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bf9cff" />
            <stop offset="100%" stopColor="#d9c2ff" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const v = Math.round(p * max);
          return (
            <g key={i}>
              <line x1="32" x2={W} y1={H - p * H} y2={H - p * H} stroke="#eef0f7" strokeDasharray="3 3" />
              <text x="22" y={H - p * H + 4} fontSize="10" fill="#a4abc6" textAnchor="end">{v}</text>
            </g>
          );
        })}
        {safe.map((d, i) => {
          const x = 38 + gap * (i + 1) + bw * i;
          const totalH = ((d.done + d.pending) / max) * H;
          const doneH = (d.done / max) * H;
          return (
            <g key={i}>
              <rect x={x} y={H - totalH} width={bw} height={totalH - doneH} rx="4" fill="url(#bar-purple)" />
              <rect x={x} y={H - doneH} width={bw} height={doneH} rx="4" fill="url(#bar-blue)" />
              <text x={x + bw / 2} y={H + 18} fontSize="10.5" fill="#7c83a6" textAnchor="middle" fontWeight="500">{d.d}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 18, marginTop: 8, fontSize: 12, color: 'var(--ink-600)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: 'linear-gradient(180deg,#5b6cff,#7a8fff)', borderRadius: 3 }} /> Completed
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: 'linear-gradient(180deg,#bf9cff,#d9c2ff)', borderRadius: 3 }} /> In progress
        </span>
      </div>
    </div>
  );
}

function DonutChart({ stats }: { stats: Stats }) {
  const segs = [
    { v: stats.done,     c: '#10b981', label: 'Done' },
    { v: stats.progress, c: '#5b6cff', label: 'In progress' },
    { v: stats.todo,     c: '#bf9cff', label: 'To do' },
    { v: stats.overdue,  c: '#ef4444', label: 'Overdue' },
  ].filter((s) => s.v > 0);
  const sum = segs.reduce((a, b) => a + b.v, 0) || 1;
  const R = 70, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', width: 170, height: 170 }}>
        <svg viewBox="0 0 180 180" style={{ width: 170, height: 170 }}>
          <circle cx="90" cy="90" r={R} stroke="#eef0f7" strokeWidth="18" fill="none" />
          {segs.map((s, i) => {
            const len = (s.v / sum) * C;
            const off = -acc;
            acc += len;
            return (
              <circle
                key={i}
                cx="90" cy="90" r={R}
                stroke={s.c} strokeWidth="18" fill="none"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={off}
                strokeLinecap="butt"
                transform="rotate(-90 90 90)"
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-.02em' }}>
              {pct(stats.done, stats.total)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>completion</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink-700)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: s.c }} /> {s.label}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="skel" style={{ width: 280, height: 32, marginBottom: 8 }} />
          <div className="skel" style={{ width: 360, height: 14 }} />
        </div>
      </div>
      <div className="stats">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div className="skel" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14 }} />
            <div className="skel" style={{ width: 90, height: 12, marginBottom: 8 }} />
            <div className="skel" style={{ width: 60, height: 28 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20, height: 280 }}><div className="skel" style={{ width: '100%', height: '100%' }} /></div>
        <div className="card" style={{ padding: 20, height: 280 }}><div className="skel" style={{ width: '100%', height: '100%' }} /></div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - var(--topbar-h))' }}>
      <div className="empty" style={{ maxWidth: 400 }}>
        <div className="empty__art" style={{ background: 'linear-gradient(135deg, var(--danger-50), #fee2e2)', color: 'var(--danger-700)' }}>
          <Icons.AlertTriangle size={32} />
        </div>
        <div className="empty__title">Something went wrong</div>
        <div className="empty__desc">We couldn't load your dashboard. Check your connection and try again.</div>
        <button className="btn btn--primary" onClick={onRetry}>Retry</button>
      </div>
    </div>
  );
}
