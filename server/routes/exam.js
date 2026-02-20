/**
 * Exam API — /api/exam
 * POST /generate   — build an exam config from constraints
 * POST /evaluate   — score a submitted exam
 * POST /adaptive/next   — select next adaptive question
 * POST /adaptive/theta  — estimate current theta from responses
 */
import { Router } from 'express';
import questionBank from '../data/questionBank.js';
import { evaluateExam } from '../engines/evaluationEngine.js';
import { estimateTheta, computeSE, selectNextQuestion } from '../engines/adaptiveEngine.js';

const router = Router();

// POST /api/exam/generate
router.post('/generate', (req, res) => {
  const { subject, count = 10, easyPct = 30, mediumPct = 50, hardPct = 20, type } = req.body;

  let pool = [...questionBank];
  if (subject) pool = pool.filter(q => q.subject === subject);
  if (type) pool = pool.filter(q => q.type === type);

  // Separate by difficulty
  const easy = pool.filter(q => q.difficulty === 'Easy');
  const medium = pool.filter(q => q.difficulty === 'Medium');
  const hard = pool.filter(q => q.difficulty === 'Hard');

  const nEasy = Math.round(count * easyPct / 100);
  const nMedium = Math.round(count * mediumPct / 100);
  const nHard = count - nEasy - nMedium;

  const sample = (arr, n) => arr.sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));

  const selected = [
    ...sample(easy, nEasy),
    ...sample(medium, nMedium),
    ...sample(hard, nHard),
  ];

  if (!selected.length) return res.status(400).json({ error: 'No questions match the given criteria' });

  // Strip answer info before sending to client
  const sanitized = selected.map(({ id, subject, topic, text, type, bloom, difficulty, options, rubric, irt }) => ({
    id, subject, topic, text, type, bloom, difficulty,
    options: options ?? null,
    rubric: rubric ?? null,
    irt,
  }));

  res.json({ questions: sanitized, total: sanitized.length });
});

// POST /api/exam/evaluate
router.post('/evaluate', (req, res) => {
  const { questionIds, answers, thetaHistory } = req.body;

  if (!questionIds || !answers) {
    return res.status(400).json({ error: 'questionIds and answers are required' });
  }

  // Hydrate full question objects (with correct answers) from bank
  const questions = questionIds.map(id => questionBank.find(q => q.id === id)).filter(Boolean);
  if (!questions.length) return res.status(400).json({ error: 'No valid questions found' });

  const evaluation = evaluateExam(questions, answers);

  // Include theta trajectory stats
  const finalTheta = thetaHistory?.length ? thetaHistory[thetaHistory.length - 1] : 0;

  res.json({
    ...evaluation,
    finalTheta,
    thetaHistory: thetaHistory ?? [],
  });
});

// POST /api/exam/adaptive/theta — estimate theta from current responses
router.post('/adaptive/theta', (req, res) => {
  const { responses, currentTheta = 0 } = req.body;
  if (!Array.isArray(responses)) return res.status(400).json({ error: 'responses must be an array' });

  const theta = estimateTheta(responses, currentTheta);
  const se = computeSE(theta, responses);
  res.json({ theta, se });
});

// POST /api/exam/adaptive/next — select next question given administered IDs + theta
router.post('/adaptive/next', (req, res) => {
  const { administeredIds = [], theta = 0, subject } = req.body;

  let pool = questionBank.filter(q => !administeredIds.includes(q.id));
  if (subject) pool = pool.filter(q => q.subject === subject);

  if (!pool.length) return res.json({ question: null, done: true });

  const next = selectNextQuestion(pool, theta);
  const { id, subject: sub, topic, text, type, bloom, difficulty, options, rubric, irt } = next;
  res.json({
    question: { id, subject: sub, topic, text, type, bloom, difficulty, options: options ?? null, rubric: rubric ?? null, irt },
    done: false,
  });
});

export default router;
