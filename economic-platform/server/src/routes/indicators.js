import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { latestForecasts } from '../lib/forecast.js';

export const indicatorsRouter = Router();

const detailInclude = {
  category: true,
  dataPoints: { orderBy: { period: 'asc' } },
  units: { include: { unit: true }, orderBy: { isPrimary: 'desc' } },
  sources: { include: { source: true } },
  targets: { orderBy: { period: 'asc' } },
  forecasts: { orderBy: [{ period: 'asc' }, { version: 'asc' }] },
  baselines: { orderBy: { createdAt: 'desc' } },
};

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
      units: { include: { unit: true }, orderBy: { isPrimary: 'desc' } },
      baselines: { select: { id: true, label: true, active: true } },
      _count: { select: { dataPoints: true } },
    },
  });
  res.json(indicators);
});

indicatorsRouter.get('/:id', async (req, res) => {
  const indicator = await prisma.indicator.findUnique({ where: { id: req.params.id }, include: detailInclude });
  if (!indicator) return res.status(404).json({ error: 'Indicator not found' });
  res.json({ ...indicator, forecasts: latestForecasts(indicator.forecasts) });
});

const unitLinkSchema = z.object({ unitId: z.string().min(1), isPrimary: z.boolean().optional() });
const sourceLinkSchema = z.object({ sourceId: z.string().min(1), note: z.string().optional() });

const indicatorSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  categoryId: z.string().min(1),
  longTermTargetLabel: z.string().optional(),
  longTermTargetValue: z.number().optional(),
  units: z.array(unitLinkSchema).min(1),
  sources: z.array(sourceLinkSchema).optional(),
});

async function replaceUnitsAndSources(tx, indicatorId, units, sources) {
  if (units) {
    await tx.indicatorUnit.deleteMany({ where: { indicatorId } });
    const hasPrimary = units.some((u) => u.isPrimary);
    await tx.indicatorUnit.createMany({
      data: units.map((u, i) => ({
        indicatorId,
        unitId: u.unitId,
        isPrimary: hasPrimary ? !!u.isPrimary : i === 0,
      })),
    });
  }
  if (sources) {
    await tx.indicatorSource.deleteMany({ where: { indicatorId } });
    if (sources.length > 0) {
      await tx.indicatorSource.createMany({
        data: sources.map((s) => ({ indicatorId, sourceId: s.sourceId, note: s.note })),
      });
    }
  }
}

indicatorsRouter.post('/', async (req, res) => {
  const parsed = indicatorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { units, sources, ...rest } = parsed.data;

  try {
    const indicator = await prisma.$transaction(async (tx) => {
      const created = await tx.indicator.create({ data: rest });
      await replaceUnitsAndSources(tx, created.id, units, sources);
      return tx.indicator.findUnique({ where: { id: created.id }, include: detailInclude });
    });
    res.status(201).json(indicator);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Indicator code already exists' });
    if (err.code === 'P2003') return res.status(400).json({ error: 'Unknown categoryId, unitId, or sourceId' });
    throw err;
  }
});

indicatorsRouter.put('/:id', async (req, res) => {
  const parsed = indicatorSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { units, sources, ...rest } = parsed.data;

  try {
    const indicator = await prisma.$transaction(async (tx) => {
      await tx.indicator.update({ where: { id: req.params.id }, data: rest });
      await replaceUnitsAndSources(tx, req.params.id, units, sources);
      return tx.indicator.findUnique({ where: { id: req.params.id }, include: detailInclude });
    });
    res.json(indicator);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Indicator code already exists' });
    res.status(404).json({ error: 'Indicator not found' });
  }
});

indicatorsRouter.delete('/:id', async (req, res) => {
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
const bulkPointsSchema = z.union([dataPointSchema, z.array(dataPointSchema)]);

indicatorsRouter.post('/:id/datapoints', async (req, res) => {
  const parsed = bulkPointsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
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

indicatorsRouter.delete('/:id/datapoints/:pointId', async (req, res) => {
  try {
    await prisma.indicatorDataPoint.delete({ where: { id: req.params.pointId } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Data point not found' });
  }
});

// Target interval entry — identical shape to data points.
indicatorsRouter.post('/:id/targets', async (req, res) => {
  const parsed = bulkPointsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const points = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const indicatorId = req.params.id;

  const indicator = await prisma.indicator.findUnique({ where: { id: indicatorId } });
  if (!indicator) return res.status(404).json({ error: 'Indicator not found' });

  const results = await prisma.$transaction(
    points.map((p) =>
      prisma.target.upsert({
        where: { indicatorId_period: { indicatorId, period: new Date(p.period) } },
        update: { value: p.value },
        create: { indicatorId, period: new Date(p.period), value: p.value },
      })
    )
  );
  res.status(201).json(results);
});

indicatorsRouter.delete('/:id/targets/:targetId', async (req, res) => {
  try {
    await prisma.target.delete({ where: { id: req.params.targetId } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Target not found' });
  }
});

// Rolling forecast — POST always adds a new version, never overwrites.
indicatorsRouter.post('/:id/forecasts', async (req, res) => {
  const parsed = bulkPointsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const points = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const indicatorId = req.params.id;

  const indicator = await prisma.indicator.findUnique({ where: { id: indicatorId } });
  if (!indicator) return res.status(404).json({ error: 'Indicator not found' });

  const latest = await prisma.forecast.findFirst({ where: { indicatorId }, orderBy: { version: 'desc' } });
  const version = (latest?.version ?? 0) + 1;

  const results = await prisma.$transaction(
    points.map((p) =>
      prisma.forecast.create({
        data: { indicatorId, period: new Date(p.period), value: p.value, version },
      })
    )
  );
  res.status(201).json(results);
});

// Baselines are created (or superseded), never edited in place.
const baselineSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  period: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  intervalType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  supersedesId: z.string().optional(),
});

indicatorsRouter.post('/:id/baselines', async (req, res) => {
  const parsed = baselineSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const indicatorId = req.params.id;
  const { supersedesId, ...rest } = parsed.data;

  const baseline = await prisma.$transaction(async (tx) => {
    if (supersedesId) {
      await tx.baseline.update({ where: { id: supersedesId }, data: { active: false } });
    }
    return tx.baseline.create({
      data: { ...rest, period: new Date(rest.period), indicatorId, supersedesId, active: true },
    });
  });
  res.status(201).json(baseline);
});

indicatorsRouter.post('/:id/baselines/:baselineId/activate', async (req, res) => {
  const indicatorId = req.params.id;
  const baseline = await prisma.baseline.findUnique({ where: { id: req.params.baselineId } });
  if (!baseline || baseline.indicatorId !== indicatorId) return res.status(404).json({ error: 'Baseline not found' });

  await prisma.$transaction([
    prisma.baseline.updateMany({ where: { indicatorId }, data: { active: false } }),
    prisma.baseline.update({ where: { id: baseline.id }, data: { active: true } }),
  ]);
  const updated = await prisma.baseline.findMany({ where: { indicatorId }, orderBy: { createdAt: 'desc' } });
  res.json(updated);
});
