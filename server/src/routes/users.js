import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, requireAdmin } from '../auth.js';
import { asyncHandler, initialsOf, pickColor, shapeUser, logActivity } from '../util.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(users.map(shapeUser));
}));

const inviteSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().max(120),
  title: z.string().max(80).default('Team Member'),
  role: z.enum(['admin', 'member']).default('member'),
});

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const data = inviteSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  // Invite flow: set a random temp password (in real app, send email).
  const tempPassword = Math.random().toString(36).slice(2) + '!Aa1';
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      role: data.role,
      title: data.title,
      initials: initialsOf(data.name),
      color: pickColor(data.email),
    },
  });
  await logActivity(prisma, {
    userId: req.user.id, type: 'create', action: 'invited',
    targetType: 'user', targetId: user.id, targetName: user.name,
  });
  res.status(201).json({ ...shapeUser(user), tempPassword });
}));

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  title: z.string().max(80).optional(),
  role: z.enum(['admin', 'member']).optional(),
});

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
  });
  res.json(shapeUser(user));
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You can't remove yourself" });
  }
  const u = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!u) return res.status(404).json({ error: 'Not found' });
  await prisma.user.delete({ where: { id: req.params.id } });
  await logActivity(prisma, {
    userId: req.user.id, type: 'update', action: 'removed',
    targetType: 'user', targetId: u.id, targetName: u.name,
  });
  res.status(204).end();
}));

export default router;
