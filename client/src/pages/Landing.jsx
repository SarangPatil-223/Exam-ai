import { useRef, useCallback } from 'react';
import Spline from '@splinetool/react-spline';

/* ── Data ─────────────────────────────────────────────────────────────────── */

const FEATURES = [
  { title: 'Adaptive Testing Engine', emoji: '🧠', desc: "IRT 3PL model with Fisher Information maximisation. Estimates θ in real-time to select the optimal next question.", tags: ['IRT 3PL', 'EAP Estimation', 'CAT'], cls: 'card-glow-blue' },
  { title: 'AI Question Generation', emoji: '✨', desc: "Curriculum-aligned generation with Bloom's taxonomy tagging, parametrised variations, and difficulty calibration.", tags: ["Bloom's Taxonomy", 'RAG', 'GPT-4o'], cls: 'card-glow-purple' },
  { title: 'AI Proctoring', emoji: '🛡', desc: 'Multi-modal monitoring: facial recognition, gaze tracking, audio analysis, and behavior detection with 95% accuracy.', tags: ['ArcFace', 'MediaPipe', 'YOLOv8'], cls: 'card-glow-green' },
  { title: 'Automated Evaluation', emoji: '📋', desc: 'Hybrid scoring with DeBERTa-v3 semantic similarity, rubric-based partial credit, and GPT-4o rubric evaluation.', tags: ['DeBERTa-v3', 'Rubric AI', 'Partial Credit'], cls: 'card-glow-orange' },
  { title: 'Analytics Dashboard', emoji: '📊', desc: 'Item analysis, Bloom performance heatmaps, IRT parameter visualisation, and proctoring incident reports.', tags: ['Item Analysis', 'Psychometrics', 'Reports'], cls: 'card-glow-pink' },
  { title: 'Accessibility First', emoji: '♿', desc: 'TTS/STT support, ARIA compliance, adjustable timing multipliers, and screen reader optimisation built-in.', tags: ['WCAG 2.1 AA', 'TTS/STT', 'ARIA'], cls: 'card-glow-cyan' },
];

/* Performance — now a clean data table */
const PERF_ROWS = [
  { metric: 'Detection Accuracy', value: '95.4%', note: 'Facial presence & gaze combined' },
  { metric: 'False-Positive Rate', value: '<1%', note: 'Across 500k+ monitored sessions' },
  { metric: 'Adaptive Step Latency', value: '<150 ms', note: 'Median, P95 < 280 ms' },
  { metric: 'Platform Uptime', value: '99.97%', note: 'Rolling 12-month SLA' },
];

