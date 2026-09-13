import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';

export const viewsRouter = Router();

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function visibilityWhere(user) {
  if (!user) return { visibility: 'PUBLIC' };
  if (user.role === 'ADMIN') return {};
  return {
    OR: [{ visibility: 'PUBLIC' }, { visibility: 'SHARED' }, { ownerId: user.id }],
  };
}

function canManage(view, user) {
  return !!user && (user.role === 'ADMIN' || view.ownerId === user.id);
}

const widgetInclude = {
  widgets: {
    orderBy: { order: 'asc' },
    include: {
      indicators: {
        orderBy: { order: 'asc' },
        include: { indicator: { include: { dataPoints: { orderBy: { period: 'asc' } } } } },
      },
    },
  },
};

viewsRouter.get('/', optionalAuthenticate, async (req, res) => {
  const views = await prisma.view.findMany({
    where: visibilityWhere(req.user),
    orderBy: { updatedAt: 'desc' },
    include: { owner: { select: { id: true, name: true } }, _count: { select: { widgets: true } } },
  });
  res.json(views);
});

viewsRouter.get('/:slug', optionalAuthenticate, async (req, res) => {
  const view = await prisma.view.findUnique({
    where: { slug: req.params.slug },
    include: { owner: { select: { id: true, name: true } }, ...widgetInclude },
  });
  if (!view) return res.status(404).json({ error: 'View not found' });

  const visible =
    view.visibility === 'PUBLIC' ||
    (req.user && (view.visibility === 'SHARED' || view.ownerId === req.user.id || req.user.role === 'ADMIN'));
  if (!visible) return res.status(404).json({ error: 'View not found' });

  res.json({ ...view, canManage: canManage(view, req.user) });
});

const viewSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'SHARED', 'PUBLIC']).optional(),
});

viewsRouter.post('/', authenticate, requireRole('EDITOR'), async (req, res) => {
  const parsed = viewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, visibility } = parsed.data;
  let slug = slugify(title);
  const clash = await prisma.view.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const view = await prisma.view.create({
    data: { title, description, visibility: visibility || 'PRIVATE', slug, ownerId: req.user.id },
    include: widgetInclude,
  });
  res.status(201).json(view);
});

viewsRouter.put('/:id', authenticate, async (req, res) => {
  const view = await prisma.view.findUnique({ where: { id: req.params.id } });
  if (!view) return res.status(404).json({ error: 'View not found' });
  if (!canManage(view, req.user)) return res.status(403).json({ error: 'Not allowed to edit this view' });

  const parsed = viewSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.view.update({ where: { id: view.id }, data: parsed.data, include: widgetInclude });
  res.json(updated);
});

viewsRouter.delete('/:id', authenticate, async (req, res) => {
  const view = await prisma.view.findUnique({ where: { id: req.params.id } });
  if (!view) return res.status(404).json({ error: 'View not found' });
  if (!canManage(view, req.user)) return res.status(403).json({ error: 'Not allowed to delete this view' });

  await prisma.view.delete({ where: { id: view.id } });
  res.status(204).end();
});

const widgetsSchema = z.array(
  z.object({
    type: z.enum(['KPI', 'LINE_CHART', 'BAR_CHART', 'TABLE']),
    title: z.string().optional(),
    config: z.record(z.any()).optional(),
    indicatorIds: z.array(z.string()).min(1),
  })
);

viewsRouter.put('/:id/widgets', authenticate, async (req, res) => {
  const view = await prisma.view.findUnique({ where: { id: req.params.id } });
  if (!view) return res.status(404).json({ error: 'View not found' });
  if (!canManage(view, req.user)) return res.status(403).json({ error: 'Not allowed to edit this view' });

  const parsed = widgetsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await prisma.$transaction(async (tx) => {
    await tx.viewWidget.deleteMany({ where: { viewId: view.id } });
    for (const [index, widget] of parsed.data.entries()) {
      await tx.viewWidget.create({
        data: {
          viewId: view.id,
          order: index,
          type: widget.type,
          title: widget.title,
          config: widget.config ?? {},
          indicators: {
            create: widget.indicatorIds.map((indicatorId, i) => ({ indicatorId, order: i })),
          },
        },
      });
    }
  });

  const updated = await prisma.view.findUnique({ where: { id: view.id }, include: widgetInclude });
  res.json(updated);
});
