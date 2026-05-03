import { useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { PriorityBadge } from '../components/PriorityBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { api, ApiError, Comment, Priority, Project, Task, TaskStatus, User } from '../lib/api';
import { dueLabel, fmtDate, projectGradients } from '../lib/data';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

type Props = {
  openTaskId: string | null;
  setOpenTaskId: (id: string | null) => void;
  projectFilter: string | null;
  setProjectFilter: (id: string | null) => void;
};

const COLS: { id: TaskStatus; title: string; cls: string }[] = [
  { id: 'todo',     title: 'To Do',       cls: 'todo' },
  { id: 'progress', title: 'In Progress', cls: 'prog' },
  { id: 'done',     title: 'Done',        cls: 'done' },
];

export function TasksView({ openTaskId, setOpenTaskId, projectFilter, setProjectFilter }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const role = user!.role;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Task> | null>(null);
  const [search, setSearch] = useState('');
  const [pri, setPri] = useState<'all' | Priority>('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [confirmDel, setConfirmDel] = useState<Task | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.listTasks(), api.listProjects(), api.listUsers()])
      .then(([t, p, u]) => { setTasks(t); setProjects(p); setUsers(u); })
      .catch((e) => toast.push({ type: 'error', title: 'Failed to load', desc: e?.message }))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const visibleTasks = tasks.filter((t) => {
    if (projectFilter && t.project !== projectFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (pri !== 'all' && t.priority !== pri) return false;
    return true;
  });

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnd = () => { setDraggingId(null); setDragOver(null); };
  const onDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    setDragOver(col);
  };
  const onDrop = async (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    if (!draggingId) return;
    const t = tasks.find((x) => x.id === draggingId);
    if (!t) return;
    if (role === 'member' && t.assignee !== user!.id) {
      toast.push({ type: 'warn', title: 'Not allowed', desc: 'You can only move tasks assigned to you.' });
      setDraggingId(null);
      setDragOver(null);
      return;
    }
    if (t.status === col) { setDraggingId(null); setDragOver(null); return; }
    const newProgress = col === 'done' ? 100 : col === 'progress' ? Math.max(t.progress, 30) : 0;
    setTasks((prev) => prev.map((x) => (x.id === draggingId ? { ...x, status: col, progress: newProgress } : x)));
    setDraggingId(null);
    setDragOver(null);
    try {
      await api.updateTask(t.id, { status: col, progress: newProgress });
      toast.push({ type: 'success', title: 'Task moved', desc: `→ ${COLS.find((c) => c.id === col)!.title}` });
    } catch (err) {
      // revert on failure
      setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      const msg = err instanceof ApiError ? err.message : 'Move failed';
      toast.push({ type: 'error', title: 'Move failed', desc: msg });
    }
  };

  const saveTask = async (data: Partial<Task>) => {
    try {
      if (modal?.id) {
        const updated = await api.updateTask(modal.id, data);
        setTasks((prev) => prev.map((t) => (t.id === modal.id ? updated : t)));
        toast.push({ type: 'success', title: 'Task updated', desc: data.title });
      } else {
        const created = await api.createTask(data);
        setTasks((prev) => [created, ...prev]);
        toast.push({ type: 'success', title: 'Task created', desc: data.title });
      }
      setModal(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Save failed';
      toast.push({ type: 'error', title: 'Save failed', desc: msg });
    }
  };

  const deleteTask = async () => {
    if (!confirmDel) return;
    try {
      await api.deleteTask(confirmDel.id);
      setTasks((prev) => prev.filter((t) => t.id !== confirmDel.id));
      toast.push({ type: 'success', title: 'Task deleted' });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Delete failed';
      toast.push({ type: 'error', title: 'Delete failed', desc: msg });
    } finally {
      setConfirmDel(null);
    }
  };

  const updateOpenTask = async (updates: Partial<Task>) => {
    if (!openTask) return;
    const prev = openTask;
    setTasks((all) => all.map((x) => (x.id === prev.id ? { ...x, ...updates } : x)));
    try {
      const refreshed = await api.updateTask(prev.id, updates);
      setTasks((all) => all.map((x) => (x.id === prev.id ? refreshed : x)));
    } catch (e) {
      // revert
      setTasks((all) => all.map((x) => (x.id === prev.id ? prev : x)));
      const msg = e instanceof ApiError ? e.message : 'Update failed';
      toast.push({ type: 'error', title: 'Update failed', desc: msg });
    }
  };

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) : null;
  const projForFilter = projectFilter ? projects.find((p) => p.id === projectFilter) : null;

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-500)' }}>Loading tasks…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Tasks</h1>
          <div className="page__sub">
            {projForFilter ? (
              <>Filtering by <strong>{projForFilter.name}</strong> ·{' '}
                <button onClick={() => setProjectFilter(null)} style={{ color: 'var(--brand-600)', fontWeight: 600 }}>Clear</button>
              </>
            ) : (
              `${tasks.length} tasks across ${projects.length} projects`
            )}
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--secondary"><Icons.Filter size={14} /> More filters</button>
          <button className="btn btn--primary" onClick={() => setModal({})}>
            <Icons.Plus size={16} /> New task
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="search" style={{ width: 280 }}>
          <span className="search__icon"><Icons.Search size={16} /></span>
          <input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`filter-pill ${pri === 'all' ? 'filter-pill--active' : ''}`} onClick={() => setPri('all')}>All priorities</button>
        <button className={`filter-pill ${pri === 'high' ? 'filter-pill--active' : ''}`} onClick={() => setPri('high')}>High</button>
        <button className={`filter-pill ${pri === 'med' ? 'filter-pill--active' : ''}`} onClick={() => setPri('med')}>Medium</button>
        <button className={`filter-pill ${pri === 'low' ? 'filter-pill--active' : ''}`} onClick={() => setPri('low')}>Low</button>
        <span style={{ flex: 1 }} />
        <div className="avatar-stack">
          {users.slice(0, 5).map((u) => (
            <div key={u.id} className={`avatar avatar--sm avatar--${u.color}`}>{u.initials}</div>
          ))}
        </div>
        <button className="filter-pill"><Icons.User size={12} /> Assignee</button>
      </div>

      <div className="kanban">
        {COLS.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={`column column--${col.cls}`}>
              <div className="column__head">
                <span className="column__dot" />
                <span className="column__title">{col.title}</span>
                <span className="column__count">{colTasks.length}</span>
                <button className="column__add" onClick={() => setModal({ status: col.id })}><Icons.Plus size={14} /></button>
              </div>
              <div
                className={`column__list ${dragOver === col.id ? 'column__list--drop-target' : ''}`}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDrop(e, col.id)}
              >
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    users={users}
                    projects={projects}
                    onClick={() => setOpenTaskId(t.id)}
                    onDragStart={(e) => onDragStart(e, t.id)}
                    onDragEnd={onDragEnd}
                    dragging={draggingId === t.id}
                    canDrag={role === 'admin' || t.assignee === user!.id}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-400)', fontSize: 12.5, border: '1.5px dashed var(--border-strong)', borderRadius: 10, background: 'rgba(255,255,255,.4)' }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <TaskModal
          initial={modal}
          users={users}
          projects={projects}
          onClose={() => setModal(null)}
          onSave={saveTask}
        />
      )}
      {openTask && (
        <TaskDrawer
          task={openTask}
          users={users}
          projects={projects}
          role={role}
          currentUser={user!}
          onClose={() => setOpenTaskId(null)}
          onEdit={() => { setModal(openTask); setOpenTaskId(null); }}
          onDelete={() => { setConfirmDel(openTask); setOpenTaskId(null); }}
          onUpdate={updateOpenTask}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Delete this task?"
          desc={`"${confirmDel.title}" will be permanently removed.`}
          onClose={() => setConfirmDel(null)}
          onConfirm={deleteTask}
        />
      )}
    </div>
  );
}

