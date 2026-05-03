import { useEffect, useRef, useState } from 'react';
import { Icons } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { api, ApiError, Project, User } from '../lib/api';
import { fmtDate, projectGradients } from '../lib/data';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

type Props = {
  onNavigate: (view: 'tasks', projectId?: string) => void;
};

export function ProjectsView({ onNavigate }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Project> | null>(null);
  const [confirmDel, setConfirmDel] = useState<Project | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const role = user!.role;

  const load = () => {
    setLoading(true);
    Promise.all([api.listProjects(), api.listUsers()])
      .then(([p, u]) => { setProjects(p); setUsers(u); })
      .catch((e) => toast.push({ type: 'error', title: 'Failed to load', desc: e?.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = projects.filter((p) => filter === 'all' || p.status === filter);

  const saveProject = async (data: Pick<Project, 'name' | 'desc' | 'members' | 'due'>) => {
    try {
      if (modal?.id) {
        const updated = await api.updateProject(modal.id, data);
        setProjects((prev) => prev.map((p) => (p.id === modal.id ? updated : p)));
        toast.push({ type: 'success', title: 'Project updated', desc: data.name });
      } else {
        const created = await api.createProject({ ...data, gradientIdx: Math.floor(Math.random() * projectGradients.length), status: 'active' });
        setProjects((prev) => [created, ...prev]);
        toast.push({ type: 'success', title: 'Project created', desc: data.name });
      }
      setModal(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Save failed';
      toast.push({ type: 'error', title: 'Save failed', desc: msg });
    }
  };

  const deleteProject = async () => {
    if (!confirmDel) return;
    try {
      await api.deleteProject(confirmDel.id);
      setProjects((prev) => prev.filter((p) => p.id !== confirmDel.id));
      toast.push({ type: 'success', title: 'Project deleted', desc: confirmDel.name });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Delete failed';
      toast.push({ type: 'error', title: 'Delete failed', desc: msg });
    } finally {
      setConfirmDel(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-500)' }}>Loading projects…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Projects</h1>
          <div className="page__sub">
            {projects.length} projects · {projects.reduce((a, p) => a + p.total, 0)} tasks across all projects
          </div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'inline-flex', background: 'var(--ink-100)', borderRadius: 10, padding: 3 }}>
            <button className={`chart-tab ${view === 'grid' ? 'chart-tab--active' : ''}`} onClick={() => setView('grid')}><Icons.Grid size={14} /></button>
            <button className={`chart-tab ${view === 'list' ? 'chart-tab--active' : ''}`} onClick={() => setView('list')}><Icons.List size={14} /></button>
          </div>
          {role === 'admin' && (
            <button className="btn btn--primary" onClick={() => setModal({})}>
              <Icons.Plus size={16} /> New project
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <button className={`filter-pill ${filter === 'all' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('all')}>All <span style={{ opacity: .7 }}>{projects.length}</span></button>
        <button className={`filter-pill ${filter === 'active' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('active')}>Active <span style={{ opacity: .7 }}>{projects.filter((p) => p.status === 'active').length}</span></button>
        <button className={`filter-pill ${filter === 'paused' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('paused')}>Paused <span style={{ opacity: .7 }}>{projects.filter((p) => p.status === 'paused').length}</span></button>
        <span style={{ flex: 1 }} />
        <button className="filter-pill"><Icons.Filter size={12} /> Filters</button>
        <button className="filter-pill"><Icons.Calendar size={12} /> Sort: Recent</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyProjects role={role} onCreate={() => setModal({})} />
      ) : view === 'grid' ? (
        <div className="projects-grid">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              users={users}
              role={role}
              onOpen={() => onNavigate('tasks', p.id)}
              onEdit={() => setModal(p)}
              onDelete={() => setConfirmDel(p)}
            />
          ))}
        </div>
      ) : (
        <ProjectListView
          projects={filtered}
          users={users}
          role={role}
          onOpen={(id) => onNavigate('tasks', id)}
          onEdit={(p) => setModal(p)}
          onDelete={(p) => setConfirmDel(p)}
        />
      )}

      {modal && (
        <ProjectModal
          initial={modal}
          users={users}
          onClose={() => setModal(null)}
          onSave={saveProject}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Delete project?"
          desc={`"${confirmDel.name}" and its ${confirmDel.total} tasks will be permanently removed. This cannot be undone.`}
          onClose={() => setConfirmDel(null)}
          onConfirm={deleteProject}
        />
      )}
    </div>
  );
}

function ProjectCard({ project: p, users, role, onOpen, onEdit, onDelete }: {
  project: Project; users: User[]; role: 'admin' | 'member';
  onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const grad = projectGradients[p.gradientIdx % projectGradients.length];
  const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
  const members = p.members.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
  return (
    <div className="project-card">
      <div className="project-card__top">
        <div className="project-card__icon" style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}>{p.name[0]}</div>
        <div ref={ref} style={{ position: 'relative' }}>
          <button className="project-card__menu" onClick={() => setMenu(!menu)}><Icons.More size={16} /></button>
          {menu && (
            <div className="dropdown" style={{ minWidth: 180 }}>
              <button className="dropdown__item" onClick={() => { onOpen(); setMenu(false); }}>
                <Icons.ArrowRight size={14} /> Open tasks
              </button>
              {role === 'admin' && (
                <button className="dropdown__item" onClick={() => { onEdit(); setMenu(false); }}>
                  <Icons.Edit size={14} /> Edit project
                </button>
              )}
              {role === 'admin' && (
                <>
                  <div className="dropdown__divider" />
                  <button className="dropdown__item dropdown__item--danger" onClick={() => { onDelete(); setMenu(false); }}>
                    <Icons.Trash size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <h3 className="project-card__name" style={{ cursor: 'pointer' }} onClick={onOpen}>{p.name}</h3>
      <div className="project-card__desc">{p.desc}</div>
      <div className="project-card__bar"><span style={{ width: pct + '%', background: `linear-gradient(90deg, ${grad.from}, ${grad.to})` }} /></div>
      <div className="project-card__stats">
        <span><strong>{p.done}</strong> / {p.total} tasks · <strong style={{ color: grad.from }}>{pct}%</strong></span>
        <span>Due {fmtDate(p.due)}</span>
      </div>
      <div className="project-card__foot">
        <div className="avatar-stack">
          {members.slice(0, 4).map((m) => (
            <div key={m.id} className={`avatar avatar--sm avatar--${m.color}`}>{m.initials}</div>
          ))}
          {members.length > 4 && (
            <div className="avatar avatar--sm" style={{ background: 'var(--ink-100)', color: 'var(--ink-700)' }}>+{members.length - 4}</div>
          )}
        </div>
        <span className={`badge badge--${p.status === 'active' ? 'green' : 'amber'}`}>
          <span className="badge__dot" />{p.status === 'active' ? 'Active' : 'Paused'}
        </span>
      </div>
    </div>
  );
}

function ProjectListView({ projects, users, role, onOpen, onEdit, onDelete }: {
  projects: Project[]; users: User[]; role: 'admin' | 'member';
  onOpen: (id: string) => void; onEdit: (p: Project) => void; onDelete: (p: Project) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Project</th><th>Members</th><th>Progress</th><th>Due</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const grad = projectGradients[p.gradientIdx % projectGradients.length];
            const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
            const members = p.members.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
            return (
              <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(p.id)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700 }}>{p.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{p.desc.slice(0, 60)}…</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="avatar-stack">
                    {members.slice(0, 4).map((m) => (
                      <div key={m.id} className={`avatar avatar--sm avatar--${m.color}`}>{m.initials}</div>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: `linear-gradient(90deg, ${grad.from}, ${grad.to})` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                  </div>
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>{fmtDate(p.due)}</td>
                <td>
                  <span className={`badge badge--${p.status === 'active' ? 'green' : 'amber'}`}>
                    <span className="badge__dot" />{p.status === 'active' ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {role === 'admin' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => onEdit(p)}><Icons.Edit size={14} /></button>
                      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => onDelete(p)}><Icons.Trash size={14} /></button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProjectModal({ initial, users, onClose, onSave }: {
  initial: Partial<Project>;
  users: User[];
  onClose: () => void;
  onSave: (data: Pick<Project, 'name' | 'desc' | 'members' | 'due'>) => void;
}) {
  const [name, setName] = useState(initial.name || '');
  const [desc, setDesc] = useState(initial.desc || '');
  const [members, setMembers] = useState<string[]>(initial.members || []);
  const [due, setDue] = useState(initial.due || '2026-06-30');
  const isEdit = !!initial.id;
  const toggle = (id: string) => setMembers(members.includes(id) ? members.filter((m) => m !== id) : [...members, id]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">{isEdit ? 'Edit project' : 'Create new project'}</div>
          <button className="icon-btn" onClick={onClose}><Icons.X size={18} /></button>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="field__label">Project name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atlas Mobile App" />
          </div>
          <div className="field">
            <label className="field__label">Description</label>
            <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this project about?" />
          </div>
          <div className="field">
            <label className="field__label">Due date</label>
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Team members ({members.length} selected)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 8, border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              {users.map((u) => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 7, cursor: 'pointer', background: members.includes(u.id) ? 'var(--brand-50)' : 'transparent' }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={members.includes(u.id)} onChange={() => toggle(u.id)} />
                  <div className="checkbox__box" style={{ background: members.includes(u.id) ? 'var(--brand-500)' : 'white', borderColor: members.includes(u.id) ? 'var(--brand-500)' : 'var(--border-strong)' }}>
                    {members.includes(u.id) && <span style={{ width: 10, height: 6, borderLeft: '2px solid white', borderBottom: '2px solid white', transform: 'rotate(-45deg) translate(1px,-1px)' }} />}
                  </div>
                  <div className={`avatar avatar--sm avatar--${u.color}`}>{u.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{u.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{u.title}</div>
                  </div>
                  {u.role === 'admin' && <span className="badge badge--purple"><span className="badge__dot" />Admin</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => name && onSave({ name, desc, members, due })}>
            {isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyProjects({ role, onCreate }: { role: 'admin' | 'member'; onCreate: () => void }) {
  return (
    <div className="card">
      <div className="empty">
        <div className="empty__art"><Icons.Folder size={32} /></div>
        <div className="empty__title">No projects yet</div>
        <div className="empty__desc">
          Projects are how you group tasks together. {role === 'admin' ? 'Create your first one to get started.' : 'Ask an admin to create one.'}
        </div>
        {role === 'admin' && (
          <button className="btn btn--primary" onClick={onCreate}>
            <Icons.Plus size={16} /> New project
          </button>
        )}
      </div>
    </div>
  );
}
