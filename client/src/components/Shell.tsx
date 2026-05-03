import { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { User } from '../lib/api';

type View = 'dashboard' | 'projects' | 'tasks' | 'team';

type SidebarProps = {
  view: View;
  setView: (v: View, projectId?: string) => void;
  role: 'admin' | 'member';
  taskCount: number;
  projectCount: number;
};

export function Sidebar({ view, setView, role, taskCount, projectCount }: SidebarProps) {
  type Item = { id: View; label: string; icon: React.ReactNode; count?: number; adminOnly?: boolean };
  const items: Item[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.Dashboard /> },
    { id: 'projects',  label: 'Projects',  icon: <Icons.Folder />, count: projectCount },
    { id: 'tasks',     label: 'Tasks',     icon: <Icons.Tasks />, count: taskCount },
    { id: 'team',      label: 'Team',      icon: <Icons.Users />, adminOnly: true },
  ];
  const settings: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'settings',     label: 'Settings',      icon: <Icons.Settings /> },
    { id: 'notifications', label: 'Notifications', icon: <Icons.Bell /> },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">T</span>
        <span>TaskFlow</span>
      </div>
      <div className="sidebar__section">Workspace</div>
      <nav className="sidebar__nav">
        {items.map((it) => {
          const locked = it.adminOnly && role !== 'admin';
          return (
            <button
              key={it.id}
              className={`nav-item ${view === it.id ? 'nav-item--active' : ''} ${locked ? 'nav-item--locked' : ''}`}
              onClick={() => !locked && setView(it.id)}
              title={locked ? 'Admins only' : ''}
            >
              <span className="nav-item__icon">{it.icon}</span>
              <span>{it.label}</span>
              {locked ? (
                <span className="nav-item__count" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icons.Lock size={11} />
                </span>
              ) : it.count != null ? (
                <span className="nav-item__count">{it.count}</span>
              ) : null}
            </button>
          );
        })}
        <div className="sidebar__section">Account</div>
        {settings.map((it) => (
          <button key={it.id} className="nav-item">
            <span className="nav-item__icon">{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className="workspace-card">
          <div className="workspace-card__icon"><Icons.Sparkle size={16} /></div>
          <div>
            <div className="workspace-card__title">Acme Workspace</div>
            <div className="workspace-card__sub">Pro · 12 members</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

type TopbarProps = {
  title: string;
  subtitle?: string;
  user: User;
  onNotifClick: () => void;
  onLogout: () => void;
  notifCount?: number;
};

export function Topbar({ title, subtitle, user, onNotifClick, onLogout, notifCount = 0 }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const roleLabel = user.role === 'admin' ? 'Admin' : 'Member';
  return (
    <header className="topbar">
      <div>
        <div className="topbar__title">{title}</div>
        {subtitle && <div className="topbar__crumbs">{subtitle}</div>}
      </div>
      <div className="topbar__spacer" />
      <div className="search">
        <span className="search__icon"><Icons.Search size={16} /></span>
        <input placeholder="Search tasks, projects, people…" />
        <span className="search__kbd">⌘K</span>
      </div>
      <button className="icon-btn" onClick={onNotifClick} title="Notifications">
        <Icons.Bell size={18} />
        {notifCount > 0 && <span className="icon-btn__dot" />}
      </button>
      <button className="icon-btn" title="Help">
        <Icons.Info size={18} />
      </button>
      <div ref={ref} style={{ position: 'relative' }}>
        <button className="profile-chip" onClick={() => setOpen(!open)}>
          <div className={`avatar avatar--md avatar--${user.color}`}>{user.initials}</div>
          <div>
            <div className="profile-chip__name">{user.name}</div>
            <div className="profile-chip__role">{roleLabel}</div>
          </div>
          <Icons.ChevronDown size={14} />
        </button>
        {open && (
          <div className="dropdown">
            <div className="dropdown__head">
              <div className={`avatar avatar--lg avatar--${user.color}`}>{user.initials}</div>
              <div>
                <div className="dropdown__name">{user.name}</div>
                <div className="dropdown__mail">{user.email}</div>
              </div>
            </div>
            <button className="dropdown__item"><Icons.User size={16} /> Profile</button>
            <button className="dropdown__item"><Icons.Settings size={16} /> Settings</button>
            <div className="dropdown__divider" />
            <button className="dropdown__item dropdown__item--danger" onClick={onLogout}>
              <Icons.Logout size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
