import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const indicatorsRouter = Router();

indicatorsRouter.get('/', async (req, res) => {
  const { category, search } = req.query;

  const where = {};
  if (category) where.category = { slug: category };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const indicators = await prisma.indicator.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      category: true,
      _count: { select: { dataPoints: true } },
    },
  });
  res.json(indicators);
});

indicatorsRouter.get('/:id', async (req, res) => {
  const indicator = await prisma.indicator.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      dataPoints: { orderBy: { period: 'asc' } },
    },
  });
  if (!indicator) return res.status(404).json({ error: 'Indicator not found' });
  res.json(indicator);
});

const indicatorSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  categoryId: z.string().min(1),
});

indicatorsRouter.post('/', authenticate, requireRole('EDITOR'), async (req, res) => {
  const parsed = indicatorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = { ...parsed.data, createdById: req.user.id };
  if (data.sourceUrl === '') delete data.sourceUrl;

  try {
    const indicator = await prisma.indicator.create({ data });
    res.status(201).json(indicator);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Indicator code already exists' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Unknown categoryId' });
    }
    throw err;
  }
});

indicatorsRouter.put('/:id', authenticate, requireRole('EDITOR'), async (req, res) => {
  const parsed = indicatorSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = { ...parsed.data };
  if (data.sourceUrl === '') delete data.sourceUrl;

  try {
    const indicator = await prisma.indicator.update({ where: { id: req.params.id }, data });
    res.json(indicator);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Indicator code already exists' });
    }
    res.status(404).json({ error: 'Indicator not found' });
  }
});

indicatorsRouter.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.indicator.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Indicator not found' });
  }
});

const dataPointSchema = z.object({
  period: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  value: z.number(),
  notes: z.string().optional(),
});

const bulkDataPointsSchema = z.union([dataPointSchema, z.array(dataPointSchema)]);

indicatorsRouter.post('/:id/datapoints', authenticate, requireRole('EDITOR'), async (req, res) => {
  const parsed = bulkDataPointsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const points = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const indicatorId = req.params.id;

  const indicator = await prisma.indicator.findUnique({ where: { id: indicatorId } });
  if (!indicator) return res.status(404).json({ error: 'Indicator not found' });

  const results = await prisma.$transaction(
    points.map((p) =>
      prisma.indicatorDataPoint.upsert({
        where: { indicatorId_period: { indicatorId, period: new Date(p.period) } },
        update: { value: p.value, notes: p.notes },
        create: { indicatorId, period: new Date(p.period), value: p.value, notes: p.notes },
      })
    )
  );

  res.status(201).json(results);
});

indicatorsRouter.delete('/:id/datapoints/:pointId', authenticate, requireRole('EDITOR'), async (req, res) => {
  try {
    await prisma.indicatorDataPoint.delete({ where: { id: req.params.pointId } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Data point not found' });
  }
});
