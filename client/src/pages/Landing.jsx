import { useRef, useCallback } from 'react';
import Spline from '@splinetool/react-spline';

const FEATURES = [
  { title: 'Adaptive Testing Engine', emoji: '🧠', desc: 'IRT 3PL model with Fisher Information maximisation. Estimates θ in real-time to select the optimal next question.', tags: ['IRT 3PL', 'EAP Estimation', 'CAT'], cls: 'card-glow-blue' },
  { title: 'AI Question Generation', emoji: '✨', desc: "Curriculum-aligned generation with Bloom's taxonomy tagging, parametrised variations, and difficulty calibration.", tags: ["Bloom's Taxonomy", 'RAG', 'GPT-4o'], cls: 'card-glow-purple' },
  { title: 'AI Proctoring', emoji: '🛡', desc: 'Multi-modal monitoring: facial recognition, gaze tracking, audio analysis, and behavior detection with 95% accuracy.', tags: ['ArcFace', 'MediaPipe', 'YOLOv8'], cls: 'card-glow-green' },
  { title: 'Automated Evaluation', emoji: '📋', desc: 'Hybrid scoring with DeBERTa-v3 semantic similarity, rubric-based partial credit, and GPT-4o rubric evaluation.', tags: ['DeBERTa-v3', 'Rubric AI', 'Partial Credit'], cls: 'card-glow-orange' },
  { title: 'Analytics Dashboard', emoji: '📊', desc: 'Item analysis, Bloom performance heatmaps, IRT parameter visualisation, and proctoring incident reports.', tags: ['Item Analysis', 'Psychometrics', 'Reports'], cls: 'card-glow-pink' },
  { title: 'Accessibility First', emoji: '♿', desc: 'TTS/STT support, ARIA compliance, adjustable timing multipliers, and screen reader optimisation built-in.', tags: ['WCAG 2.1 AA', 'TTS/STT', 'ARIA'], cls: 'card-glow-cyan' },
];

const METRICS = [
  { label: 'Cheating Detection Rate', value: '95%', pct: '95%', color: '#26CCC2' },
  { label: 'False Positive Avoidance', value: '<1% FP', pct: '98%', color: '#6AECE1' },
  { label: 'Adaptive Step Latency', value: '<150ms', pct: '85%', color: '#FFF57E' },
  { label: 'System Uptime', value: '99.99%', pct: '99.99%', color: '#FFB76C' },
];

const STACK = {
  'AI Models': ['GPT-4o', 'LLaMA 3 70B', 'DeBERTa-v3', 'ArcFace', 'YOLOv8', 'Whisper'],
  'Backend': ['FastAPI', 'PostgreSQL', 'Redis', 'Kafka', 'FAISS', 'Kubernetes'],
  'Frontend': ['React', 'Vite', 'Chart.js', 'GraphQL'],
  'Infrastructure': ['AWS EKS', 'S3', 'AES-256', 'Zero Trust', 'SOC2', 'GDPR'],
};

// Simulate a left-button drag on the Spline canvas so it rotates on hover
// function firePointer(canvas, type, x, y) {
//   canvas.dispatchEvent(new PointerEvent(type, {
//     bubbles: true, cancelable: true,
//     clientX: x, clientY: y,
//     pointerId: 1, pointerType: 'mouse',
//     button: 0, buttons: type === 'pointermove' ? 1 : 0,
//     pressure: type === 'pointermove' ? 0.0 : 0,
//   }));
// }

// Lower = less sensitive rotation (0.25 = 25 % of raw cursor delta reaches Spline)
const SENSITIVITY = 0.05;

