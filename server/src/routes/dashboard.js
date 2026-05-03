import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../auth.js';
import { asyncHandler, shapeActivity } from '../util.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { assigneeId: req.user.id };
  const [total, done, todo, progress, overdue] = await Promise.all([
    prisma.task.count({ where: filter }),
    prisma.task.count({ where: { ...filter, status: 'done' } }),
    prisma.task.count({ where: { ...filter, status: 'todo' } }),
    prisma.task.count({ where: { ...filter, status: 'progress' } }),
    prisma.task.count({
      where: { ...filter, status: { not: 'done' }, dueDate: { lt: new Date() } },
    }),
  ]);
  const pending = total - done;
  res.json({ total, done, pending, todo, progress, overdue });
}));

router.get('/activity', asyncHandler(async (_req, res) => {
  const items = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  res.json(items.map(shapeActivity));
}));

router.get('/weekly', asyncHandler(async (req, res) => {
  // last 7 days, [{day, done, pending}]
  const filter = req.user.role === 'admin' ? {} : { assigneeId: req.user.id };
  const out = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [done, pending] = await Promise.all([
      prisma.task.count({
        where: {
          ...filter,
          status: 'done',
          updatedAt: { gte: start, lt: end },
        },
      }),
      prisma.task.count({
        where: {
          ...filter,
          status: { not: 'done' },
          updatedAt: { gte: start, lt: end },
        },
      }),
    ]);
    out.push({ d: days[start.getDay()], done, pending });
  }
  res.json(out);
}));

export default router;
