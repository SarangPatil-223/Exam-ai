/**
 * Adaptive Testing Engine — Client (browser)
 * Mirrors the server engine for live θ UI updates without a round-trip.
 */

export function irt3PL(theta, a, b, c) {
  return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

export function fisherInfo(theta, a, b, c) {
  const P = irt3PL(theta, a, b, c);
  const Q = 1 - P;
  if (P <= 0 || Q <= 0) return 0;
  return (a * a * Math.pow(P - c, 2)) / (Math.pow(1 - c, 2) * P * Q);
}

export function estimateTheta(responses, currentTheta = 0) {
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