const TAG_COLORS: Record<string, string> = {
  Design: '#fce7f3', Backend: '#dbeafe', Frontend: '#e0e7ff', QA: '#fef3c7',
  DevOps: '#fee2e2', Copy: '#dcfce7', Data: '#f3e8ff', Perf: '#ffedd5', Architecture: '#cffafe',
};
const TAG_INK: Record<string, string> = {
  Design: '#9d174d', Backend: '#1e40af', Frontend: '#3730a3', QA: '#92400e',
  DevOps: '#b91c1c', Copy: '#166534', Data: '#6b21a8', Perf: '#9a3412', Architecture: '#155e75',
};

function TaskCard({ task: t, users, projects, onClick, onDragStart, onDragEnd, dragging, canDrag }: {
  task: Task; users: User[]; projects: Project[];
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
  canDrag: boolean;
}) {
  const u = users.find((x) => x.id === t.assignee);
  const proj = projects.find((p) => p.id === t.project);
  const due = dueLabel(t.due);
  const tag = t.tags?.[0];
  return (
    <div
      className={`task ${dragging ? 'task--dragging' : ''}`}
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{ cursor: canDrag ? 'grab' : 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        {tag && <span className="task__tag" style={{ background: TAG_COLORS[tag] || '#e0e7ff', color: TAG_INK[tag] || '#3730a3' }}>{tag}</span>}
        <PriorityBadge priority={t.priority} />
      </div>
      <div className="task__title">{t.title}</div>
      <div className="task__desc">{t.desc}</div>
      {t.progress > 0 && t.status === 'progress' && (
        <div className="task__progress"><span style={{ width: t.progress + '%' }} /></div>
      )}
      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 8 }}>{proj?.name}</div>
      <div className="task__meta">
        <div className="task__metaL">
          <span className="task__metaItem"><Icons.Message size={12} /> {t.commentCount}</span>
          {t.attachmentCount > 0 && (
            <span className="task__metaItem"><Icons.Paperclip size={12} /> {t.attachmentCount}</span>
          )}
          <span className={`badge badge--${due.tone}`} style={{ fontSize: 10.5, padding: '2px 6px' }}>
            <span className="badge__dot" />{due.text}
          </span>
        </div>
        {u && <div className={`avatar avatar--sm avatar--${u.color}`} title={u.name}>{u.initials}</div>}
      </div>
    </div>
  );
}

