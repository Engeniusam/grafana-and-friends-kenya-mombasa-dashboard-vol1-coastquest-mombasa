import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import attractionsRouter from './routes/attractions.js';
import healthRouter from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Security & proxy awareness for Cloud Run
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express.json());

// Basic security headers compatible with Tailwind CDN & Google Fonts
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health-check endpoint
app.use('/health', healthRouter);

// API routes backed by local JSON dataset
app.use('/api/attractions', attractionsRouter);

// Expose local JSON dataset directly as well if requested by client
app.get('/data/attractions.json', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'data/attractions.json'), (err) => {
    if (err) next(err);
  });
});

// Serve static frontend assets from /public
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  })
);

// Return 404 JSON for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA / index fallback for GET page requests
app.get('*', (req, res, next) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  console.error(`[CoastQuest Error] ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`CoastQuest Mombasa server listening on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown for Cloud Run SIGTERM
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
