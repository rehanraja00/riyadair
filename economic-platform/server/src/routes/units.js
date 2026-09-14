import { z } from 'zod';
import { makeReferenceDataRouter } from '../lib/referenceData.js';

export const unitsRouter = makeReferenceDataRouter({
  modelName: 'unit',
  linkModelName: 'indicatorUnit',
  fkField: 'unitId',
  hasPrimary: true,
  extraShape: { symbol: z.string().optional() },
});
