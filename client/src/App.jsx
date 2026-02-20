import { useState, useCallback, Component } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Exam from './pages/Exam';
import Results from './pages/Results';
import Toast from './components/Toast';

// ── Error Boundary ────────────────────────────────────────────────────────  
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: 32 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, color: '#ff6b6b' }}>Something went wrong</h2>
          <pre style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', padding: 16, borderRadius: 10, fontSize: 12, maxWidth: 600, whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </pre>
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('landing');
  const [role, setRole] = useState('student');
  const [examConfig, setExamConfig] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [toast, setToast] = useState(null);

  const navigate = useCallback((to, opts = {}) => {
    if (opts.role) setRole(opts.role);
    setView(to);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast(t => t?.id === id ? null : t), 3500);
  }, []);

  const startExam = useCallback((config) => {
    setExamConfig(config);
    setView('exam');
  }, []);

  const finishExam = useCallback((result) => {
    setExamResult(result);
    setView('results');
  }, []);

  return (
    <ErrorBoundary>
      {view === 'landing' && <Landing navigate={navigate} />}
      {view === 'login' && <Login navigate={navigate} role={role} setRole={setRole} />}
      {view === 'teacher' && <ErrorBoundary><TeacherDashboard navigate={navigate} toast={showToast} startExam={startExam} /></ErrorBoundary>}
      {view === 'student' && <ErrorBoundary><StudentDashboard navigate={navigate} toast={showToast} startExam={startExam} /></ErrorBoundary>}
      {view === 'exam' && <ErrorBoundary><Exam config={examConfig} navigate={navigate} toast={showToast} onFinish={finishExam} /></ErrorBoundary>}
      {view === 'results' && <ErrorBoundary><Results result={examResult} navigate={navigate} role={role} /></ErrorBoundary>}
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} />}
    </ErrorBoundary>
  );
}
