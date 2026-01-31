import 'dotenv/config';

// Use HTTPS_PROXY/HTTP_PROXY for fetch (Gemini API) when set
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  const { setGlobalDispatcher, EnvHttpProxyAgent } = await import('undici');
  setGlobalDispatcher(new EnvHttpProxyAgent());
}

import express from 'express';
import { connectDB } from './lib/mongodb.js';
import cors from 'cors';
import { API_PREFIX, API_VERSION, API_RESOURCES } from './api/constants.js';
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

// REST API 统一前缀与入口
app.get(API_PREFIX, (_req, res) => {
  res.json({
    name: 'SaleSwift REST API',
    version: API_VERSION,
    basePath: API_PREFIX,
    resources: API_RESOURCES,
  });
});
app.get(`${API_PREFIX}/health`, (_req, res) => res.json({ ok: true }));

app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/customers`, customersRouter);
app.use(`${API_PREFIX}/interactions`, interactionsRouter);
app.use(`${API_PREFIX}/schedules`, schedulesRouter);
app.use(`${API_PREFIX}/course-plans`, coursePlansRouter);
app.use(`${API_PREFIX}/ai`, aiRouter);

// 处理 favicon 请求，避免 404
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// 未知 API 路径返回 JSON 404
app.use(API_PREFIX, (_req, res) => {
  res.status(404).json({ error: 'Not Found', path: API_PREFIX });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
