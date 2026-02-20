import { useState, useEffect, useRef, useCallback } from 'react';
import { startProctoring, stopProctoring, riskColor } from '../engines/proctoring';
import { estimateTheta } from '../engines/adaptiveEngine';

const TOTAL_SECONDS = (dur) => dur * 60;

export default function Exam({ config, navigate, toast, onFinish }) {
  const { title, subject, adaptive, proctor, duration = 60, questions: initialQuestions } = config;

  const [questions, setQuestions] = useState(initialQuestions || []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS(duration));
  const [theta, setTheta] = useState(0);
  const [thetaHistory, setThetaHistory] = useState([0]);
  const [riskScore, setRiskScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);  // [{a,b,c,correct}] for local theta

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const currentQuestion = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const pct = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(id); submitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // ── Proctoring ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!proctor) return;
    if (videoRef.current && canvasRef.current) {
      startProctoring(videoRef.current, canvasRef.current, setRiskScore).then(s => { streamRef.current = s; });
    }
    return () => stopProctoring(streamRef.current);
  }, [proctor]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const submitExam = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    stopProctoring(streamRef.current);

    const questionIds = questions.map(q => q.id);
    const res = await fetch('/api/exam/evaluate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds, answers, thetaHistory }),
    });

    if (!res.ok) { toast('Submission failed — please retry', 'error'); setSubmitting(false); return; }
    const result = await res.json();
    onFinish({ ...result, config, questions });
  }, [submitting, questions, answers, thetaHistory, config, onFinish, toast]);

  // ── Answer selection ─────────────────────────────────────────────────────
  const handleAnswer = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));

    // Update local theta estimate for MCQ
    const q = questions.find(x => x.id === qid);
    if (q?.type === 'MCQ' && q.irt) {
      const correct = value === q.correct;
      const newResponses = [...responses, { a: q.irt.a, b: q.irt.b, c: q.irt.c, correct }];
      setResponses(newResponses);
      const newTheta = estimateTheta(newResponses, theta);
      setTheta(newTheta);
      setThetaHistory(h => [...h, newTheta]);
    }
  };

  const timerColor = () => {
    if (timeLeft <= 300) return '#ff6b6b';
    if (timeLeft <= 600) return '#FFF57E';
    return '';
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!questions.length) return (
    <div className="view active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="page-title">Loading Exam…</div>
      </div>
    </div>
  );

  return (
    <div id="view-exam" className="view active">
      {/* Proctor Overlay */}
      {proctor && (
        <div className="proctor-overlay">
          <div className="proctor-cam-wrap">
            <video ref={videoRef} autoPlay muted playsInline />
            <canvas ref={canvasRef} />
            <div className="proctor-status-bar">
              <div className={`proctor-dot${riskScore >= 60 ? ' danger' : riskScore >= 30 ? ' warning' : ''}`} />
              <span>AI Proctoring Active</span>
            </div>
          </div>
          <div className="risk-meter">
            <div className="risk-label">Risk Score</div>
            <div className="risk-value" style={{ color: riskColor(riskScore) }}>{riskScore}</div>
            <div className="risk-bar-track">
              <div className="risk-bar-fill" style={{ width: `${riskScore}%`, background: riskColor(riskScore) }} />
            </div>
          </div>
        </div>
      )}

      {/* Exam Header */}
      <header className="exam-header">
        <div className="exam-header-left">
          <div className="brand-icon sm"><span className="brand-icon-inner">N</span></div>
          <div>
            <div className="exam-name">{title}</div>
            <div className="exam-meta-row">
              <span className="subject-badge">{subject}</span>
              {adaptive && <span className="adaptive-badge">⚡ Adaptive</span>}
            </div>
          </div>
        </div>
        <div className="exam-header-center">
          <div className="timer-display" style={{ color: timerColor() || undefined }}>{fmt(timeLeft)}</div>
          <div className="timer-label">Remaining</div>
        </div>
        <div className="exam-header-right">
          <div className="theta-display">
            <div className="theta-label">Ability (θ)</div>
            <div className="theta-value">{theta.toFixed(2)}</div>
          </div>
          <div className="progress-ring-wrap">
            <svg className="progress-ring" width="52" height="52">
              <circle className="ring-bg" cx="26" cy="26" r="22" />
              <circle className="ring-fill" cx="26" cy="26" r="22"
                strokeDasharray="138.2"
                strokeDashoffset={138.2 - (pct / 100) * 138.2}
                style={{ stroke: pct >= 80 ? '#6AECE1' : pct >= 60 ? '#FFF57E' : '#ff6b6b', transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="ring-label">{answered}/{questions.length}</div>
          </div>
        </div>
      </header>

      {/* Exam Body */}
      <div className="exam-body">
        {/* Question Navigator */}
        <aside className="question-nav">
          <div className="qnav-header">Questions</div>
          <div className="qnav-grid">
            {questions.map((q, i) => (
              <button key={q.id}
                className={`qnav-btn${i === currentIdx ? ' current' : ''}${answers[q.id] !== undefined ? ' answered' : ''}`}
                onClick={() => setCurrentIdx(i)}
              >{i + 1}</button>
            ))}
          </div>
          <button className="btn btn-danger btn-full" style={{ marginTop: 'auto' }}
            onClick={() => { if (window.confirm('Submit exam?')) submitExam(); }}
            disabled={submitting}
          >{submitting ? 'Submitting…' : '✓ Submit Exam'}</button>
        </aside>

        {/* Question Panel */}
        <div className="question-panel">
          {currentQuestion && (
            <div className="question-card glass-card" key={currentQuestion.id}>
              <div className="question-meta-row">
                <span className="q-number">Q{currentIdx + 1} of {questions.length}</span>
                <span className="bloom-badge">{currentQuestion.bloom}</span>
                <span className={`diff-badge diff-${currentQuestion.difficulty.toLowerCase()}`}>{currentQuestion.difficulty}</span>
                <span className="type-badge">{currentQuestion.type}</span>
              </div>
              <div className="question-text">{currentQuestion.text}</div>

              {/* MCQ Options */}
              {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                <div className="answer-area">
                  {currentQuestion.options.map((opt, i) => (
                    <label key={i}
                      className={`mcq-option${answers[currentQuestion.id] === i ? ' selected' : ''}`}
                    >
                      <input type="radio" name={currentQuestion.id}
                        checked={answers[currentQuestion.id] === i}
                        onChange={() => handleAnswer(currentQuestion.id, i)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                      <span className="option-letter">{['A', 'B', 'C', 'D'][i]}</span>
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Subjective */}
              {currentQuestion.type === 'Subjective' && (
                <>
                  {currentQuestion.rubric && (
                    <div className="rubric-preview">
                      <div className="rubric-title">Rubric Criteria</div>
                      {currentQuestion.rubric.map(r => (
                        <div key={r.criterion} className="rubric-item">
                          <span>{r.criterion}</span>
                          <span className="rubric-pts">{r.maxScore} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea className="subjective-textarea"
                    placeholder="Write your answer here…"
                    value={answers[currentQuestion.id] || ''}
                    onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                  />
                </>
              )}

              <div className="q-nav-btns">
                <button className="btn btn-ghost" disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => i - 1)}>← Prev</button>
                <button className="btn btn-primary" disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx(i => i + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
