import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { initialsOf } from '../src/util.js';

const prisma = new PrismaClient();

const SEED_USERS = [
  { id: 'u1', name: 'Maya Chen',     email: 'maya@taskflow.app',  role: 'admin',  color: 'c1', title: 'Product Lead' },
  { id: 'u2', name: 'Devon Park',    email: 'devon@taskflow.app', role: 'member', color: 'c2', title: 'Senior Engineer' },
  { id: 'u3', name: 'Aisha Rahman',  email: 'aisha@taskflow.app', role: 'member', color: 'c3', title: 'Designer' },
  { id: 'u4', name: 'Jonas Lindberg',email: 'jonas@taskflow.app', role: 'member', color: 'c4', title: 'iOS Engineer' },
  { id: 'u5', name: 'Priya Vasquez', email: 'priya@taskflow.app', role: 'admin',  color: 'c5', title: 'Eng Manager' },
  { id: 'u6', name: 'Theo Okafor',   email: 'theo@taskflow.app',  role: 'member', color: 'c6', title: 'Backend Engineer' },
  { id: 'u7', name: 'Lina Sato',     email: 'lina@taskflow.app',  role: 'member', color: 'c7', title: 'QA Engineer' },
];

const PASSWORD = 'Password123!';

const SEED_PROJECTS = [
  { id: 'p1', name: 'Atlas Mobile App',    description: 'Cross-platform rewrite using React Native — Q2 launch.', members: ['u1','u2','u4','u3'], status: 'active', gradientIdx: 0, dueDate: '2026-06-15', ownerId: 'u1' },
  { id: 'p2', name: 'Onboarding Redesign', description: 'New activation flow and welcome experience.',           members: ['u1','u3','u7'],       status: 'active', gradientIdx: 5, dueDate: '2026-05-28', ownerId: 'u1' },
  { id: 'p3', name: 'Billing v2',          description: 'Subscription management and revised invoice flow.',     members: ['u2','u5','u6'],       status: 'active', gradientIdx: 4, dueDate: '2026-07-30', ownerId: 'u5' },
  { id: 'p4', name: 'Marketing Site',      description: 'Refresh of landing pages and CMS migration.',           members: ['u3','u7'],            status: 'paused', gradientIdx: 2, dueDate: '2026-05-15', ownerId: 'u1' },
  { id: 'p5', name: 'API Gateway',         description: 'Move from REST monolith to gateway + microservices.',   members: ['u6','u4','u2','u5'],  status: 'active', gradientIdx: 1, dueDate: '2026-08-10', ownerId: 'u5' },
  { id: 'p6', name: 'Analytics Pipeline',  description: 'Event ingestion + warehouse + dashboards.',             members: ['u5','u6'],            status: 'active', gradientIdx: 3, dueDate: '2026-09-01', ownerId: 'u5' },
];

const SEED_TASKS = [
  { id: 't1',  title: 'Design new dashboard layout', description: 'Wireframe + hi-fi for the redesigned overview screen with key metrics.', projectId: 'p1', status: 'todo',     priority: 'high', assigneeId: 'u3', dueDate: '2026-05-08', tags: ['Design'], progress: 0 },
  { id: 't2',  title: 'Set up CI/CD on Railway',     description: 'Configure auto-deploy on main push, add staging environment.',           projectId: 'p5', status: 'todo',     priority: 'med',  assigneeId: 'u6', dueDate: '2026-05-12', tags: ['DevOps'], progress: 0 },
  { id: 't3',  title: 'Write API auth tests',        description: 'Cover JWT refresh, role middleware and lockouts.',                       projectId: 'p3', status: 'todo',     priority: 'med',  assigneeId: 'u7', dueDate: '2026-05-15', tags: ['QA'],     progress: 0 },
  { id: 't4',  title: 'Implement role-based middleware', description: 'Admins can edit projects + manage users. Members read-only on projects.', projectId: 'p3', status: 'progress', priority: 'high', assigneeId: 'u2', dueDate: '2026-05-04', tags: ['Backend'], progress: 60 },
  { id: 't5',  title: 'Kanban drag-and-drop',        description: 'HTML5 drag/drop with optimistic updates and cross-column move.',         projectId: 'p1', status: 'progress', priority: 'high', assigneeId: 'u4', dueDate: '2026-05-06', tags: ['Frontend'], progress: 75 },
  { id: 't6',  title: 'Sketch onboarding hero illustration', description: 'Three concepts for the welcome screen, sign-off Friday.',         projectId: 'p2', status: 'progress', priority: 'low',  assigneeId: 'u3', dueDate: '2026-05-09', tags: ['Design'], progress: 30 },
  { id: 't7',  title: 'Reset password email copy',   description: 'Friendly, on-brand. Run by Maya for tone.',                              projectId: 'p2', status: 'done',     priority: 'low',  assigneeId: 'u1', dueDate: '2026-04-28', tags: ['Copy'],   progress: 100 },
  { id: 't8',  title: 'Stripe webhook handler',      description: 'Subscription + invoice events with idempotency keys.',                   projectId: 'p3', status: 'done',     priority: 'high', assigneeId: 'u2', dueDate: '2026-04-25', tags: ['Backend'], progress: 100 },
  { id: 't9',  title: 'Add empty state illustrations', description: 'Friendly states for tasks, projects, comments.',                       projectId: 'p1', status: 'done',     priority: 'med',  assigneeId: 'u3', dueDate: '2026-04-22', tags: ['Design'], progress: 100 },
  { id: 't10', title: 'Set up event schema',         description: 'Define core events for analytics pipeline v1.',                         projectId: 'p6', status: 'todo',     priority: 'med',  assigneeId: 'u5', dueDate: '2026-05-20', tags: ['Data'],   progress: 0 },
  { id: 't11', title: 'Audit Lighthouse scores',     description: 'Performance budget + fixes for marketing pages.',                       projectId: 'p4', status: 'progress', priority: 'low',  assigneeId: 'u7', dueDate: '2026-05-11', tags: ['Perf'],   progress: 40 },
  { id: 't12', title: 'Decompose orders monolith',   description: 'Identify boundary; draft RFC for orders service split.',                projectId: 'p5', status: 'progress', priority: 'high', assigneeId: 'u6', dueDate: '2026-05-05', tags: ['Architecture'], progress: 50 },
];

