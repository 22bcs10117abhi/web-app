import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, requireAdmin } from '../auth.js';
import { asyncHandler, shapeProject, logActivity } from '../util.js';

const router = Router();
router.use(authMiddleware);

async function projectsWithCounts(where = {}) {
  const projects = await prisma.project.findMany({
    where,
    include: {
      members: { select: { userId: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  // Pull done counts per project in a single query.
  const ids = projects.map((p) => p.id);
  const doneGroups = await prisma.task.groupBy({
    by: ['projectId'],
    where: { projectId: { in: ids }, status: 'done' },
    _count: true,
  });
  const doneMap = Object.fromEntries(doneGroups.map((g) => [g.projectId, g._count]));
  return projects.map((p) => ({
    ...shapeProject(p),
    done: doneMap[p.id] || 0,
  }));
}

router.get('/', asyncHandler(async (_req, res) => {
  const out = await projectsWithCounts();
  res.json(out);
}));

const projectSchema = z.object({
  name: z.string().min(1).max(80),
  desc: z.string().max(500).default(''),
  members: z.array(z.string()).default([]),
  due: z.string().nullable().optional(),
  status: z.enum(['active', 'paused']).default('active'),
  gradientIdx: z.number().int().min(0).max(11).default(0),
});

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const data = projectSchema.parse(req.body);
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.desc,
      status: data.status,
      gradientIdx: data.gradientIdx,
      dueDate: data.due ? new Date(data.due) : null,
      ownerId: req.user.id,
      members: {
        create: [...new Set([...data.members, req.user.id])].map((userId) => ({ userId })),
      },
    },
    include: { members: true, _count: { select: { tasks: true } } },
  });
  await logActivity(prisma, {
    userId: req.user.id, type: 'create', action: 'created project',
    targetType: 'project', targetId: project.id, targetName: project.name,
  });
  res.status(201).json({ ...shapeProject(project), done: 0 });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const data = projectSchema.partial().parse(req.body);
  const id = req.params.id;
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.desc !== undefined) updateData.description = data.desc;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.gradientIdx !== undefined) updateData.gradientIdx = data.gradientIdx;
  if (data.due !== undefined) updateData.dueDate = data.due ? new Date(data.due) : null;

  await prisma.project.update({ where: { id }, data: updateData });
  if (data.members) {
    await prisma.projectMember.deleteMany({ where: { projectId: id } });
    await prisma.projectMember.createMany({
      data: [...new Set(data.members)].map((userId) => ({ projectId: id, userId })),
      skipDuplicates: true,
    });
  }
  const [refreshed] = await projectsWithCounts({ id });
  await logActivity(prisma, {
    userId: req.user.id, type: 'update', action: 'updated project',
    targetType: 'project', targetId: id, targetName: refreshed?.name || 'project',
  });
  res.json(refreshed);
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const p = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!p) return res.status(404).json({ error: 'Not found' });
  await prisma.project.delete({ where: { id: req.params.id } });
  await logActivity(prisma, {
    userId: req.user.id, type: 'update', action: 'deleted project',
    targetType: 'project', targetId: p.id, targetName: p.name,
  });
  res.status(204).end();
}));

export default router;
