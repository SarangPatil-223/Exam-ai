/**
 * Questions API — /api/questions
 * GET    /             list all (with optional ?subject=&bloom=&difficulty=)
 * GET    /:id          single question
 * POST   /             add question
 * DELETE /:id          remove question
 */
import { Router } from 'express';
import questionBank from '../data/questionBank.js';

const router = Router();

// In-memory mutable copy (resets on server restart — acceptable for prototype)
let questions = [...questionBank];

// GET /api/questions
router.get('/', (req, res) => {
  const { subject, bloom, difficulty, type } = req.query;
  let result = [...questions];
  if (subject) result = result.filter(q => q.subject === subject);
  if (bloom) result = result.filter(q => q.bloom === bloom);
  if (difficulty) result = result.filter(q => q.difficulty === difficulty);
  if (type) result = result.filter(q => q.type === type);
  res.json({ data: result, total: result.length });
});

// GET /api/questions/:id
router.get('/:id', (req, res) => {
  const q = questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  res.json(q);
});

// POST /api/questions
router.post('/', (req, res) => {
  const { subject, topic, text, type, bloom, difficulty } = req.body;
  if (!subject || !text || !type) {
    return res.status(400).json({ error: 'subject, text, and type are required' });
  }
  const newQ = {
    id: 'q' + Date.now(),
    subject, topic: topic || 'General',
    text, type, bloom: bloom || 'Remember',
    difficulty: difficulty || 'Medium',
    irt: { a: 1.0, b: 0.0, c: type === 'MCQ' ? 0.25 : 0.0 },
    options: type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
    correct: type === 'MCQ' ? 0 : undefined,
    rubric: type === 'Subjective'
      ? [{ criterion: 'Default criterion', maxScore: 10 }]
      : undefined,
    tags: req.body.tags || [],
  };
  questions.push(newQ);
  res.status(201).json(newQ);
});

// DELETE /api/questions/:id
router.delete('/:id', (req, res) => {
  const idx = questions.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Question not found' });
  questions.splice(idx, 1);
  res.json({ success: true });
});

export default router;
