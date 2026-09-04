import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { lessonPlanRouter } from './routes/lessonPlanRoutes';
import { ragRouter } from './routes/ragRoutes';
import { ttsRouter } from './routes/ttsRoutes';
import { videoRouter } from './routes/videoRoutes';
import { chatRouter } from './routes/chatRoutes';
import { evaluationRouter } from './routes/evaluationRoutes';
import { translationRouter } from './routes/translationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  const method = req.method;
  const path = req.originalUrl || req.url;

  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${method} ${path} -> ${_res.statusCode} (${duration}ms)`);
  });

  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-teacher-backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular route handlers
app.use('/api/lesson-plan', lessonPlanRouter);
app.use('/api/rag', ragRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/video', videoRouter);
app.use('/api/chat', chatRouter);
app.use('/api/evaluation', evaluationRouter);
app.use('/api/translation', translationRouter);

// 404 handler for unmatched API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.',
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 AI Teacher Express Backend running at http://localhost:${PORT}`);
  console.log(`📡 Ready to accept requests on /api/*`);
});

export default app;