const SEED_COMMENTS = [
  { taskId: 't4', userId: 'u1', body: 'Started on this — let me know if you need design guidance for the unauthorized state.' },
  { taskId: 't4', userId: 'u2', body: 'Got the basic middleware in. Need to discuss the project-edit route with you Priya.' },
  { taskId: 't4', userId: 'u5', body: "Sounds good — let's sync today at 3pm." },
  { taskId: 't5', userId: 'u4', body: 'Going with native HTML5 dnd over a library — bundle size matters here.' },
  { taskId: 't5', userId: 'u3', body: 'Make sure dragging shows a clear placeholder shadow ✨' },
];

const SEED_ACTIVITY = [
  { userId: 'u2', action: 'completed',           targetType: 'task',    targetId: 't8', targetName: 'Stripe webhook handler',  type: 'done' },
  { userId: 'u3', action: 'commented on',        targetType: 'task',    targetId: 't1', targetName: 'Design new dashboard layout', type: 'comment' },
  { userId: 'u1', action: 'created project',     targetType: 'project', targetId: 'p2', targetName: 'Onboarding Redesign',     type: 'create' },
  { userId: 'u4', action: 'moved to In Progress',targetType: 'task',    targetId: 't5', targetName: 'Kanban drag-and-drop',    type: 'move' },
  { userId: 'u5', action: 'assigned',            targetType: 'task',    targetId: 't10', targetName: 'Set up event schema',    type: 'assign' },
  { userId: 'u6', action: 'updated',             targetType: 'task',    targetId: 't12', targetName: 'Decompose orders monolith', type: 'update' },
];

async function main() {
  console.log('Seeding database…');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Map seed-file string IDs (u1, p1) → real DB cuids.
  const userIdMap = {};
  const projectIdMap = {};
  const taskIdMap = {};

  for (const u of SEED_USERS) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        title: u.title,
        initials: initialsOf(u.name),
        color: u.color,
      },
    });
    userIdMap[u.id] = created.id;
  }

  for (const p of SEED_PROJECTS) {
    const existing = await prisma.project.findFirst({ where: { name: p.name } });
    if (existing) {
      projectIdMap[p.id] = existing.id;
      continue;
    }
    const created = await prisma.project.create({
      data: {
        name: p.name,
        description: p.description,
        status: p.status,
        gradientIdx: p.gradientIdx,
        dueDate: new Date(p.dueDate),
        ownerId: userIdMap[p.ownerId],
        members: {
          create: p.members.map((uid) => ({ userId: userIdMap[uid] })),
        },
      },
    });
    projectIdMap[p.id] = created.id;
  }

  for (const t of SEED_TASKS) {
    const existing = await prisma.task.findFirst({
      where: { title: t.title, projectId: projectIdMap[t.projectId] },
    });
    if (existing) {
      taskIdMap[t.id] = existing.id;
      continue;
    }
    const created = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
        dueDate: new Date(t.dueDate),
        tags: t.tags,
        projectId: projectIdMap[t.projectId],
        assigneeId: userIdMap[t.assigneeId],
      },
    });
    taskIdMap[t.id] = created.id;
  }

  for (const c of SEED_COMMENTS) {
    const tid = taskIdMap[c.taskId];
    if (!tid) continue;
    const existing = await prisma.comment.findFirst({
      where: { taskId: tid, body: c.body },
    });
    if (existing) continue;
    await prisma.comment.create({
      data: { taskId: tid, userId: userIdMap[c.userId], body: c.body },
    });
  }

  for (const a of SEED_ACTIVITY) {
    const userId = userIdMap[a.userId];
    if (!userId) continue;
    await prisma.activity.create({
      data: {
        userId,
        type: a.type,
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetType === 'task' ? taskIdMap[a.targetId] : projectIdMap[a.targetId],
        targetName: a.targetName,
      },
    });
  }

  console.log(`Seed complete. Login as any seed user with password: ${PASSWORD}`);
  console.log('  Admin: maya@taskflow.app');
  console.log('  Member: devon@taskflow.app');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
