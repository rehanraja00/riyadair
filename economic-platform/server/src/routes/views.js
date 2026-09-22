import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { latestForecasts } from '../lib/forecast.js';

export const viewsRouter = Router();

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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
// to know about the versioning scheme.
function resolveForecasts(view) {
  for (const widget of view.widgets) {
    for (const wi of widget.indicators) {
      wi.indicator.forecasts = latestForecasts(wi.indicator.forecasts);
    }
  }
  return view;
}

// The list only shows published pages so drafts don't clutter the main
// listing; a draft is still reachable directly by its slug.
viewsRouter.get('/', async (_req, res) => {
  const views = await prisma.view.findMany({
    where: { published: true },
    orderBy: { updatedAt: 'desc' },
    include: { section: true, _count: { select: { widgets: true } } },
  });
  res.json(views);
});

viewsRouter.get('/:slug', async (req, res) => {
  const view = await prisma.view.findUnique({
    where: { slug: req.params.slug },
    include: { section: true, ...widgetInclude },
  });
  if (!view) return res.status(404).json({ error: 'View not found' });
  res.json(resolveForecasts(view));
});

const viewSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  published: z.boolean().optional(),
  sectionId: z.string().nullable().optional(),
  layoutTemplate: z.enum(['ONE_COL', 'TWO_COL', 'GRID']).optional(),
  gridColumns: z.number().int().min(1).max(12).optional(),
});

viewsRouter.post('/', async (req, res) => {
  const parsed = viewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, ...rest } = parsed.data;
  let slug = slugify(title);
  const clash = await prisma.view.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const view = await prisma.view.create({
    data: { title, ...rest, slug },
    include: widgetInclude,
  });
  res.status(201).json(view);
});

viewsRouter.put('/:id', async (req, res) => {
  const parsed = viewSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await prisma.view.update({ where: { id: req.params.id }, data: parsed.data, include: widgetInclude });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'View not found' });
  }
});

viewsRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.view.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'View not found' });
  }
});

// Widgets can carry a collage grid position; a CONTENT (free-form) widget
// type doesn't reference any indicator.
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

viewsRouter.put('/:id/widgets', async (req, res) => {
  const view = await prisma.view.findUnique({ where: { id: req.params.id } });
  if (!view) return res.status(404).json({ error: 'View not found' });

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
