import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'rehanraja00@gmail.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

const CATEGORIES = [
  { name: 'Growth', description: 'Output and activity indicators' },
  { name: 'Prices', description: 'Inflation and price-level indicators' },
  { name: 'Labor', description: 'Employment and labor market indicators' },
  { name: 'Trade', description: 'External trade and balance-of-payments indicators' },
  { name: 'Monetary', description: 'Interest rates and monetary policy indicators' },
];

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Deterministic pseudo-random walk so re-running the seed is reproducible.
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Anchors the *last* point at the current month so range-filtered widgets
// (which filter relative to real time) always have recent data to show,
// regardless of when this seed script happens to be run.
function buildSeries({ count, stepMonths, base, drift, noise, seed }) {
  const rng = makeRng(seed);
  const points = [];
  let value = base;

  const end = new Date();
  end.setDate(1);
  end.setHours(0, 0, 0, 0);
  if (stepMonths === 3) {
    end.setMonth(Math.floor(end.getMonth() / 3) * 3);
  }

  const date = new Date(end);
  date.setMonth(date.getMonth() - stepMonths * (count - 1));

  for (let i = 0; i < count; i += 1) {
    value += drift + (rng() - 0.5) * noise;
    points.push({ period: new Date(date), value: Number(value.toFixed(2)) });
    date.setMonth(date.getMonth() + stepMonths);
  }
  return points;
}

async function upsertCategory(def) {
  const slug = slugify(def.name);
  return prisma.indicatorCategory.upsert({
    where: { slug },
    update: { description: def.description },
    create: { name: def.name, slug, description: def.description },
  });
}

async function upsertIndicator({ code, name, description, unit, frequency, source, sourceUrl, categoryId, createdById, series }) {
  const indicator = await prisma.indicator.upsert({
    where: { code },
    update: { name, description, unit, frequency, source, sourceUrl, categoryId },
    create: { code, name, description, unit, frequency, source, sourceUrl, categoryId, createdById },
  });

  await prisma.$transaction(
    series.map((point) =>
      prisma.indicatorDataPoint.upsert({
        where: { indicatorId_period: { indicatorId: indicator.id, period: point.period } },
        update: { value: point.value },
        create: { indicatorId: indicator.id, period: point.period, value: point.value },
      })
    )
  );

  return indicator;
}

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, name: 'Platform Admin', passwordHash, role: 'ADMIN' },
  });

  const categoryByName = {};
  for (const def of CATEGORIES) {
    categoryByName[def.name] = await upsertCategory(def);
  }

  const gdp = await upsertIndicator({
    code: 'GDP_GROWTH_SAU',
    name: 'Saudi Arabia GDP Growth (YoY)',
    description: 'Year-over-year real GDP growth rate.',
    unit: '%',
    frequency: 'QUARTERLY',
    source: 'Seed sample data — replace with GASTAT / IMF feed',
    sourceUrl: 'https://www.stats.gov.sa/',
    categoryId: categoryByName.Growth.id,
    createdById: admin.id,
    series: buildSeries({ count: 24, stepMonths: 3, base: 2.0, drift: 0.05, noise: 1.6, seed: 11 }),
  });

  const cpi = await upsertIndicator({
    code: 'CPI_INFLATION_SAU',
    name: 'Saudi Arabia CPI Inflation (YoY)',
    description: 'Year-over-year consumer price index inflation.',
    unit: '%',
    frequency: 'MONTHLY',
    source: 'Seed sample data — replace with GASTAT CPI release',
    sourceUrl: 'https://www.stats.gov.sa/',
    categoryId: categoryByName.Prices.id,
    createdById: admin.id,
    series: buildSeries({ count: 60, stepMonths: 1, base: 1.2, drift: 0.01, noise: 0.5, seed: 23 }),
  });

  const unemployment = await upsertIndicator({
    code: 'UNEMPLOYMENT_RATE_SAU',
    name: 'Saudi Arabia Unemployment Rate (Saudi Nationals)',
    description: 'Quarterly unemployment rate among Saudi nationals, seasonally unadjusted.',
    unit: '%',
    frequency: 'QUARTERLY',
    source: 'Seed sample data — replace with GASTAT Labor Force Survey',
    sourceUrl: 'https://www.stats.gov.sa/',
    categoryId: categoryByName.Labor.id,
    createdById: admin.id,
    series: buildSeries({ count: 24, stepMonths: 3, base: 12.0, drift: -0.12, noise: 0.6, seed: 37 }),
  });

  const policyRate = await upsertIndicator({
    code: 'POLICY_RATE_SAMA',
    name: 'SAMA Repo Rate',
    description: 'Saudi Central Bank (SAMA) policy repo rate.',
    unit: '%',
    frequency: 'MONTHLY',
    source: 'Seed sample data — replace with SAMA policy announcements',
    sourceUrl: 'https://www.sama.gov.sa/',
    categoryId: categoryByName.Monetary.id,
    createdById: admin.id,
    series: buildSeries({ count: 60, stepMonths: 1, base: 2.5, drift: 0.02, noise: 0.15, seed: 41 }),
  });

  const tradeBalance = await upsertIndicator({
    code: 'TRADE_BALANCE_SAU',
    name: 'Saudi Arabia Trade Balance',
    description: 'Monthly merchandise trade balance (exports minus imports).',
    unit: 'USD bn',
    frequency: 'MONTHLY',
    source: 'Seed sample data — replace with GASTAT foreign trade statistics',
    sourceUrl: 'https://www.stats.gov.sa/',
    categoryId: categoryByName.Trade.id,
    createdById: admin.id,
    series: buildSeries({ count: 60, stepMonths: 1, base: 8.0, drift: 0.03, noise: 2.2, seed: 53 }),
  });

  const existingView = await prisma.view.findUnique({ where: { slug: 'macro-overview' } });
  if (!existingView) {
    await prisma.view.create({
      data: {
        slug: 'macro-overview',
        title: 'Macro Overview',
        description: 'A starter dashboard covering growth, prices, labor, monetary and trade indicators.',
        visibility: 'PUBLIC',
        ownerId: admin.id,
        widgets: {
          create: [
            {
              order: 0,
              type: 'KPI',
              title: 'Latest GDP Growth',
              config: {},
              indicators: { create: [{ indicatorId: gdp.id, order: 0 }] },
            },
            {
              order: 1,
              type: 'KPI',
              title: 'Latest CPI Inflation',
              config: {},
              indicators: { create: [{ indicatorId: cpi.id, order: 0 }] },
            },
            {
              order: 2,
              type: 'KPI',
              title: 'Latest Policy Rate',
              config: {},
              indicators: { create: [{ indicatorId: policyRate.id, order: 0 }] },
            },
            {
              order: 3,
              type: 'LINE_CHART',
              title: 'GDP Growth vs Inflation',
              config: { rangeMonths: 36 },
              indicators: {
                create: [
                  { indicatorId: gdp.id, order: 0 },
                  { indicatorId: cpi.id, order: 1 },
                ],
              },
            },
            {
              order: 4,
              type: 'LINE_CHART',
              title: 'Unemployment Rate',
              config: { rangeMonths: 36 },
              indicators: { create: [{ indicatorId: unemployment.id, order: 0 }] },
            },
            {
              order: 5,
              type: 'BAR_CHART',
              title: 'Trade Balance',
              config: { rangeMonths: 24 },
              indicators: { create: [{ indicatorId: tradeBalance.id, order: 0 }] },
            },
          ],
        },
      },
    });
  }

  console.log('Seed complete.');
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (change this password immediately)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
