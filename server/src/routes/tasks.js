import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, requireAdmin } from '../auth.js';
import { asyncHandler, shapeTask, shapeComment, logActivity } from '../util.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.project) where.projectId = String(req.query.project);
  if (req.query.assignee) where.assigneeId = String(req.query.assignee);
  if (req.query.status) where.status = String(req.query.status);
  const tasks = await prisma.task.findMany({
    where,
    include: { _count: { select: { comments: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks.map(shapeTask));
}));

const taskSchema = z.object({
  title: z.string().min(1).max(120),
  desc: z.string().max(2000).default(''),
  project: z.string(),
  assignee: z.string().nullable().optional(),
  status: z.enum(['todo', 'progress', 'done']).default('todo'),
  priority: z.enum(['low', 'med', 'high']).default('med'),
  progress: z.number().int().min(0).max(100).default(0),
  due: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

function canEditTask(user, task) {
  if (user.role === 'admin') return true;
  return task.assigneeId === user.id;
}

router.post('/', asyncHandler(async (req, res) => {
  // members can create tasks too — they'll be assigned to themselves by default
  const data = taskSchema.parse(req.body);
  if (req.user.role !== 'admin' && data.assignee && data.assignee !== req.user.id) {
    return res.status(403).json({ error: 'Members can only create tasks assigned to themselves' });
  }
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.desc,
      status: data.status,
      priority: data.priority,
      progress: data.progress,
      dueDate: data.due ? new Date(data.due) : null,
      tags: data.tags,
      projectId: data.project,
      assigneeId: data.assignee || req.user.id,
    },
    include: { _count: { select: { comments: true } } },
  });
  const proj = await prisma.project.findUnique({ where: { id: task.projectId } });
  await logActivity(prisma, {
    userId: req.user.id, type: 'create', action: 'created',
    targetType: 'task', targetId: task.id, targetName: task.title,
  });
  res.status(201).json(shapeTask(task));
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (!canEditTask(req.user, task)) {
    return res.status(403).json({ error: 'You can only edit tasks assigned to you' });
  }
  const data = taskSchema.partial().parse(req.body);
  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.desc !== undefined) updateData.description = data.desc;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.progress !== undefined) updateData.progress = data.progress;
  if (data.due !== undefined) updateData.dueDate = data.due ? new Date(data.due) : null;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.project !== undefined) updateData.projectId = data.project;
  if (data.assignee !== undefined) {
    if (req.user.role !== 'admin' && data.assignee !== req.user.id) {
      return res.status(403).json({ error: 'Only admins can reassign tasks' });
    }
    updateData.assigneeId = data.assignee;
  }
  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: updateData,
    include: { _count: { select: { comments: true } } },
  });
  const wasStatusChange = data.status && data.status !== task.status;
  if (wasStatusChange) {
    const map = { done: 'completed', progress: 'moved to In Progress', todo: 'moved to To Do' };
    await logActivity(prisma, {
      userId: req.user.id,
      type: data.status === 'done' ? 'done' : 'move',
      action: map[data.status],
      targetType: 'task', targetId: updated.id, targetName: updated.title,
    });
  } else {
    await logActivity(prisma, {
      userId: req.user.id, type: 'update', action: 'updated',
      targetType: 'task', targetId: updated.id, targetName: updated.title,
    });
  }
  res.json(shapeTask(updated));
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const t = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: 'Not found' });
  await prisma.task.delete({ where: { id: req.params.id } });
  await logActivity(prisma, {
    userId: req.user.id, type: 'update', action: 'deleted',
    targetType: 'task', targetId: t.id, targetName: t.title,
  });
  res.status(204).end();
}));

// Comments
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { taskId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(comments.map(shapeComment));
}));

const commentSchema = z.object({ body: z.string().min(1).max(2000) });

router.post('/:id/comments', asyncHandler(async (req, res) => {
  const data = commentSchema.parse(req.body);
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const c = await prisma.comment.create({
    data: { body: data.body, taskId: req.params.id, userId: req.user.id },
  });
  await logActivity(prisma, {
    userId: req.user.id, type: 'comment', action: 'commented on',
    targetType: 'task', targetId: task.id, targetName: task.title,
  });
  res.status(201).json(shapeComment(c));
}));

export default router;
