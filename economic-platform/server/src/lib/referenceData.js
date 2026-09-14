import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

// DU-04: Source and Unit are structurally identical reference-data entities —
// full CRUD, soft-deactivate (never hard-delete, to preserve history on past
// data), and merge (for cleaning up duplicates while keeping historical
// attribution intact). This factory builds one router for either.
export function makeReferenceDataRouter({ modelName, linkModelName, fkField, extraShape, hasPrimary }) {
  const router = Router();
  const model = prisma[modelName];
  const linkModel = prisma[linkModelName];

  router.get('/', async (req, res) => {
    const where = req.query.includeInactive === 'true' ? {} : { active: true };
    const items = await model.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { indicators: true } } },
    });
    res.json(items);
  });

  const createSchema = z.object({ name: z.string().min(1), ...extraShape });

  router.post('/', authenticate, requireRole('EDITOR'), async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
      const item = await model.create({ data: parsed.data });
      res.status(201).json(item);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Name already in use' });
      throw err;
    }
  });

  router.put('/:id', authenticate, requireRole('EDITOR'), async (req, res) => {
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    try {
      const item = await model.update({ where: { id: req.params.id }, data: parsed.data });
      res.json(item);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Name already in use' });
      res.status(404).json({ error: 'Not found' });
    }
  });

  router.post('/:id/deactivate', authenticate, requireRole('ADMIN'), async (req, res) => {
    try {
      const item = await model.update({ where: { id: req.params.id }, data: { active: false } });
      res.json(item);
    } catch {
      res.status(404).json({ error: 'Not found' });
    }
  });

  router.post('/:id/reactivate', authenticate, requireRole('ADMIN'), async (req, res) => {
    try {
      const item = await model.update({ where: { id: req.params.id }, data: { active: true } });
      res.json(item);
    } catch {
      res.status(404).json({ error: 'Not found' });
    }
  });

  const mergeSchema = z.object({ intoId: z.string().min(1) });

  router.post('/:id/merge', authenticate, requireRole('ADMIN'), async (req, res) => {
    const parsed = mergeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const fromId = req.params.id;
    const { intoId } = parsed.data;
    if (fromId === intoId) return res.status(400).json({ error: 'Cannot merge an item into itself' });

    const [from, into] = await Promise.all([
      model.findUnique({ where: { id: fromId } }),
      model.findUnique({ where: { id: intoId } }),
    ]);
    if (!from || !into) return res.status(404).json({ error: 'Not found' });

    await prisma.$transaction(async (tx) => {
      const links = await tx[linkModelName].findMany({ where: { [fkField]: fromId } });
      for (const link of links) {
        const clash = await tx[linkModelName].findFirst({
          where: { indicatorId: link.indicatorId, [fkField]: intoId },
        });
        if (clash) {
          if (hasPrimary && link.isPrimary && !clash.isPrimary) {
            await tx[linkModelName].update({ where: { id: clash.id }, data: { isPrimary: true } });
          }
          await tx[linkModelName].delete({ where: { id: link.id } });
        } else {
          await tx[linkModelName].update({ where: { id: link.id }, data: { [fkField]: intoId } });
        }
      }
      await tx[modelName].update({ where: { id: fromId }, data: { active: false, mergedIntoId: intoId } });
    });

    const updated = await model.findUnique({ where: { id: fromId } });
    res.json(updated);
  });

  return router;
}
