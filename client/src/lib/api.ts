// API client — minimal fetch wrapper with JWT bearer.

export type Role = 'admin' | 'member';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  title: string;
  initials: string;
  color: string;
};

export type Project = {
  id: string;
  name: string;
  desc: string;
  status: 'active' | 'paused';
  gradientIdx: number;
  due: string | null;
  members: string[];
  total: number;
  done: number;
};

export type TaskStatus = 'todo' | 'progress' | 'done';
export type Priority = 'low' | 'med' | 'high';

export type Task = {
  id: string;
  title: string;
  desc: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  project: string;
  assignee: string | null;
  due: string | null;
  tags: string[];
  commentCount: number;
  attachmentCount: number;
};

export type Comment = {
  id: string;
  user: string;
  body: string;
  time: string;
};

export type Activity = {
  id: string;
  user: string;
  action: string;
  target: string;
  type: string;
  time: string;
};

export type Stats = {
  total: number;
  done: number;
  pending: number;
  todo: number;
  progress: number;
  overdue: number;
};

export type WeeklyPoint = { d: string; done: number; pending: number };

const TOKEN_KEY = 'taskflow.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

const BASE = '/api';

class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body?.details);
  }
  return body as T;
}

export const api = {
  // auth
  signup: (data: { name: string; email: string; password: string; role: Role; title?: string }) =>
    request<{ token: string; user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ user: User }>('/auth/me'),

  // users / team
  listUsers: () => request<User[]>('/users'),
  inviteUser: (data: { name: string; email: string; title: string; role: Role }) =>
    request<User & { tempPassword?: string }>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<Pick<User, 'name' | 'role' | 'title'>>) =>
    request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  // projects
  listProjects: () => request<Project[]>('/projects'),
  createProject: (data: Partial<Project>) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // tasks
  listTasks: (params?: { project?: string }) => {
    const qs = params?.project ? `?project=${encodeURIComponent(params.project)}` : '';
    return request<Task[]>(`/tasks${qs}`);
  },
  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // comments
  listComments: (taskId: string) => request<Comment[]>(`/tasks/${taskId}/comments`),
  createComment: (taskId: string, body: string) =>
    request<Comment>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

  // dashboard
  stats: () => request<Stats>('/dashboard/stats'),
  activity: () => request<Activity[]>('/dashboard/activity'),
  weekly: () => request<WeeklyPoint[]>('/dashboard/weekly'),
};

export { ApiError };