export default function Landing({ navigate }) {
  // ── Refs ────────────────────────────────────────────
  const canvasRef = useRef(null);  // Spline <canvas>
  const containerRef = useRef(null);  // our wrapper div
  const rafRef = useRef(null);  // move rAF id
  const resetRafRef = useRef(null);  // leave-animation rAF id
  const currentPos = useRef(null);  // last dampened position sent
  const centerRef = useRef(null);  // container centre (set on enter)
  const isDown = useRef(false);

  // Called once the Spline scene loads
  const onLoad = useCallback((app) => {
    const el = app?.canvas;
    if (el) canvasRef.current = el;
  }, []);

  // Enter → record centre, fire pointerdown at the dampened start point
  const onSplineEnter = useCallback((e) => {
    // Cancel any running reset animation
    if (resetRafRef.current) cancelAnimationFrame(resetRafRef.current);

    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    centerRef.current = { cx, cy };

    // Start the virtual drag at the dampened position
    const dx = cx + (e.clientX - cx) * SENSITIVITY;
    const dy = cy + (e.clientY - cy) * SENSITIVITY;
    firePointer(canvas, 'pointerdown', dx, dy);
    currentPos.current = { x: dx, y: dy };
    isDown.current = true;
  }, []);

  // Move → send dampened pointer so rotation is slower / less twitchy
  const onSplineMove = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const { cx, cy } = centerRef.current ?? { cx: e.clientX, cy: e.clientY };
      if (!canvas) return;

      const dx = cx + (e.clientX - cx) * SENSITIVITY;
      const dy = cy + (e.clientY - cy) * SENSITIVITY;

      if (!isDown.current) {
        firePointer(canvas, 'pointerdown', dx, dy);
        isDown.current = true;
      }
      firePointer(canvas, 'pointermove', dx, dy);
      currentPos.current = { x: dx, y: dy };
    });
  }, []);

  // Leave → ease the injected pointer back to centre, then release
  const onSplineLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const canvas = canvasRef.current;
    if (!canvas || !isDown.current || !currentPos.current || !centerRef.current) {
      isDown.current = false;
      return;
    }

    const start = { ...currentPos.current };
    const { cx, cy } = centerRef.current;
    const STEPS = 40;
    let step = 0;

    const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut

    const tick = () => {
      if (step >= STEPS) {
        firePointer(canvas, 'pointerup', cx, cy);
        isDown.current = false;
        currentPos.current = null;
        return;
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

      {/* ── Nav ─────────────────────────────────────────── */}
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

      {/* ── Hero — Split Layout ──────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        paddingTop: 72,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div className="bg-grid" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* LEFT — Spline 3D Brain
            Height is 82vh so the bottom watermark is clipped below the fold.
            overflow:hidden on the parent clips anything below. */}
        <div
          ref={containerRef}
          onMouseEnter={onSplineEnter}
          onMouseMove={onSplineMove}
          onMouseLeave={onSplineLeave}
          style={{
            position: 'relative',
            height: '82vh',
            zIndex: 1,
            overflow: 'hidden',
            cursor: 'grab',
          }}
        >
          <Spline
            scene="https://prod.spline.design/ajTrsbZiLv7pMLq9/scene.splinecode"
            onLoad={onLoad}
            style={{ width: '100%', height: '110%'  /* slight over-render so bottom is clipped */ }}
          />

          {/* Right-edge gradient blends scene into text column */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 100,
            background: 'linear-gradient(to right, transparent, var(--bg))',
            pointerEvents: 'none', zIndex: 2,
          }} />
          {/* Bottom gradient further hides any watermark remnant */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
            background: 'linear-gradient(to bottom, transparent, var(--bg))',
            pointerEvents: 'none', zIndex: 2,
          }} />
        </div>

        {/* RIGHT — Hero Text */}
        <div style={{ position: 'relative', zIndex: 1, padding: '60px 64px 60px 32px' }}>
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            AI-Powered · Adaptive · Secure
          </div>

          <h1 className="hero-title" style={{ textAlign: 'left', fontSize: 'clamp(36px, 4vw, 64px)', lineHeight: 1.08 }}>
            The Future of<br />
            <span className="gradient-text">Intelligent<br />Assessment</span>
          </h1>

          {/* <p className="hero-subtitle" style={{ textAlign: 'left', maxWidth: 460, marginTop: 20 }}>
            Enterprise-grade examination engine with adaptive testing, automated evaluation,
            AI proctoring, and real-time analytics — built for 1M+ concurrent users.
          </p> */}

          <div className="hero-cta" style={{ justifyContent: 'flex-start', marginTop: 32 }}>
            <button className="btn btn-primary btn-xl" onClick={() => navigate('login', { role: 'teacher' })}>
               Teacher Dashboard
            </button>
            <div>
            </div>
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

      {/* ── Features ─────────────────────────────────────── */}
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

      {/* ── Metrics ──────────────────────────────────────── */}
      <section id="metrics" style={{ padding: '60px 48px', position: 'relative', zIndex: 1 }}>
        <div className="section-header">
          <h2 className="section-title">Performance Targets</h2>
        </div>
        <div className="metrics-grid">
          {METRICS.map(m => (
            <div key={m.label} className="metric-card">
              <div style={{ fontSize: 30, fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: m.color, marginBottom: 6 }}>{m.value}</div>
              <div className="metric-label">{m.label}</div>
              <div style={{ marginTop: 12, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', borderRadius: 4, background: m.color, width: m.pct }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stack ────────────────────────────────────────── */}
      <section id="stack" style={{ padding: '60px 48px 100px', position: 'relative', zIndex: 1 }}>
        <div className="section-header">
          <h2 className="section-title">Technology Stack</h2>
        </div>
        <div className="stack-grid">
          {Object.entries(STACK).map(([group, pills]) => (
            <div key={group} className="stack-group">
              <div className="stack-group-title">{group}</div>
              <div className="stack-pills">
                {pills.map(p => <span key={p} className="stack-pill">{p}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
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
