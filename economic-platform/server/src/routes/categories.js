import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const categoriesRouter = Router();

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

categoriesRouter.get('/', async (_req, res) => {
  const categories = await prisma.indicatorCategory.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { indicators: true } } },
  });
  res.json(categories);
});

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

categoriesRouter.post('/', async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { name, description } = parsed.data;
  const slug = slugify(name);

  const existing = await prisma.indicatorCategory.findFirst({ where: { OR: [{ name }, { slug }] } });
  if (existing) {
    return res.status(409).json({ error: 'Category with that name already exists' });
  }

  const category = await prisma.indicatorCategory.create({ data: { name, slug, description } });
  res.status(201).json(category);
});

categoriesRouter.put('/:id', async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = { ...parsed.data };
  if (data.name) data.slug = slugify(data.name);

  try {
    const category = await prisma.indicatorCategory.update({ where: { id: req.params.id }, data });
    res.json(category);
  } catch {
    res.status(404).json({ error: 'Category not found' });
  }
});

categoriesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.indicatorCategory.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(409).json({ error: 'Category still has indicators assigned to it' });
    }
    res.status(404).json({ error: 'Category not found' });
  }
});
