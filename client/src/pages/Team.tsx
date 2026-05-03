import { useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { api, ApiError, User } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

export function TeamView() {
  const { user } = useAuth();
  const toast = useToast();
  const role = user!.role;

  if (role !== 'admin') {
    return (
      <div className="page">
        <div className="card">
          <div className="empty" style={{ padding: '64px 24px' }}>
            <div className="empty__art" style={{ background: 'linear-gradient(135deg, var(--warn-50), #fff7e6)', color: 'var(--warn-700)' }}>
              <Icons.Lock size={32} />
            </div>
            <div className="empty__title">Admin access required</div>
            <div className="empty__desc">
              Team management is only available to workspace admins.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminTeam currentUserId={user!.id} toast={toast} />;
}

function AdminTeam({ currentUserId, toast }: { currentUserId: string; toast: ReturnType<typeof useToast> }) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'member'>('all');

  const load = () => {
    setLoading(true);
    api.listUsers()
      .then(setMembers)
      .catch((e) => toast.push({ type: 'error', title: 'Failed to load team', desc: e?.message }))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = members.filter((m) =>
    (filterRole === 'all' || m.role === filterRole) &&
    (!search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const addMember = async (data: { name: string; email: string; title: string; role: 'admin' | 'member' }) => {
    try {
      const created = await api.inviteUser(data);
      setMembers((prev) => [created, ...prev]);
      setModal(false);
      const tempPart = (created as any).tempPassword
        ? ` Temp password: ${(created as any).tempPassword}`
        : '';
      toast.push({ type: 'success', title: 'Member added', desc: `${data.email} invited.${tempPart}` });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed';
      toast.push({ type: 'error', title: 'Invite failed', desc: msg });
    }
  };

  const removeMember = async () => {
    if (!confirmDel) return;
    try {
      await api.deleteUser(confirmDel.id);
      setMembers((prev) => prev.filter((m) => m.id !== confirmDel.id));
      toast.push({ type: 'success', title: 'Member removed', desc: confirmDel.name });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed';
      toast.push({ type: 'error', title: 'Remove failed', desc: msg });
    } finally {
      setConfirmDel(null);
    }
  };

  const toggleRole = async (m: User) => {
    if (m.id === currentUserId) {
      toast.push({ type: 'warn', title: "Can't change your own role" });
      return;
    }
    const newRole: 'admin' | 'member' = m.role === 'admin' ? 'member' : 'admin';
    try {
      const updated = await api.updateUser(m.id, { role: newRole });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
      toast.push({ type: 'info', title: 'Role updated', desc: `${m.name} is now ${newRole}.` });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed';
      toast.push({ type: 'error', title: 'Update failed', desc: msg });
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-500)' }}>Loading team…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Team</h1>
          <div className="page__sub">
            {members.length} people · {members.filter((m) => m.role === 'admin').length} admins
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--secondary"><Icons.Mail size={14} /> Invite link</button>
          <button className="btn btn--primary" onClick={() => setModal(true)}><Icons.Plus size={16} /> Add member</button>
        </div>
      </div>

      <div className="filters">
        <div className="search" style={{ width: 280 }}>
          <span className="search__icon"><Icons.Search size={16} /></span>
          <input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`filter-pill ${filterRole === 'all' ? 'filter-pill--active' : ''}`} onClick={() => setFilterRole('all')}>All</button>
        <button className={`filter-pill ${filterRole === 'admin' ? 'filter-pill--active' : ''}`} onClick={() => setFilterRole('admin')}>Admins</button>
        <button className={`filter-pill ${filterRole === 'member' ? 'filter-pill--active' : ''}`} onClick={() => setFilterRole('member')}>Members</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty__art"><Icons.Users size={32} /></div>
            <div className="empty__title">No matches</div>
            <div className="empty__desc">Try a different search or filter.</div>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Role</th><th>Title</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="table__user">
                      <div className={`avatar avatar--lg avatar--${m.color}`}>{m.initials}</div>
                      <div>
                        <div className="table__user-name">{m.name}</div>
                        <div className="table__user-mail">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge--${m.role === 'admin' ? 'purple' : 'blue'}`}>
                      <span className="badge__dot" />{m.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--ink-600)' }}>{m.title}</td>
                  <td><span className="badge badge--green"><span className="badge__dot" />Active</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => toggleRole(m)}
                        disabled={m.id === currentUserId}
                      >
                        Make {m.role === 'admin' ? 'member' : 'admin'}
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: 32, height: 32 }}
                        onClick={() => setConfirmDel(m)}
                        disabled={m.id === currentUserId}
                        title="Remove"
                      >
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <AddMemberModal onClose={() => setModal(false)} onAdd={addMember} />}
      {confirmDel && (
        <ConfirmModal
          title="Remove this member?"
          desc={`${confirmDel.name} will lose access to this workspace immediately.`}
          confirmLabel="Remove"
          onClose={() => setConfirmDel(null)}
          onConfirm={removeMember}
        />
      )}
    </div>
  );
}

function AddMemberModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (data: { name: string; email: string; title: string; role: 'admin' | 'member' }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [r, setR] = useState<'admin' | 'member'>('member');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">Add team member</div>
          <button className="icon-btn" onClick={onClose}><Icons.X size={18} /></button>
        </div>
        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="field__label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="field">
            <label className="field__label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="field">
            <label className="field__label">Job title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Engineer" />
          </div>
          <div className="field">
            <label className="field__label">Role</label>
            <div className="role-picker">
              <button
                type="button"
                className={`role-card ${r === 'admin' ? 'role-card--active' : ''}`}
                onClick={() => setR('admin')}
              >
                <div className="role-card__icon"><Icons.Shield size={16} /></div>
                <div>
                  <div className="role-card__title">Admin</div>
                  <div className="role-card__desc">Full workspace access</div>
                </div>
              </button>
              <button
                type="button"
                className={`role-card ${r === 'member' ? 'role-card--active' : ''}`}
                onClick={() => setR('member')}
              >
                <div className="role-card__icon"><Icons.User size={16} /></div>
                <div>
                  <div className="role-card__title">Member</div>
                  <div className="role-card__desc">View & edit assigned</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            onClick={() => name && email && onAdd({ name, email, title: title || 'Team Member', role: r })}
          >
            <Icons.Send size={14} /> Send invite
          </button>
        </div>
      </div>
    </div>
  );
}
