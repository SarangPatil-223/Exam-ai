/**
 * Adaptive Testing Engine — NeuralExam
 * Implements IRT 3PL model with Fisher Information-based item selection.
 */

const AdaptiveEngine = (() => {

  // ─── IRT 3PL Model ──────────────────────────────────────────────────────────
  // P(θ) = c + (1-c) / (1 + exp(-a*(θ-b)))
  function irt3PL(theta, a, b, c) {
    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
  }

  // Fisher Information: I(θ) = a² * (P-c)² / ((1-c)² * P * Q)
  function fisherInfo(theta, a, b, c) {
    const P = irt3PL(theta, a, b, c);
    const Q = 1 - P;
    if (P <= 0 || Q <= 0) return 0;
    return (a * a * Math.pow(P - c, 2)) / (Math.pow(1 - c, 2) * P * Q);
  }

  // ─── State ───────────────────────────────────────────────────────────────────
  let state = {
    theta: 0.0,
    se: Infinity,
    responses: [],       // [{questionId, correct, a, b, c}]
    thetaHistory: [],
    seHistory: [],
    administeredIds: new Set(),
  };

  function reset() {
    state = { theta: 0.0, se: Infinity, responses: [], thetaHistory: [], seHistory: [], administeredIds: new Set() };
  }

  // ─── MLE Theta Estimation ────────────────────────────────────────────────────
  function estimateTheta(responses) {
    if (responses.length === 0) return 0.0;
    const allCorrect = responses.every(r => r.correct);
    const allWrong = responses.every(r => !r.correct);
    if (allCorrect) return Math.min(3.0, state.theta + 0.5);
    if (allWrong) return Math.max(-3.0, state.theta - 0.5);

    // Newton-Raphson MLE
    let theta = state.theta;
    for (let iter = 0; iter < 50; iter++) {
      let L1 = 0, L2 = 0;
      for (const r of responses) {
        const { a, b, c, correct } = r;
        const P = irt3PL(theta, a, b, c);
        const Q = 1 - P;
        const W = (P - c) / (1 - c);
        if (P <= 0 || Q <= 0) continue;
        const dP = a * (1 - c) * P * Q / (P - c + 1e-9) * W;
        const u = correct ? 1 : 0;
        L1 += (u - P) * a * W / (P * Q + 1e-9);
        L2 -= a * a * W * W / (P * Q + 1e-9);
      }
      if (Math.abs(L2) < 1e-9) break;
      const delta = L1 / L2;
      theta -= delta;
      theta = Math.max(-4, Math.min(4, theta));
      if (Math.abs(delta) < 0.001) break;
    }
    return theta;
  }

  // ─── Standard Error ──────────────────────────────────────────────────────────
  function computeSE(theta, responses) {
    if (responses.length === 0) return Infinity;
    let totalInfo = 0;
    for (const r of responses) {
      totalInfo += fisherInfo(theta, r.a, r.b, r.c);
    }
    return totalInfo > 0 ? 1 / Math.sqrt(totalInfo) : Infinity;
  }

  // ─── Item Selection ──────────────────────────────────────────────────────────
  function selectNextQuestion(questions, theta) {
    const available = questions.filter(q => !state.administeredIds.has(q.id));
    if (available.length === 0) return null;

    let best = null, bestInfo = -Infinity;
    for (const q of available) {
      const info = fisherInfo(theta, q.irt.a, q.irt.b, q.irt.c);
      if (info > bestInfo) { bestInfo = info; best = q; }
    }
    return best;
  }

  // ─── Record Response ─────────────────────────────────────────────────────────
  function recordResponse(question, isCorrect) {
    state.administeredIds.add(question.id);
    state.responses.push({
      questionId: question.id,
      correct: isCorrect,
      a: question.irt.a,
      b: question.irt.b,
      c: question.irt.c,
    });
    state.theta = estimateTheta(state.responses);
    state.se = computeSE(state.theta, state.responses);
    state.thetaHistory.push(+state.theta.toFixed(3));
    state.seHistory.push(+state.se.toFixed(3));
    return { theta: state.theta, se: state.se };
  }

  // ─── Confidence ──────────────────────────────────────────────────────────────
  function getConfidence() {
    if (state.se === Infinity) return 0;
    const conf = Math.max(0, Math.min(100, (1 - state.se / 2) * 100));
    return Math.round(conf);
  }

  function shouldTerminate(minItems = 5, maxSE = 0.35) {
    return state.responses.length >= minItems && state.se <= maxSE;
  }

  // ─── Fisher Info at current theta ────────────────────────────────────────────
  function getCurrentFisherInfo() {
    if (state.responses.length === 0) return 0;
    const last = state.responses[state.responses.length - 1];
    return fisherInfo(state.theta, last.a, last.b, last.c);
  }

  // ─── Public ──────────────────────────────────────────────────────────────────
  return {
    reset,
    selectNextQuestion,
    recordResponse,
    getConfidence,
    shouldTerminate,
    getCurrentFisherInfo,
    irt3PL,
    fisherInfo,
    getState: () => ({ ...state }),
    getTheta: () => state.theta,
    getSE: () => state.se,
    getThetaHistory: () => [...state.thetaHistory],
  };
})();
