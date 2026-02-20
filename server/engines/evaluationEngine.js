/**
 * Evaluation Engine — Server
 * MCQ auto-grade + simulated rubric-based subjective scoring.
 */

/** Score a single MCQ question. */
function scoreMCQ(question, selectedIndex) {
  const correct = selectedIndex === question.correct;
  return {
    questionId: question.id,
    type: 'MCQ',
    correct,
    score: correct ? 1 : 0,
    maxScore: 1,
    confidence: 1.0,
    feedback: correct
      ? 'Correct! Well done.'
      : `Incorrect. The correct answer was: "${question.options[question.correct]}".`,
    needsReview: false,
  };
}

/**
 * Score a subjective question.
 * Production: DeBERTa-v3 semantic similarity + GPT-4o rubric evaluator.
 */
function scoreSubjective(question, studentAnswer) {
  const maxTotal = question.rubric.reduce((s, r) => s + r.maxScore, 0);

  if (!studentAnswer || studentAnswer.trim().length < 10) {
    return {
      questionId: question.id,
      type: 'Subjective',
      correct: false,
      score: 0,
      maxScore: maxTotal,
      confidence: 0.95,
      rubricScores: question.rubric.map(r => ({
        criterion: r.criterion, awarded: 0, max: r.maxScore, feedback: 'No answer provided.',
      })),
      feedback: 'No substantive answer provided.',
      needsReview: false,
      model: 'DeBERTa-v3 + GPT-4o Rubric Evaluator (simulated)',
    };
  }

  const wordCount = studentAnswer.trim().split(/\s+/).length;

  const rubricScores = question.rubric.map(r => {
    const baseRatio = Math.min(1, wordCount / 80);
    const ratio = Math.max(0, Math.min(1, baseRatio + (Math.random() - 0.3) * 0.4));
    const awarded = Math.min(r.maxScore, Math.round(r.maxScore * ratio * 10) / 10);
    return {
      criterion: r.criterion,
      awarded,
      max: r.maxScore,
      feedback: awarded >= r.maxScore * 0.7
        ? `Good coverage of "${r.criterion}".`
        : `Partial credit: "${r.criterion}" could be elaborated further.`,
    };
  });

  const totalScore = +rubricScores.reduce((s, r) => s + r.awarded, 0).toFixed(1);
  const confidence = +(0.72 + Math.random() * 0.2).toFixed(2);

  return {
    questionId: question.id,
    type: 'Subjective',
    correct: totalScore >= maxTotal * 0.6,
    score: totalScore,
    maxScore: maxTotal,
    confidence,
    rubricScores,
    feedback: totalScore >= maxTotal * 0.8
      ? 'Excellent response with strong coverage of all rubric criteria.'
      : totalScore >= maxTotal * 0.5
        ? 'Good attempt. Some criteria need more depth.'
        : 'Partial credit awarded. Review the rubric criteria for improvement.',
    needsReview: confidence < 0.8,
    model: 'DeBERTa-v3 + GPT-4o Rubric Evaluator (simulated)',
  };
}

/** Evaluate a full exam — returns aggregated results + Bloom performance. */
function evaluateExam(questions, answers) {
  const results = [];
  let totalScore = 0, totalMax = 0;
  const bloomScores = {}, bloomMax = {};

  for (const q of questions) {
    const ans = answers[q.id];
    const result = q.type === 'MCQ'
      ? scoreMCQ(q, ans !== undefined ? ans : -1)
      : scoreSubjective(q, ans || '');

    result.question = q;
    results.push(result);
    totalScore += result.score;
    totalMax += result.maxScore;
    bloomScores[q.bloom] = (bloomScores[q.bloom] || 0) + result.score;
    bloomMax[q.bloom] = (bloomMax[q.bloom] || 0) + result.maxScore;
  }

  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A'
    : percentage >= 70 ? 'B' : percentage >= 60 ? 'C'
      : percentage >= 50 ? 'D' : 'F';

  const bloomPerformance = {};
  for (const b of Object.keys(bloomScores)) {
    bloomPerformance[b] = bloomMax[b] > 0
      ? Math.round((bloomScores[b] / bloomMax[b]) * 100) : 0;
  }

  return {
    results,
    totalScore: +totalScore.toFixed(1),
    totalMax,
    percentage,
    grade,
    bloomPerformance,
    flaggedForReview: results.filter(r => r.needsReview).length,
    correctCount: results.filter(r => r.correct).length,
    wrongCount: results.filter(r => !r.correct).length,
  };
}

export { scoreMCQ, scoreSubjective, evaluateExam };
