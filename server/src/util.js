export const COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];

export function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function pickColor(seed) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function shapeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    title: u.title,
    initials: u.initials,
    color: u.color,
  };
}

export function shapeProject(p) {
  return {
    id: p.id,
    name: p.name,
    desc: p.description,
    status: p.status,
    gradientIdx: p.gradientIdx,
    due: p.dueDate ? p.dueDate.toISOString().slice(0, 10) : null,
    members: p.members?.map((m) => m.userId) ?? [],
    total: p._count?.tasks ?? p.total ?? 0,
    done: p.doneCount ?? 0,
  };
}

export function shapeTask(t) {
  return {
    id: t.id,
    title: t.title,
    desc: t.description,
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    project: t.projectId,
    assignee: t.assigneeId,
    due: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
    tags: t.tags ?? [],
    commentCount: t._count?.comments ?? 0,
    attachmentCount: t.attachmentCount ?? 0,
  };
}

export function shapeComment(c) {
  return {
    id: c.id,
    user: c.userId,
    body: c.body,
    time: relTime(c.createdAt),
  };
}

export function shapeActivity(a) {
  return {
    id: a.id,
    user: a.userId,
    action: a.action,
    target: a.targetName,
    type: a.type,
    time: relTime(a.createdAt),
  };
}

export function relTime(date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function logActivity(prisma, { userId, type, action, targetType, targetId, targetName }) {
  try {
    await prisma.activity.create({
      data: { userId, type, action, targetType, targetId, targetName },
    });
  } catch (e) {
    // non-fatal
    console.warn('activity log failed', e.message);
  }
}
