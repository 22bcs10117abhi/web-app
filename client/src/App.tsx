import { useEffect, useState } from 'react';
import { useAuth } from './lib/auth';
import { Sidebar, Topbar } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { ProjectsView } from './pages/Projects';
import { TasksView } from './pages/Tasks';
import { TeamView } from './pages/Team';
import { AuthScreen } from './pages/Auth';
import { api, Task } from './lib/api';

type View = 'dashboard' | 'projects' | 'tasks' | 'team';

const TITLES: Record<View, { t: string; s: string }> = {
  dashboard: { t: 'Dashboard', s: 'Overview · Acme Workspace' },
  projects:  { t: 'Projects',  s: 'Manage your projects' },
  tasks:     { t: 'Tasks',     s: 'Kanban board' },
  team:      { t: 'Team',      s: 'Members & roles' },
};

export function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ tasks: number; projects: number }>({ tasks: 0, projects: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([api.listTasks(), api.listProjects()])
      .then(([tasks, projects]) => {
        const myTasks = user.role === 'member'
          ? tasks.filter((t: Task) => t.assignee === user.id && t.status !== 'done')
          : tasks.filter((t: Task) => t.status !== 'done');
        setCounts({ tasks: myTasks.length, projects: projects.length });
      })
      .catch(() => { /* non-fatal */ });
  }, [user, view]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontFamily: 'var(--font-display, system-ui)', color: 'var(--ink-500)' }}>
        Loading…
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const navigate = (v: View, projId?: string) => {
    setView(v);
    if (projId) setProjectFilter(projId);
    else if (v !== 'tasks') setProjectFilter(null);
  };

  return (
    <div className="app">
      <Sidebar
        view={view}
        setView={navigate}
        role={user.role}
        taskCount={counts.tasks}
        projectCount={counts.projects}
      />
      <div className="main">
        <Topbar
          title={TITLES[view].t}
          subtitle={TITLES[view].s}
          user={user}
          onNotifClick={() => { /* notifications can be a future iter */ }}
          onLogout={logout}
          notifCount={0}
        />
        {view === 'dashboard' && <Dashboard onOpenTask={(id) => { setView('tasks'); setOpenTaskId(id); }} onNavigate={navigate} />}
        {view === 'projects' && <ProjectsView onNavigate={navigate} />}
        {view === 'tasks' && (
          <TasksView
            openTaskId={openTaskId}
            setOpenTaskId={setOpenTaskId}
            projectFilter={projectFilter}
            setProjectFilter={setProjectFilter}
          />
        )}
        {view === 'team' && <TeamView />}
      </div>
    </div>
  );
}
