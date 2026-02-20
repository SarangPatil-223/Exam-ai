import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const SUBJECTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry'];
const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFS = ['Easy', 'Medium', 'Hard'];

const gridColor = 'rgba(255,255,255,0.05)';
const tickColor = '#64748b';

// ── Chart configs ────────────────────────────────────────────────────────────
const scoreDistConfig = () => ({
  type: 'bar',
  data: {
    labels: ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90-100'],
    datasets: [{
      label: 'Students', data: [2, 3, 5, 8, 12, 18, 35, 42, 28, 15],
      backgroundColor: 'rgba(38,204,194,0.55)', borderColor: '#26CCC2', borderWidth: 1, borderRadius: 4
    }],
  },
  options: {
    responsive: true, plugins: { legend: { display: false } },
    scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }, y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } } }
  },
});

const bloomDoughnutConfig = () => ({
  type: 'doughnut',
  data: {
    labels: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    datasets: [{
      data: [18, 22, 25, 18, 10, 7],
      backgroundColor: ['#26CCC2', '#FFB76C', '#6AECE1', '#FFF57E', '#ff9f7f', '#5de8d7'], borderWidth: 0
    }],
  },
  options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } },
});

const thetaDistConfig = () => {
  const data = Array.from({ length: 40 }, () => +(Math.random() * 4 - 2).toFixed(2));
  return {
    type: 'bar',
    data: {
      labels: data.map((_, i) => 'S' + (i + 1)),
      datasets: [{ label: 'θ', data, backgroundColor: data.map(v => v >= 0 ? 'rgba(38,204,194,0.6)' : 'rgba(255,107,107,0.6)'), borderRadius: 3 }]
    },
    options: {
      responsive: true, plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } } }
    },
  };
};

const iccConfig = () => {
  const theta = Array.from({ length: 61 }, (_, i) => -3 + i * 0.1);
  const irt = (th, a, b, c) => c + (1 - c) / (1 + Math.exp(-a * (th - b)));
  return {
    type: 'line',
    data: {
      labels: theta.map(t => t.toFixed(1)),
      datasets: [
        { label: 'Easy', data: theta.map(t => irt(t, 0.8, -1, 0.25)), borderColor: '#6AECE1', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.4 },
        { label: 'Medium', data: theta.map(t => irt(t, 1.4, 0, 0.25)), borderColor: '#FFF57E', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.4 },
        { label: 'Hard', data: theta.map(t => irt(t, 2.0, 1.5, 0.25)), borderColor: '#ff6b6b', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.4 },
      ]
    },
    options: {
      responsive: true, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: { x: { ticks: { maxTicksLimit: 7, color: tickColor, font: { size: 10 } }, grid: { color: gridColor } }, y: { min: 0, max: 1, ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } } }
    },
  };
};

const bloomRadarConfig = () => ({
  type: 'radar',
  data: {
    labels: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    datasets: [{
      label: 'Class Avg', data: [82, 75, 68, 61, 55, 48],
      backgroundColor: 'rgba(38,204,194,0.2)', borderColor: '#26CCC2', borderWidth: 2, pointBackgroundColor: '#26CCC2'
    }]
  },
  options: {
    responsive: true, plugins: { legend: { display: false } },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: tickColor, font: { size: 9 }, backdropColor: 'transparent' },
        pointLabels: { color: '#94a3b8', font: { size: 11 } }, min: 0, max: 100
      }
    }
  },
});

