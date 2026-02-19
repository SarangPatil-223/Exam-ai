/**
 * Evaluation Engine — NeuralExam
 * Automated scoring: MCQ auto-grade + simulated rubric-based subjective scoring.
 */

const EvaluationEngine = (() => {

  // ─── MCQ Scoring ─────────────────────────────────────────────────────────────
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

  // ─── Simulated Subjective Scoring ────────────────────────────────────────────
  // In production: DeBERTa-v3 semantic similarity + GPT-4o rubric evaluator
  function scoreSubjective(question, studentAnswer) {
    if (!studentAnswer || studentAnswer.trim().length < 10) {
      return {
        questionId: question.id,
        type: 'Subjective',
        correct: false,
        score: 0,
        maxScore: question.rubric.reduce((s, r) => s + r.maxScore, 0),
        confidence: 0.95,
        rubricScores: question.rubric.map(r => ({ criterion: r.criterion, awarded: 0, max: r.maxScore, feedback: 'No answer provided.' })),
        feedback: 'No substantive answer provided.',
        needsReview: false,
      };
    }

    const wordCount = studentAnswer.trim().split(/\s+/).length;
    const maxTotal = question.rubric.reduce((s, r) => s + r.maxScore, 0);

    // Simulate semantic scoring based on answer length and keyword presence
    const rubricScores = question.rubric.map(r => {
      const baseRatio = Math.min(1, wordCount / 80);
      const noise = (Math.random() - 0.3) * 0.4;
      const ratio = Math.max(0, Math.min(1, baseRatio + noise));
      const awarded = Math.round(r.maxScore * ratio * 10) / 10;
      return {
        criterion: r.criterion,
        awarded: Math.min(r.maxScore, awarded),
        max: r.maxScore,
        feedback: awarded >= r.maxScore * 0.7
          ? `Good coverage of "${r.criterion}".`
          : `Partial credit: "${r.criterion}" could be elaborated further.`,
      };
    });

    const totalScore = rubricScores.reduce((s, r) => s + r.awarded, 0);
    const confidence = 0.72 + Math.random() * 0.2;
    const needsReview = confidence < 0.8;

    return {
      questionId: question.id,
      type: 'Subjective',
      correct: totalScore >= maxTotal * 0.6,
      score: +totalScore.toFixed(1),
      maxScore: maxTotal,
      confidence: +confidence.toFixed(2),
      rubricScores,
      feedback: totalScore >= maxTotal * 0.8
        ? 'Excellent response with strong coverage of all rubric criteria.'
        : totalScore >= maxTotal * 0.5
          ? 'Good attempt. Some criteria need more depth.'
          : 'Partial credit awarded. Review the rubric criteria for improvement.',
      needsReview,
      model: 'DeBERTa-v3 + GPT-4o Rubric Evaluator (simulated)',
    };
  }

  // ─── Full Exam Evaluation ────────────────────────────────────────────────────
  function evaluateExam(questions, answers) {
    const results = [];
    let totalScore = 0, totalMax = 0;
    const bloomScores = {};
    const bloomMax = {};

    for (const q of questions) {
      const ans = answers[q.id];
      let result;
      if (q.type === 'MCQ') {
        result = scoreMCQ(q, ans !== undefined ? ans : -1);
      } else {
        result = scoreSubjective(q, ans || '');
      }
      result.question = q;
      results.push(result);
      totalScore += result.score;
      totalMax += result.maxScore;

      // Bloom aggregation
      if (!bloomScores[q.bloom]) { bloomScores[q.bloom] = 0; bloomMax[q.bloom] = 0; }
      bloomScores[q.bloom] += result.score;
      bloomMax[q.bloom] += result.maxScore;
    }

    const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

    const bloomPerformance = {};
    for (const b of Object.keys(bloomScores)) {
      bloomPerformance[b] = bloomMax[b] > 0 ? Math.round((bloomScores[b] / bloomMax[b]) * 100) : 0;
    }

    return {
      results,
      totalScore: +totalScore.toFixed(1),
      totalMax,
      percentage: pct,
      grade,
      bloomPerformance,
      flaggedForReview: results.filter(r => r.needsReview).length,
      correctCount: results.filter(r => r.correct).length,
      wrongCount: results.filter(r => !r.correct).length,
    };
  }

  return { scoreMCQ, scoreSubjective, evaluateExam };
})();
