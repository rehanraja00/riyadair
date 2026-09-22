import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const sectionsRouter = Router();

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

sectionsRouter.get('/', async (_req, res) => {
  const sections = await prisma.section.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { views: true } } },
  });
  res.json(sections);
});

const sectionSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional(),
});

sectionsRouter.post('/', async (req, res) => {
  const parsed = sectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, order } = parsed.data;
  const slug = slugify(name);
  const existing = await prisma.section.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ error: 'A section with that name already exists' });

  const section = await prisma.section.create({ data: { name, slug, order: order ?? 0 } });
  res.status(201).json(section);
});

sectionsRouter.put('/:id', async (req, res) => {
  const parsed = sectionSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = { ...parsed.data };
  if (data.name) data.slug = slugify(data.name);

  try {
    const section = await prisma.section.update({ where: { id: req.params.id }, data });
    res.json(section);
  } catch {
    res.status(404).json({ error: 'Section not found' });
  }
});

sectionsRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(409).json({ error: 'Section still has pages assigned to it' });
    }
    res.status(404).json({ error: 'Section not found' });
  }
});
