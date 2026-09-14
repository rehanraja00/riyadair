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

const UNITS = [
  { name: 'Percent', symbol: '%' },
  { name: 'USD Billion', symbol: 'USD bn' },
];

const SOURCES = [
  { name: 'GASTAT', url: 'https://www.stats.gov.sa/' },
  { name: 'SAMA', url: 'https://www.sama.gov.sa/' },
  { name: 'IMF', url: 'https://www.imf.org/' },
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
function buildSeries({ count, stepMonths, base, drift, noise, seed, startOffsetMonths = 0 }) {
  const rng = makeRng(seed);
  const points = [];
  let value = base;

  const end = new Date();
  end.setDate(1);
  end.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + startOffsetMonths);
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

async function upsertUnit(def) {
  return prisma.unit.upsert({
    where: { name: def.name },
    update: { symbol: def.symbol },
    create: def,
  });
}

async function upsertSource(def) {
  return prisma.source.upsert({
    where: { name: def.name },
    update: { url: def.url },
    create: def,
  });
}

async function upsertIndicator({
  code,
  name,
  description,
  frequency,
  categoryId,
  createdById,
  series,
  unitId,
  sourceId,
  sourceNote,
  longTermTargetLabel,
  longTermTargetValue,
}) {
  const indicator = await prisma.indicator.upsert({
    where: { code },
    update: { name, description, frequency, categoryId, longTermTargetLabel, longTermTargetValue },
    create: {
      code,
      name,
      description,
      frequency,
      categoryId,
      createdById,
      longTermTargetLabel,
      longTermTargetValue,
    },
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

  await prisma.indicatorUnit.upsert({
    where: { indicatorId_unitId: { indicatorId: indicator.id, unitId } },
    update: { isPrimary: true },
    create: { indicatorId: indicator.id, unitId, isPrimary: true },
  });

  await prisma.indicatorSource.upsert({
    where: { indicatorId_sourceId: { indicatorId: indicator.id, sourceId } },
    update: { note: sourceNote },
    create: { indicatorId: indicator.id, sourceId, note: sourceNote },
  });

  return indicator;
}

// Only one baseline per indicator is "active" (the default used when a
// widget doesn't pin a specific baseline) — the first one seeded per
// indicator wins, matching the single-active-baseline invariant the API enforces.
async function addBaseline(indicatorId, { label, value, period, intervalType }) {
  const existing = await prisma.baseline.findFirst({ where: { indicatorId, label } });
  if (existing) return existing;
  const hasActive = await prisma.baseline.findFirst({ where: { indicatorId, active: true } });
  return prisma.baseline.create({
    data: { indicatorId, label, value, period: new Date(period), intervalType, active: !hasActive },
  });
}

async function addTargets(indicatorId, points) {
  await prisma.$transaction(
    points.map((p) =>
      prisma.target.upsert({
        where: { indicatorId_period: { indicatorId, period: p.period } },
        update: { value: p.value },
        create: { indicatorId, period: p.period, value: p.value },
      })
    )
  );
}

async function addForecast(indicatorId, points, version) {
  await prisma.$transaction(
    points.map((p) =>
      prisma.forecast.upsert({
        where: { indicatorId_period_version: { indicatorId, period: p.period, version } },
        update: { value: p.value },
        create: { indicatorId, period: p.period, value: p.value, version },
      })
    )
  );
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

  const unitByName = {};
  for (const def of UNITS) {
    unitByName[def.name] = await upsertUnit(def);
  }

  const sourceByName = {};
  for (const def of SOURCES) {
    sourceByName[def.name] = await upsertSource(def);
  }

  const macroSection = await prisma.section.upsert({
    where: { slug: 'macro' },
    update: {},
    create: { name: 'Macro', slug: 'macro', order: 0 },
  });

  const gdp = await upsertIndicator({
    code: 'GDP_GROWTH_SAU',
    name: 'Saudi Arabia GDP Growth (YoY)',
    description: 'Year-over-year real GDP growth rate.',
    frequency: 'QUARTERLY',
    categoryId: categoryByName.Growth.id,
    createdById: admin.id,
    unitId: unitByName.Percent.id,
    sourceId: sourceByName.GASTAT.id,
    sourceNote: 'Primary',
    longTermTargetLabel: '2030 Target',
    longTermTargetValue: 6.5,
    series: buildSeries({ count: 24, stepMonths: 3, base: 2.0, drift: 0.05, noise: 1.6, seed: 11 }),
  });

  const cpi = await upsertIndicator({
    code: 'CPI_INFLATION_SAU',
    name: 'Saudi Arabia CPI Inflation (YoY)',
    description: 'Year-over-year consumer price index inflation.',
    frequency: 'MONTHLY',
    categoryId: categoryByName.Prices.id,
    createdById: admin.id,
    unitId: unitByName.Percent.id,
    sourceId: sourceByName.GASTAT.id,
    sourceNote: 'Primary',
    longTermTargetLabel: 'Medium-term inflation target',
    longTermTargetValue: 2.0,
    series: buildSeries({ count: 60, stepMonths: 1, base: 1.2, drift: 0.01, noise: 0.5, seed: 23 }),
  });
  // Illustrates DU-04's multi-source support: CPI also cross-referenced against IMF estimates.
  await prisma.indicatorSource.upsert({
    where: { indicatorId_sourceId: { indicatorId: cpi.id, sourceId: sourceByName.IMF.id } },
    update: {},
    create: { indicatorId: cpi.id, sourceId: sourceByName.IMF.id, note: 'Cross-check' },
  });

  const unemployment = await upsertIndicator({
    code: 'UNEMPLOYMENT_RATE_SAU',
    name: 'Saudi Arabia Unemployment Rate (Saudi Nationals)',
    description: 'Quarterly unemployment rate among Saudi nationals, seasonally unadjusted.',
    frequency: 'QUARTERLY',
    categoryId: categoryByName.Labor.id,
    createdById: admin.id,
    unitId: unitByName.Percent.id,
    sourceId: sourceByName.GASTAT.id,
    sourceNote: 'Primary',
    longTermTargetLabel: 'Vision 2030 target',
    longTermTargetValue: 7.0,
    series: buildSeries({ count: 24, stepMonths: 3, base: 12.0, drift: -0.12, noise: 0.6, seed: 37 }),
  });

  const policyRate = await upsertIndicator({
    code: 'POLICY_RATE_SAMA',
    name: 'SAMA Repo Rate',
    description: 'Saudi Central Bank (SAMA) policy repo rate.',
    frequency: 'MONTHLY',
    categoryId: categoryByName.Monetary.id,
    createdById: admin.id,
    unitId: unitByName.Percent.id,
    sourceId: sourceByName.SAMA.id,
    sourceNote: 'Primary',
    series: buildSeries({ count: 60, stepMonths: 1, base: 2.5, drift: 0.02, noise: 0.15, seed: 41 }),
  });

  const tradeBalance = await upsertIndicator({
    code: 'TRADE_BALANCE_SAU',
    name: 'Saudi Arabia Trade Balance',
    description: 'Monthly merchandise trade balance (exports minus imports).',
    frequency: 'MONTHLY',
    categoryId: categoryByName.Trade.id,
    createdById: admin.id,
    unitId: unitByName['USD Billion'].id,
    sourceId: sourceByName.GASTAT.id,
    sourceNote: 'Primary',
    series: buildSeries({ count: 60, stepMonths: 1, base: 8.0, drift: 0.03, noise: 2.2, seed: 53 }),
  });

  // DU-08: multiple, independently-dated baselines per indicator.
  await addBaseline(gdp.id, { label: '2019 Baseline', value: 2.15, period: '2019-01-01', intervalType: 'ANNUAL' });
  await addBaseline(gdp.id, { label: 'NDS-3 Programme Start', value: 3.4, period: '2023-01-01', intervalType: 'ANNUAL' });
  await addBaseline(cpi.id, { label: '2019 Baseline', value: 1.05, period: '2019-01-01', intervalType: 'ANNUAL' });
  await addBaseline(unemployment.id, { label: '2019 Baseline', value: 12.0, period: '2019-01-01', intervalType: 'ANNUAL' });
  await addBaseline(tradeBalance.id, { label: '2019 Baseline', value: 8.0, period: '2019-01-01', intervalType: 'ANNUAL' });

  // DU-10: interval targets for GDP and CPI (existing data periods, slightly above actuals).
  const gdpIndicator = await prisma.indicator.findUnique({ where: { id: gdp.id }, include: { dataPoints: true } });
  await addTargets(
    gdp.id,
    gdpIndicator.dataPoints.slice(-8).map((p) => ({ period: p.period, value: Number((p.value + 0.4).toFixed(2)) }))
  );

  const cpiIndicator = await prisma.indicator.findUnique({ where: { id: cpi.id }, include: { dataPoints: true } });
  await addTargets(
    cpi.id,
    cpiIndicator.dataPoints.slice(-8).map((p) => ({ period: p.period, value: Number((p.value - 0.2).toFixed(2)) }))
  );

  // DU-10: a rolling forecast (version 1) for the next few GDP periods, beyond the last actual.
  const forecastPoints = buildSeries({
    count: 4,
    stepMonths: 3,
    base: gdpIndicator.dataPoints[gdpIndicator.dataPoints.length - 1].value,
    drift: 0.15,
    noise: 0.3,
    seed: 71,
    startOffsetMonths: 12,
  });
  await addForecast(gdp.id, forecastPoints, 1);

  const existingView = await prisma.view.findUnique({ where: { slug: 'macro-overview' } });
  if (!existingView) {
    await prisma.view.create({
      data: {
        slug: 'macro-overview',
        title: 'Macro Overview',
        description: 'A starter dashboard covering growth, prices, labor, monetary and trade indicators.',
        visibility: 'PUBLIC',
        published: true,
        sectionId: macroSection.id,
        layoutTemplate: 'GRID',
        gridColumns: 4,
        ownerId: admin.id,
        widgets: {
          create: [
            {
              order: 0,
              type: 'CONTENT',
              title: null,
              contentHtml:
                '<p>Starter dashboard seeded by <strong>economic-platform</strong>, demonstrating the collage grid layout, growth-rate display modes, and free-form content blocks from the Dashboard &amp; UI Customisation BRD.</p>',
              config: {},
              columnStart: 1,
              columnSpan: 4,
              rowStart: 1,
              rowSpan: 1,
            },
            {
              order: 1,
              type: 'KPI',
              title: 'Latest GDP Growth',
              config: { growthModes: ['PREVIOUS', 'TARGET', 'BASELINE'], targetType: 'INTERVAL' },
              columnStart: 1,
              columnSpan: 1,
              rowStart: 2,
              rowSpan: 1,
              indicators: { create: [{ indicatorId: gdp.id, order: 0 }] },
            },
            {
              order: 2,
              type: 'KPI',
              title: 'Latest CPI Inflation',
              config: { growthModes: ['PREVIOUS', 'BASELINE'] },
              columnStart: 2,
              columnSpan: 1,
              rowStart: 2,
              rowSpan: 1,
              indicators: { create: [{ indicatorId: cpi.id, order: 0 }] },
            },
            {
              order: 3,
              type: 'KPI',
              title: 'Latest Policy Rate',
              config: { growthModes: ['PREVIOUS'] },
              columnStart: 3,
              columnSpan: 1,
              rowStart: 2,
              rowSpan: 1,
              indicators: { create: [{ indicatorId: policyRate.id, order: 0 }] },
            },
            {
              order: 4,
              type: 'LINE_CHART',
              title: 'GDP Growth vs Inflation',
              config: { rangeMonths: 36 },
              columnStart: 1,
              columnSpan: 2,
              rowStart: 3,
              rowSpan: 1,
              indicators: {
                create: [
                  { indicatorId: gdp.id, order: 0 },
                  { indicatorId: cpi.id, order: 1 },
                ],
              },
            },
            {
              order: 5,
              type: 'LINE_CHART',
              title: 'Unemployment Rate',
              config: { rangeMonths: 36 },
              columnStart: 3,
              columnSpan: 2,
              rowStart: 3,
              rowSpan: 1,
              indicators: { create: [{ indicatorId: unemployment.id, order: 0 }] },
            },
            {
              order: 6,
              type: 'BAR_CHART',
              title: 'Trade Balance',
              config: { rangeMonths: 24 },
              columnStart: 1,
              columnSpan: 4,
              rowStart: 4,
              rowSpan: 1,
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
