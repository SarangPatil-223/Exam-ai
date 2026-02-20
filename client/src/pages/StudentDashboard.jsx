import { useState } from 'react';

const AVAILABLE_EXAMS = [
  { id: 'e1', title: 'Midterm Exam — Data Structures', subject: 'Computer Science', duration: 60, questions: 20, adaptive: true, proctor: true, status: 'available', due: 'Feb 20, 2026' },
  { id: 'e2', title: 'Quiz 3 — Algorithms', subject: 'Computer Science', duration: 30, questions: 10, adaptive: true, proctor: false, status: 'available', due: 'Feb 22, 2026' },
  { id: 'e3', title: 'Unit Test — Probability', subject: 'Mathematics', duration: 45, questions: 15, adaptive: false, proctor: true, status: 'scheduled', due: 'Feb 25, 2026' },
  { id: 'e4', title: 'Lab Assessment — Thermodynamics', subject: 'Physics', duration: 90, questions: 25, adaptive: true, proctor: true, status: 'available', due: 'Feb 19, 2026' },
];

export default function StudentDashboard({ navigate, toast, startExam }) {
  const [tab, setTab] = useState('exams');

  const handleStart = async (exam) => {
    toast(`Loading ${exam.title}…`, 'info');
    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: exam.subject, count: exam.questions }),
      });
      if (!res.ok) throw new Error();
      const { questions } = await res.json();
      startExam({ ...exam, questions });
    } catch {
      toast('Failed to load exam. Make sure API server is running.', 'error');
    }
  };

  const TABS = [
    { key: 'exams', label: 'My Exams', emoji: '📄' },
    { key: 'results', label: 'Results', emoji: '📊' },
    { key: 'profile', label: 'Profile', emoji: '👤' },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon sm"><span className="brand-icon-inner">N</span></div>
          <span className="brand-name">NeuralExam</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button key={t.key}
              className={`sidebar-item${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">AK</div>
            <div className="user-info">
              <div className="user-name">Arjun Kumar</div>
              <div className="user-role">Student · CS-3B</div>
            </div>
          </div>
          <button className="icon-btn" onClick={() => navigate('landing')} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        {tab === 'exams' && (
          <div className="tab-content active">
            <div className="page-header">
              <div>
                <h1 className="page-title">Available Exams</h1>
                <p className="page-sub">Your scheduled and available assessments.</p>
              </div>
            </div>
            <div className="exam-cards-grid">
              {AVAILABLE_EXAMS.map(e => (
                <div key={e.id} className="exam-card">
                  <div className="exam-card-header">
                    <div>
                      <div className="exam-card-title">{e.title}</div>
                      <div className="exam-card-subject">{e.subject}</div>
                    </div>
                    <span className={`badge ${e.status === 'available' ? 'badge-green' : 'badge-blue'}`}>
                      {e.status === 'available' ? 'Available' : 'Scheduled'}
                    </span>
                  </div>
                  <div className="exam-card-meta">
                    <span>⏱ {e.duration} min</span>
                    <span>📄 {e.questions} Qs</span>
                    <span>📅 {e.due}</span>
                  </div>
                  <div className="exam-card-tags">
                    {e.adaptive && <span className="exam-card-tag adaptive">⚡ Adaptive</span>}
                    {e.proctor && <span className="exam-card-tag proctor">🛡 Proctored</span>}
                  </div>
                  {e.status === 'available'
                    ? <button className="btn btn-primary btn-full" onClick={() => handleStart(e)}>▶ Start Exam</button>
                    : <button className="btn btn-outline btn-full" disabled>Scheduled</button>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'results' && (
          <div className="tab-content active">
            <div className="page-header"><h1 className="page-title">My Results</h1></div>
            <div className="empty-state">
              <p style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>
                No completed exams yet. Take an exam to see your results here.
              </p>
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="tab-content active">
            <div className="page-header"><h1 className="page-title">My Profile</h1></div>
            <div className="profile-card glass-card">
              <div className="profile-avatar-lg">AK</div>
              <div className="profile-info">
                <h2>Arjun Kumar</h2>
                <p>arjun.kumar@university.edu</p>
                <div className="profile-tags">
                  <span className="tag">Computer Science</span>
                  <span className="tag">Year 3</span>
                  <span className="tag">Section B</span>
                </div>
              </div>
              <div className="profile-stats">
                {[{ num: 12, lbl: 'Exams Taken' }, { num: '74%', lbl: 'Avg Score' }, { num: '0.42', lbl: 'Avg θ' }].map(s => (
                  <div key={s.lbl} className="ps-card">
                    <div className="ps-num">{s.num}</div>
                    <div className="ps-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