const trendConfig = () => ({
  type: 'line',
  data: {
    labels: ['Exam 1', 'Exam 2', 'Exam 3', 'Exam 4', 'Exam 5', 'Exam 6'],
    datasets: [{
      label: 'Avg Score', data: [68, 72, 70, 75, 74, 81],
      borderColor: '#FFB76C', backgroundColor: 'rgba(255,183,108,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#FFB76C', pointRadius: 5
    }]
  },
  options: {
    responsive: true, plugins: { legend: { display: false } },
    scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor } }, y: { min: 50, max: 100, grid: { color: gridColor }, ticks: { color: tickColor } } }
  },
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function TeacherDashboard({ navigate, toast, startExam }) {
  const [tab, setTab] = useState('overview');
  const [questions, setQuestions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSubject, setSubjectF] = useState('');
  const [filterBloom, setBloomF] = useState('');
  const [filterDiff, setDiffF] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // Exam builder
  const [examTitle, setExamTitle] = useState('Midterm Exam — Data Structures');
  const [examSubject, setExamSubject] = useState('Computer Science');
  const [examDuration, setDuration] = useState(60);
  const [examCount, setCount] = useState(10);
  const [easyPct, setEasyPct] = useState(30);
  const [mediumPct, setMediumPct] = useState(50);
  const [hardPct, setHardPct] = useState(20);
  const [adaptive, setAdaptive] = useState(true);
  const [proctor, setProctor] = useState(true);
  const [previewQs, setPreviewQs] = useState([]);

  // Chart instance refs (keyed by canvas id)
  const chartRefs = useRef({});
  const destroyChart = useCallback((id) => {
    if (chartRefs.current[id]) { chartRefs.current[id].destroy(); delete chartRefs.current[id]; }
  }, []);
  const createChart = useCallback((id, config) => {
    destroyChart(id);
    const el = document.getElementById(id);
    if (el) chartRefs.current[id] = new Chart(el, config);
  }, [destroyChart]);

  // ── Fetch questions ──────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterSubject) params.set('subject', filterSubject);
      if (filterBloom) params.set('bloom', filterBloom);
      if (filterDiff) params.set('difficulty', filterDiff);
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      setQuestions(data.data || []);
    } catch { toast('Could not reach API server', 'error'); }
  }, [filterSubject, filterBloom, filterDiff, toast]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(questions.filter(x => !q || x.text.toLowerCase().includes(q) || x.topic.toLowerCase().includes(q)));
    setPage(1);
  }, [questions, search]);

  // ── Charts ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'overview') return;
    const t = setTimeout(() => {
      createChart('ch-score-dist', scoreDistConfig());
      createChart('ch-bloom', bloomDoughnutConfig());
    }, 100);
    return () => clearTimeout(t);
  }, [tab, createChart]);

  useEffect(() => {
    if (tab !== 'analytics') return;
    const t = setTimeout(() => {
      createChart('ch-theta', thetaDistConfig());
      createChart('ch-icc', iccConfig());
      createChart('ch-bloomrad', bloomRadarConfig());
      createChart('ch-trend', trendConfig());
    }, 100);
    return () => clearTimeout(t);
  }, [tab, createChart]);

  // cleanup all charts on unmount
  useEffect(() => () => Object.keys(chartRefs.current).forEach(k => { chartRefs.current[k]?.destroy(); }), []);

  // ── Exam builder ─────────────────────────────────────────────────────────
  const generateExam = async () => {
    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: examSubject, count: examCount, easyPct, mediumPct, hardPct }),
      });
      if (!res.ok) throw new Error();
      const { questions: qs } = await res.json();
      setPreviewQs(qs);
      toast(`Generated ${qs.length} questions.`, 'success');
    } catch { toast('Generation failed — is the API server running?', 'error'); }
  };

  const launchExam = () => {
    if (!previewQs.length) { toast('Generate an exam first', 'warning'); return; }
    startExam({ title: examTitle, subject: examSubject, adaptive, proctor, duration: examDuration, questions: previewQs });
  };

  const deleteQuestion = async (id) => {
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    toast('Deleted', 'success');
    fetchQuestions();
  };

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const TABS = [
    { key: 'overview', label: 'Overview', emoji: '🏠' },
    { key: 'questions', label: 'Question Bank', emoji: '📚' },
    { key: 'exams', label: 'Exam Builder', emoji: '📝' },
    { key: 'analytics', label: 'Analytics', emoji: '📊' },
    { key: 'proctoring', label: 'Proctoring', emoji: '🛡' },
  ];

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon sm"><span className="brand-icon-inner">N</span></div>
          <span className="brand-name">NeuralExam</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button key={t.key} className={`sidebar-item${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              <span>{t.emoji}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">DR</div>
            <div className="user-info">
              <div className="user-name">Dr. Reyes</div>
              <div className="user-role">Instructor</div>
            </div>
          </div>
          <button className="icon-btn" title="Logout" onClick={() => navigate('landing')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard-main">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="tab-content active">
            <div className="page-header">
              <div><h1 className="page-title">Dashboard Overview</h1><p className="page-sub">Welcome back, Dr. Reyes.</p></div>
              <button className="btn btn-primary" onClick={() => setTab('exams')}>+ New Exam</button>
            </div>
            <div className="kpi-grid">
              {[
                { emoji: '👥', value: '1,247', label: 'Active Students', trend: '+12%' },
                { emoji: '📄', value: '38', label: 'Exams Created', trend: '+5' },
                { emoji: '🗃', value: `${questions.length}`, label: 'Questions in Bank', trend: '+89' },
                { emoji: '⚠', value: '7', label: 'Proctoring Flags', trend: '-3' },
              ].map(k => (
                <div key={k.label} className="kpi-card">
                  <div className="kpi-icon">{k.emoji}</div>
                  <div className="kpi-body">
                    <div className="kpi-value">{k.value}</div>
                    <div className="kpi-label">{k.label}</div>
                  </div>
                  <div className="kpi-trend up">{k.trend}</div>
                </div>
              ))}
            </div>
            <div className="overview-charts">
              <div className="chart-card">
                <div className="chart-header"><h3>Score Distribution</h3></div>
                <canvas id="ch-score-dist" height="200" />
              </div>
              <div className="chart-card">
                <div className="chart-header"><h3>Bloom's Taxonomy Coverage</h3></div>
                <canvas id="ch-bloom" height="200" />
              </div>
            </div>
            <div style={{ marginTop: 28 }}>
              <h3 style={{ marginBottom: 16 }}>Recent Exams</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Exam</th><th>Subject</th><th>Students</th><th>Avg</th><th>Status</th></tr></thead>
                  <tbody>
                    {[
                      { name: 'Midterm — Data Structures', sub: 'CS', students: 42, avg: 74, s: 'Completed' },
                      { name: 'Quiz 3 — Algorithms', sub: 'CS', students: 38, avg: 81, s: 'Completed' },
                      { name: 'Final — Calculus', sub: 'Math', students: 55, avg: 68, s: 'Active' },
                      { name: 'Lab Test — Physics', sub: 'Phys', students: 29, avg: 77, s: 'Scheduled' },
                    ].map(e => (
                      <tr key={e.name}>
                        <td><strong>{e.name}</strong></td><td>{e.sub}</td><td>{e.students}</td><td>{e.avg}%</td>
                        <td><span className={`badge ${e.s === 'Active' ? 'badge-green' : e.s === 'Scheduled' ? 'badge-blue' : 'badge-gray'}`}>{e.s}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* QUESTION BANK */}
        {tab === 'questions' && (
          <div className="tab-content active">
            <div className="page-header"><div><h1 className="page-title">Question Bank</h1><p className="page-sub">Manage and calibrate your question library.</p></div></div>
            <div className="filter-bar">
              <input className="search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              <select className="filter-select" value={filterSubject} onChange={e => { setSubjectF(e.target.value); }}>
                <option value="">All Subjects</option>{SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="filter-select" value={filterBloom} onChange={e => setBloomF(e.target.value)}>
                <option value="">All Blooms</option>{BLOOMS.map(b => <option key={b}>{b}</option>)}
              </select>
              <select className="filter-select" value={filterDiff} onChange={e => setDiffF(e.target.value)}>
                <option value="">All Difficulties</option>{DIFFS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Question</th><th>Subject</th><th>Bloom</th><th>Diff</th><th>Type</th><th>IRT</th><th></th></tr></thead>
                <tbody>
                  {paged.map(q => (
                    <tr key={q.id}>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{q.topic}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{q.subject}</td>
                      <td><span className="bloom-badge" style={{ fontSize: 10 }}>{q.bloom}</span></td>
                      <td><span className={`diff-badge diff-${q.difficulty.toLowerCase()}`} style={{ fontSize: 10 }}>{q.difficulty}</span></td>
                      <td><span className="type-badge" style={{ fontSize: 10 }}>{q.type}</span></td>
                      <td style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#64748b' }}>a={q.irt.a} b={q.irt.b}</td>
                      <td>
                        <button className="btn btn-ghost" style={{ padding: '3px 7px', fontSize: 12 }} onClick={() => deleteQuestion(q.id)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} className={`page-btn${page === i + 1 ? ' active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXAM BUILDER */}
        {tab === 'exams' && (
          <div className="tab-content active">
            <div className="page-header"><h1 className="page-title">Exam Builder</h1></div>
            <div className="builder-layout">
              <div className="builder-form glass-card">
                <h3 className="form-section-title">Configuration</h3>
                <div className="form-group">
                  <label>Exam Title</label>
                  <input className="form-input" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Subject</label>
                    <select className="form-input" value={examSubject} onChange={e => setExamSubject(e.target.value)}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration (min)</label>
                    <input type="number" className="form-input" value={examDuration} onChange={e => setDuration(+e.target.value)} min={10} max={300} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Questions: {examCount}</label>
                  <input type="range" className="range-input" min={5} max={22} value={examCount} onChange={e => setCount(+e.target.value)} />
                </div>
                <h3 className="form-section-title">Difficulty Mix</h3>
                {[{ l: 'Easy', v: easyPct, s: setEasyPct }, { l: 'Medium', v: mediumPct, s: setMediumPct }, { l: 'Hard', v: hardPct, s: setHardPct }].map(d => (
                  <div key={d.l} className="dist-row">
                    <label style={{ width: 60 }}>{d.l}</label>
                    <input type="range" className="range-input" min={0} max={100} value={d.v} onChange={e => d.s(+e.target.value)} style={{ flex: 1 }} />
                    <span className="dist-val">{d.v}%</span>
                  </div>
                ))}
                <h3 className="form-section-title">Settings</h3>
                {[{ l: 'Adaptive Testing (CAT)', v: adaptive, s: setAdaptive }, { l: 'AI Proctoring', v: proctor, s: setProctor }].map(t => (
                  <div key={t.l} className="toggle-row">
                    <span className="toggle-label">{t.l}</span>
                    <label className="toggle">
                      <input type="checkbox" checked={t.v} onChange={e => t.s(e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
                <button className="btn btn-primary btn-full" style={{ marginTop: 20 }} onClick={generateExam}>✨ Generate with AI</button>
              </div>

              <div className="builder-preview">
                <div className="glass-card preview-card">
                  <h3>Preview</h3>
                  {previewQs.length === 0
                    ? <p style={{ color: '#64748b', marginTop: 16 }}>Generate an exam to preview questions here.</p>
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                        <div style={{ padding: 14, background: 'rgba(38,204,194,0.08)', border: '1px solid rgba(38,204,194,0.2)', borderRadius: 10 }}>
                          <strong>{examTitle}</strong>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{examSubject} · {previewQs.length} Qs · {examDuration}min</div>
                        </div>
                        {previewQs.slice(0, 6).map((q, i) => (
                          <div key={q.id} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>Q{i + 1}</span>
                              <span className={`diff-badge diff-${q.difficulty.toLowerCase()}`} style={{ fontSize: 10 }}>{q.difficulty}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</div>
                          </div>
                        ))}
                        {previewQs.length > 6 && <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>+{previewQs.length - 6} more</div>}
                        <button className="btn btn-primary btn-full" onClick={launchExam}>▶ Launch Exam</button>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div className="tab-content active">
            <div className="page-header"><h1 className="page-title">Analytics</h1></div>
            <div className="analytics-grid">
              <div className="chart-card span-2">
                <div className="chart-header"><h3>Ability Distribution (θ)</h3></div>
                <canvas id="ch-theta" height="180" />
              </div>
              <div className="chart-card">
                <div className="chart-header"><h3>Item Characteristic Curves</h3></div>
                <canvas id="ch-icc" height="220" />
              </div>
              <div className="chart-card">
                <div className="chart-header"><h3>Bloom Level Performance</h3></div>
                <canvas id="ch-bloomrad" height="220" />
              </div>
              <div className="chart-card span-2">
                <div className="chart-header"><h3>Score Trend — Last 6 Exams</h3></div>
                <canvas id="ch-trend" height="160" />
              </div>
            </div>
          </div>
        )}

        {/* PROCTORING */}
        {tab === 'proctoring' && (
          <div className="tab-content active">
            <div className="page-header"><h1 className="page-title">Proctoring Reports</h1></div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Exam</th><th>Risk</th><th>Incidents</th><th>Status</th></tr></thead>
                <tbody>
                  {[
                    { s: 'Arjun Kumar', e: 'Midterm DS', risk: 72, inc: 'Gaze deviation (3x), Audio anomaly', st: 'Flagged' },
                    { s: 'Priya Sharma', e: 'Quiz 3', risk: 15, inc: 'None', st: 'Clean' },
                    { s: 'Rahul Verma', e: 'Midterm DS', risk: 91, inc: 'Face absent (2x), Multiple faces', st: 'Terminated' },
                    { s: 'Ananya Singh', e: 'Final Calc', risk: 38, inc: 'Gaze deviation (1x)', st: 'Warning' },
                    { s: 'Karan Patel', e: 'Quiz 3', risk: 8, inc: 'None', st: 'Clean' },
                    { s: 'Sneha Iyer', e: 'Midterm DS', risk: 55, inc: 'Audio anomaly (2x)', st: 'Flagged' },
                  ].map(r => {
                    const col = r.risk < 30 ? '#6AECE1' : r.risk < 60 ? '#FFF57E' : '#ff6b6b';
                    const b = r.st === 'Clean' ? 'badge-green' : r.st === 'Warning' ? 'badge-yellow' : 'badge-red';
                    return (
                      <tr key={r.s}>
                        <td><strong>{r.s}</strong></td><td>{r.e}</td>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: col }}>{r.risk}</span></td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{r.inc}</td>
                        <td><span className={`badge ${b}`}>{r.st}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
