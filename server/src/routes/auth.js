import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { signToken, authMiddleware } from '../auth.js';
import { asyncHandler, initialsOf, pickColor, shapeUser } from '../util.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
  role: z.enum(['admin', 'member']).default('member'),
  title: z.string().max(80).optional(),
});

router.post('/signup', asyncHandler(async (req, res) => {
  const data = signupSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      role: data.role,
      title: data.title || (data.role === 'admin' ? 'Admin' : 'Team Member'),
      initials: initialsOf(data.name),
      color: pickColor(data.email),
    },
  });
  const token = signToken(user);
  res.status(201).json({ token, user: shapeUser(user) });
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  const token = signToken(user);
  res.json({ token, user: shapeUser(user) });
}));

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: shapeUser(req.user) });
});

export default router;