function TaskModal({ initial, users, projects, onClose, onSave }: {
  initial: Partial<Task>;
  users: User[]; projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
}) {
  const [title, setTitle] = useState(initial.title || '');
  const [desc, setDesc] = useState(initial.desc || '');
  const [project, setProject] = useState(initial.project || projects[0]?.id || '');
  const [assignee, setAssignee] = useState<string | null>(initial.assignee ?? users[0]?.id ?? null);
  const [priority, setPriority] = useState<Priority>(initial.priority || 'med');
  const [status, setStatus] = useState<TaskStatus>(initial.status || 'todo');
  const [due, setDue] = useState(initial.due || '2026-05-15');
  const isEdit = !!initial.id;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">{isEdit ? 'Edit task' : 'Create new task'}</div>
          <button className="icon-btn" onClick={onClose}><Icons.X size={18} /></button>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="field__label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="field">
            <label className="field__label">Description</label>
            <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add detail, acceptance criteria, links…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label className="field__label">Project</label>
              <select className="select" value={project} onChange={(e) => setProject(e.target.value)}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Assignee</label>
              <select className="select" value={assignee || ''} onChange={(e) => setAssignee(e.target.value || null)}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">To Do</option>
                <option value="progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="field">
              <label className="field__label">Priority</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {(['low', 'med', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      height: 42, borderRadius: 'var(--r-md)',
                      border: '1.5px solid ' + (priority === p ? 'var(--brand-500)' : 'var(--border-strong)'),
                      background: priority === p ? 'var(--brand-50)' : 'white',
                      fontSize: 13, fontWeight: 600,
                      color: priority === p ? 'var(--brand-700)' : 'var(--ink-700)',
                    }}
                  >
                    {p === 'med' ? 'Medium' : p[0].toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label className="field__label">Due date</label>
              <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            onClick={() => title && onSave({ title, desc, project, assignee, priority, status, due })}
          >
            {isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDrawer({ task: t, users, projects, role, currentUser, onClose, onEdit, onDelete, onUpdate }: {
  task: Task; users: User[]; projects: Project[];
  role: 'admin' | 'member';
  currentUser: User;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [posting, setPosting] = useState(false);
  const u = users.find((x) => x.id === t.assignee);
  const proj = projects.find((p) => p.id === t.project)!;
  const due = dueLabel(t.due);
  const canEdit = role === 'admin' || t.assignee === currentUser.id;

  useEffect(() => {
    api.listComments(t.id).then(setComments).catch(() => setComments([]));
  }, [t.id]);

  const addComment = async () => {
    if (!comment.trim() || posting) return;
    setPosting(true);
    try {
      const c = await api.createComment(t.id, comment.trim());
      setComments((prev) => [...prev, c]);
      setComment('');
    } catch {
      // toast already handles errors at upper level if needed
    } finally {
      setPosting(false);
    }
  };

  const setStatus = (s: TaskStatus) => {
    onUpdate({ status: s, progress: s === 'done' ? 100 : s === 'progress' ? Math.max(t.progress, 30) : 0 });
  };

  const grad = projectGradients[proj.gradientIdx % projectGradients.length];

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer__head">
          <span className="badge badge--blue" style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.id.slice(0, 6).toUpperCase()}</span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>in {proj.name}</span>
          <span style={{ flex: 1 }} />
          {canEdit && <button className="icon-btn" onClick={onEdit} title="Edit"><Icons.Edit size={16} /></button>}
          {role === 'admin' && <button className="icon-btn" onClick={onDelete} title="Delete"><Icons.Trash size={16} /></button>}
          <button className="icon-btn" onClick={onClose}><Icons.X size={18} /></button>
        </div>
        <div className="drawer__body">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink-900)', margin: '0 0 8px' }}>{t.title}</h2>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            <span className={`badge badge--${t.status === 'done' ? 'green' : t.status === 'progress' ? 'blue' : 'gray'}`}>
              <span className="badge__dot" />{t.status === 'todo' ? 'To Do' : t.status === 'progress' ? 'In Progress' : 'Done'}
            </span>
            <span className={`badge badge--${due.tone}`}><span className="badge__dot" />{due.text}</span>
            <PriorityBadge priority={t.priority} />
          </div>

          {canEdit && (
            <div className="drawer__section">
              <div className="drawer__section-title">Quick status</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {([{ id: 'todo', l: 'To Do' }, { id: 'progress', l: 'In Progress' }, { id: 'done', l: 'Done' }] as const).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    style={{
                      height: 36, borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600,
                      border: '1.5px solid ' + (t.status === s.id ? 'var(--brand-500)' : 'var(--border-strong)'),
                      background: t.status === s.id ? 'var(--brand-50)' : 'white',
                      color: t.status === s.id ? 'var(--brand-700)' : 'var(--ink-700)',
                    }}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="drawer__section">
            <div className="drawer__section-title">Description</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-700)', lineHeight: 1.6 }}>
              {t.desc || <span style={{ color: 'var(--ink-400)', fontStyle: 'italic' }}>No description yet.</span>}
            </div>
          </div>

          <div className="drawer__section">
            <div className="drawer__section-title">Details</div>
            <div className="drawer__meta">
              <div className="drawer__meta-label">Project</div>
              <div className="drawer__meta-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }} />
                {proj.name}
              </div>
              <div className="drawer__meta-label">Assignee</div>
              <div className="drawer__meta-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {u && <div className={`avatar avatar--sm avatar--${u.color}`}>{u.initials}</div>}
                {u?.name || 'Unassigned'}
              </div>
              <div className="drawer__meta-label">Due date</div>
              <div className="drawer__meta-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Calendar size={14} /> {fmtDate(t.due)}
              </div>
              <div className="drawer__meta-label">Priority</div>
              <div className="drawer__meta-value"><PriorityBadge priority={t.priority} /></div>
              {t.progress > 0 && t.status !== 'done' && (
                <>
                  <div className="drawer__meta-label">Progress</div>
                  <div className="drawer__meta-value">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: t.progress + '%', height: '100%', background: 'linear-gradient(90deg, var(--brand-500), var(--accent-500))' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{t.progress}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="drawer__section">
            <div className="drawer__section-title">Comments ({comments.length})</div>
            {comments.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-400)', fontStyle: 'italic' }}>
                No comments yet — be the first.
              </div>
            )}
            {comments.map((c) => {
              const cu = users.find((x) => x.id === c.user);
              if (!cu) return null;
              return (
                <div key={c.id} className="comment">
                  <div className={`avatar avatar--md avatar--${cu.color}`}>{cu.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div className="comment__head">
                      <span className="comment__name">{cu.name}</span>
                      <span className="comment__time">{c.time}</span>
                    </div>
                    <div className="comment__body">{c.body}</div>
                  </div>
                </div>
              );
            })}
            <div className="comment-form">
              <div className={`avatar avatar--md avatar--${currentUser.color}`}>{currentUser.initials}</div>
              <div style={{ flex: 1 }}>
                <textarea
                  className="textarea"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  style={{ minHeight: 64 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={addComment}
                    disabled={!comment.trim() || posting}
                  >
                    <Icons.Send size={12} /> {posting ? 'Posting…' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
