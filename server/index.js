/**
 * NeuralExam — Express API Server
 * Runs on PORT 3001 by default.
 */
import express from 'express';
import cors from 'cors';
import questionsRouter from './routes/questions.js';
import examRouter from './routes/exam.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '2mb' }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/questions', questionsRouter);
app.use('/api/exam', examRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[NeuralExam Server]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🧠 NeuralExam API running → http://localhost:${PORT}\n`);
});
