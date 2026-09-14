import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { latestForecasts } from '../lib/forecast.js';

export const viewsRouter = Router();

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function visibilityWhere(user) {
  if (!user) return { visibility: 'PUBLIC', published: true };
  if (user.role === 'ADMIN') return {};
  return {
    AND: [
      { OR: [{ visibility: 'PUBLIC' }, { visibility: 'SHARED' }, { ownerId: user.id }] },
      { OR: [{ published: true }, { ownerId: user.id }] },
    ],
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
        include: {
          indicator: {
            include: {
              dataPoints: { orderBy: { period: 'asc' } },
              units: { include: { unit: true }, orderBy: { isPrimary: 'desc' } },
              targets: { orderBy: { period: 'asc' } },
              forecasts: { orderBy: [{ period: 'asc' }, { version: 'asc' }] },
              baselines: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
    },
  },
};

// Flattens forecasts to their latest version so widget renderers don't need
// to know about DU-10's versioning scheme.
function resolveForecasts(view) {
  for (const widget of view.widgets) {
    for (const wi of widget.indicators) {
      wi.indicator.forecasts = latestForecasts(wi.indicator.forecasts);
    }
  }
  return view;
}

viewsRouter.get('/', optionalAuthenticate, async (req, res) => {
  const views = await prisma.view.findMany({
    where: visibilityWhere(req.user),
    orderBy: { updatedAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true } },
      section: true,
      _count: { select: { widgets: true } },
    },
  });
  res.json(views);
});

viewsRouter.get('/:slug', optionalAuthenticate, async (req, res) => {
  const view = await prisma.view.findUnique({
    where: { slug: req.params.slug },
    include: { owner: { select: { id: true, name: true } }, section: true, ...widgetInclude },
  });
  if (!view) return res.status(404).json({ error: 'View not found' });

  const manageable = canManage(view, req.user);
  const visible =
    manageable ||
    (view.published &&
      (view.visibility === 'PUBLIC' || (req.user && (view.visibility === 'SHARED' || req.user.role === 'ADMIN'))));
  if (!visible) return res.status(404).json({ error: 'View not found' });

  res.json({ ...resolveForecasts(view), canManage: manageable });
});

const viewSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'SHARED', 'PUBLIC']).optional(),
  published: z.boolean().optional(),
  sectionId: z.string().nullable().optional(),
  layoutTemplate: z.enum(['ONE_COL', 'TWO_COL', 'GRID']).optional(),
  gridColumns: z.number().int().min(1).max(12).optional(),
});

// DU-01: page creation is EDITOR+.
viewsRouter.post('/', authenticate, requireRole('EDITOR'), async (req, res) => {
  const parsed = viewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, ...rest } = parsed.data;
  let slug = slugify(title);
  const clash = await prisma.view.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const view = await prisma.view.create({
    data: { title, ...rest, visibility: rest.visibility || 'PRIVATE', slug, ownerId: req.user.id },
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

// DU-02: widgets can carry a collage grid position; DU-01 adds a CONTENT
// (free-form) widget type that doesn't reference any indicator.
const widgetsSchema = z
  .array(
    z.object({
      type: z.enum(['KPI', 'LINE_CHART', 'BAR_CHART', 'TABLE', 'CONTENT']),
      title: z.string().optional(),
      config: z.record(z.any()).optional(),
      contentHtml: z.string().optional(),
      indicatorIds: z.array(z.string()).optional(),
      columnStart: z.number().int().min(1).optional(),
      columnSpan: z.number().int().min(1).optional(),
      rowStart: z.number().int().min(1).optional(),
      rowSpan: z.number().int().min(1).optional(),
    })
  )
  .superRefine((widgets, ctx) => {
    widgets.forEach((w, i) => {
      if (w.type === 'CONTENT') return;
      if (!w.indicatorIds || w.indicatorIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'indicatorIds is required for non-CONTENT widgets',
          path: [i, 'indicatorIds'],
        });
      }
    });
  });

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
          contentHtml: widget.type === 'CONTENT' ? widget.contentHtml : undefined,
          columnStart: widget.columnStart,
          columnSpan: widget.columnSpan ?? 1,
          rowStart: widget.rowStart,
          rowSpan: widget.rowSpan ?? 1,
          indicators:
            widget.type === 'CONTENT'
              ? undefined
              : { create: widget.indicatorIds.map((indicatorId, i) => ({ indicatorId, order: i })) },
        },
      });
    }
  });

  const updated = await prisma.view.findUnique({ where: { id: view.id }, include: widgetInclude });
  res.json(resolveForecasts(updated));
});