/* Technology Stack — now a clean column grid (no pill clouds) */
const STACK = {
  'AI / Evaluation': ['DeBERTa-v3', 'GPT-4o', 'LLaMA 3 70B', 'Whisper'],
  'Proctoring': ['ArcFace', 'MediaPipe', 'YOLOv8', 'WebRTC'],
  'Backend': ['Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'FAISS'],
  'Infrastructure': ['AWS EKS', 'S3', 'AES-256', 'Zero Trust', 'SOC 2'],
};

/* ── Spline hover-rotation ────────────────────────────────────────────────── */

const SENSITIVITY = 0.25;

// function firePointer(canvas, type, x, y) {
//   canvas.dispatchEvent(new PointerEvent(type, {
//     bubbles: true, cancelable: true,
//     clientX: x, clientY: y,
//     pointerId: 1, pointerType: 'mouse',
//     button: 0,
//     buttons: type === 'pointermove' ? 1 : 0,
//     pressure: type === 'pointermove' ? 0.5 : 0,
//   }));
// }

/* ── Component ───────────────────────────────────────────────────────────── */

export default function Landing({ navigate }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const resetRafRef = useRef(null);
  const currentPos = useRef(null);
  const centerRef = useRef(null);
  const isDown = useRef(false);

  const onLoad = useCallback((app) => {
    const el = app?.canvas;
    if (el) canvasRef.current = el;
  }, []);

  const onSplineEnter = useCallback((e) => {
    if (resetRafRef.current) cancelAnimationFrame(resetRafRef.current);
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    centerRef.current = { cx, cy };
    const dx = cx + (e.clientX - cx) * SENSITIVITY;
    const dy = cy + (e.clientY - cy) * SENSITIVITY;
    firePointer(canvas, 'pointerdown', dx, dy);
    currentPos.current = { x: dx, y: dy };
    isDown.current = true;
  }, []);

  const onSplineMove = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const { cx, cy } = centerRef.current ?? { cx: e.clientX, cy: e.clientY };
      if (!canvas) return;
      const dx = cx + (e.clientX - cx) * SENSITIVITY;
      const dy = cy + (e.clientY - cy) * SENSITIVITY;
      if (!isDown.current) { firePointer(canvas, 'pointerdown', dx, dy); isDown.current = true; }
      firePointer(canvas, 'pointermove', dx, dy);
      currentPos.current = { x: dx, y: dy };
    });
  }, []);

  const onSplineLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const canvas = canvasRef.current;
    if (!canvas || !isDown.current || !currentPos.current || !centerRef.current) {
      isDown.current = false; return;
    }
    const start = { ...currentPos.current };
    const { cx, cy } = centerRef.current;
    const STEPS = 40; let step = 0;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const tick = () => {
      if (step >= STEPS) {
        firePointer(canvas, 'pointerup', cx, cy);
        isDown.current = false; currentPos.current = null; return;
      }
      const t = ease(step / STEPS);
      const x = start.x + (cx - start.x) * t;
      const y = start.y + (cy - start.y) * t;
      firePointer(canvas, 'pointermove', x, y);
      currentPos.current = { x, y };
      step++;
      resetRafRef.current = requestAnimationFrame(tick);
    };
    resetRafRef.current = requestAnimationFrame(tick);
  }, []);

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', background: 'var(--bg)' }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <div className="brand-icon"><span className="brand-icon-inner">N</span></div>
          <span className="brand-name">NeuralExam</span>
          <span className="brand-badge">Prototype</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#metrics" className="nav-link">Performance</a>
          <a href="#stack" className="nav-link">Technology</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('login', { role: 'teacher' })}>Teacher Login</button>
          <button className="btn btn-primary" onClick={() => navigate('login', { role: 'student' })}>Student Portal</button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', paddingTop: 72,
        overflow: 'hidden', position: 'relative',
      }}>
        <div className="bg-grid" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* LEFT — Spline */}
        <div
          ref={containerRef}
          onMouseEnter={onSplineEnter}
          onMouseMove={onSplineMove}
          onMouseLeave={onSplineLeave}
          style={{ position: 'relative', height: '82vh', zIndex: 1, overflow: 'hidden', cursor: 'grab' }}
        >
          <Spline
            scene="https://prod.spline.design/ajTrsbZiLv7pMLq9/scene.splinecode"
            onLoad={onLoad}
            style={{ width: '100%', height: '110%' }}
          />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 100,
            background: 'linear-gradient(to right, transparent, var(--bg))', pointerEvents: 'none', zIndex: 2
          }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
            background: 'linear-gradient(to bottom, transparent, var(--bg))', pointerEvents: 'none', zIndex: 2
          }} />
        </div>

        {/* RIGHT — Hero text */}
        <div style={{ position: 'relative', zIndex: 1, padding: '60px 64px 60px 32px' }}>
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            AI-Powered · Adaptive · Secure
          </div>

          <h1 className="hero-title" style={{ textAlign: 'left', fontSize: 'clamp(36px, 4vw, 64px)', lineHeight: 1.08 }}>
            The Future of<br />
            <span className="gradient-text">Intelligent<br />Assessment</span>
          </h1>

          <div className="hero-cta" style={{ justifyContent: 'flex-start', marginTop: 32 }}>
            <button className="btn btn-primary btn-xl" onClick={() => navigate('login', { role: 'teacher' })}>
              Teacher Dashboard
            </button>
            <button className="btn btn-outline btn-xl" onClick={() => navigate('login', { role: 'student' })}>
              🎓 Student Portal
            </button>
          </div>

          <div className="hero-stats" style={{ justifyContent: 'flex-start', marginTop: 36, flexWrap: 'wrap', gap: 10 }}>
            <div className="stat-pill"><span className="stat-num">95%</span> Cheating Detection</div>
            <div className="stat-pill"><span className="stat-num">&lt;1%</span> False Positives</div>
            <div className="stat-pill"><span className="stat-num">1M+</span> Concurrent Users</div>
            <div className="stat-pill"><span className="stat-num">99.99%</span> Uptime</div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 48px', position: 'relative', zIndex: 1 }}>
        <div className="section-header">
          <h2 className="section-title">Every Layer. Engineered.</h2>
          <p className="section-sub">Six integrated AI systems working in concert.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className={`feature-card ${f.cls}`}>
              <div className="feature-icon" style={{ fontSize: 28, background: 'rgba(38,204,194,0.1)', borderRadius: 12 }}>{f.emoji}</div>
              <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="feature-tags">{f.tags.map(t => <span key={t}>{t}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PERFORMANCE TARGETS — clean enterprise table ───────────────────── */}
      <section id="metrics" style={{ padding: '60px 48px', position: 'relative', zIndex: 1 }}>
        <div className="section-header">
          <h2 className="section-title">Performance Targets</h2>
          <p className="section-sub">Production telemetry across the trailing twelve-month period.</p>
        </div>

        {/* 4-column stat bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, border: '1px solid rgba(106,236,225,0.14)',
          borderRadius: 12, overflow: 'hidden',
          background: 'rgba(106,236,225,0.07)',
          maxWidth: 960, margin: '0 auto 32px',
        }}>
          {PERF_ROWS.map((r, i) => {
            const colors = ['#26CCC2', '#6AECE1', '#FFF57E', '#FFB76C'];
            return (
              <div key={r.metric} style={{ padding: '24px 22px', background: 'var(--bg2)' }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 28,
                  fontWeight: 700, color: colors[i], marginBottom: 6, lineHeight: 1,
                }}>{r.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{r.metric}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{r.note}</div>
                {/* Thin color bar at bottom */}
                <div style={{ marginTop: 16, height: 2, borderRadius: 2, background: colors[i], opacity: 0.4 }} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TECHNOLOGY STACK — clean 4-column grid ────────────────────────── */}
      <section id="stack" style={{ padding: '20px 48px 100px', position: 'relative', zIndex: 1 }}>
        <div className="section-header">
          <h2 className="section-title">Technology Stack</h2>
          <p className="section-sub">Production-grade components powering every layer of the platform.</p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, border: '1px solid rgba(106,236,225,0.14)',
          borderRadius: 12, overflow: 'hidden',
          background: 'rgba(106,236,225,0.07)',
          maxWidth: 960, margin: '0 auto',
        }}>
          {Object.entries(STACK).map(([group, items]) => (
            <div key={group} style={{ padding: '24px 22px', background: 'var(--bg2)' }}>
              {/* Category header */}
              <div style={{
                fontSize: 10, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--primary)',
                marginBottom: 18, paddingBottom: 10,
                borderBottom: '1px solid rgba(106,236,225,0.12)',
              }}>{group}</div>

              {/* Item rows */}
              {items.map(item => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0',
                  borderBottom: '1px solid rgba(106,236,225,0.06)',
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'var(--primary)', opacity: 0.5, flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 13, color: 'var(--text2)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <div className="brand-icon sm"><span className="brand-icon-inner">N</span></div>
          <span>NeuralExam Enterprise © 2026</span>
        </div>
        <div className="footer-links">
          <a href="#">Privacy</a><a href="#">Security</a><a href="#">Compliance</a>
        </div>
      </footer>
    </div>
  );
}
