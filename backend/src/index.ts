import 'dotenv/config';

// Use HTTPS_PROXY/HTTP_PROXY for fetch (Gemini API) when set
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  const { setGlobalDispatcher, EnvHttpProxyAgent } = await import('undici');
  setGlobalDispatcher(new EnvHttpProxyAgent());
}

import express from 'express';
import { connectDB } from './lib/mongodb.js';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { customersRouter } from './routes/customers.js';
import { interactionsRouter } from './routes/interactions.js';
import { schedulesRouter } from './routes/schedules.js';
import { coursePlansRouter } from './routes/coursePlans.js';
import { aiRouter } from './routes/ai.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/course-plans', coursePlansRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
