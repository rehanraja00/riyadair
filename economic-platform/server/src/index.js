import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { indicatorsRouter } from './routes/indicators.js';
import { viewsRouter } from './routes/views.js';
import { sectionsRouter } from './routes/sections.js';
import { sourcesRouter } from './routes/sources.js';
import { unitsRouter } from './routes/units.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/indicators', indicatorsRouter);
app.use('/api/views', viewsRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/units', unitsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`economic-platform API listening on :${port}`);
});
