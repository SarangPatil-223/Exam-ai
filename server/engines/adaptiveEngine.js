/**
 * Adaptive Testing Engine — Server
 * IRT 3-Parameter Logistic model with Fisher Information item selection.
 * Stateless: all session state is passed in / returned per request.
 */

/** P(θ) = c + (1-c) / (1 + exp(-a*(θ-b))) */
function irt3PL(theta, a, b, c) {
  return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

/** Fisher Information: I(θ) = a²*(P-c)² / ((1-c)²*P*Q) */
function fisherInfo(theta, a, b, c) {
  const P = irt3PL(theta, a, b, c);
  const Q = 1 - P;
  if (P <= 0 || Q <= 0) return 0;
  return (a * a * Math.pow(P - c, 2)) / (Math.pow(1 - c, 2) * P * Q);
}

/**
 * Newton-Raphson Maximum Likelihood Estimate of ability θ.
 * @param {Array<{a,b,c,correct}>} responses
 * @param {number} currentTheta
 */
function estimateTheta(responses, currentTheta = 0) {
  if (!responses.length) return 0;
  if (responses.every(r => r.correct)) return Math.min(3.0, currentTheta + 0.5);
  if (responses.every(r => !r.correct)) return Math.max(-3.0, currentTheta - 0.5);

  let theta = currentTheta;
  for (let i = 0; i < 50; i++) {
    let L1 = 0, L2 = 0;
    for (const r of responses) {
      const { a, b, c, correct } = r;
      const P = irt3PL(theta, a, b, c);
      const Q = 1 - P;
      const W = (P - c) / (1 - c);
      if (P <= 0 || Q <= 0) continue;
      L1 += ((correct ? 1 : 0) - P) * a * W / (P * Q + 1e-9);
      L2 -= a * a * W * W / (P * Q + 1e-9);
    }
    if (Math.abs(L2) < 1e-9) break;
    const delta = L1 / L2;
    theta = Math.max(-4, Math.min(4, theta - delta));
    if (Math.abs(delta) < 0.001) break;
  }
  return +theta.toFixed(4);
}

/** Standard Error: SE = 1 / sqrt(sum of Fisher Information) */
function computeSE(theta, responses) {
  if (!responses.length) return Infinity;
  const total = responses.reduce((s, r) => s + fisherInfo(theta, r.a, r.b, r.c), 0);
  return total > 0 ? +(1 / Math.sqrt(total)).toFixed(4) : Infinity;
}

/**
 * Select the next question that maximises Fisher Information at current θ.
 * @param {Array} questions - available (not-yet-administered) questions
 * @param {number} theta
 */
function selectNextQuestion(questions, theta) {
  let best = null, bestInfo = -Infinity;
  for (const q of questions) {
    const info = fisherInfo(theta, q.irt.a, q.irt.b, q.irt.c);
    if (info > bestInfo) { bestInfo = info; best = q; }
  }
  return best;
}

export { irt3PL, fisherInfo, estimateTheta, computeSE, selectNextQuestion };
