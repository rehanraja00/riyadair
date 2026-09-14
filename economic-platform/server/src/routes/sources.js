import { z } from 'zod';
import { makeReferenceDataRouter } from '../lib/referenceData.js';

export const sourcesRouter = makeReferenceDataRouter({
  modelName: 'source',
  linkModelName: 'indicatorSource',
  fkField: 'sourceId',
  hasPrimary: false,
  extraShape: { url: z.string().url().optional().or(z.literal('')) },
});
