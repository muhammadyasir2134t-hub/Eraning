import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/auth';
import { apiRouter } from './server/api';
import { seedDatabaseIfEmpty } from './server/seed';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({
    origin: true,
    credentials: true,
  }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Earning Platform User API',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL Cloud SQL'
    });
  });

  // Authentication routes
  app.use('/api/auth', authRouter);

  // Authenticated user panel routes
  app.use('/api', apiRouter);

  // Seed database
  seedDatabaseIfEmpty().catch((err) => {
    console.error('Initial DB seeding encountered an issue:', err);
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
