import { useState } from 'react';

export default function Login({ navigate, role, setRole }) {
  const [email, setEmail] = useState('demo@neuralexam.ai');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    // Simulate auth delay
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    navigate(role === 'teacher' ? 'teacher' : 'student');
  };

  return (
    <div id="view-login" className="view active">
      <div className="bg-grid" />
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" />
      </div>

      <div className="login-container">
        <div className="login-card glass-card">
          <div className="login-header">
            <div className="brand-icon lg"><span className="brand-icon-inner">N</span></div>
            <h2>{role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}</h2>
            <p>Sign in to your account</p>
          </div>

          {/* Role Tabs */}
          <div className="role-tabs">
            <button
              className={`role-tab${role === 'teacher' ? ' active' : ''}`}
              onClick={() => setRole('teacher')}
            >📊 Teacher</button>
            <button
              className={`role-tab${role === 'student' ? ' active' : ''}`}
              onClick={() => setRole('student')}
            >🎓 Student</button>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email" className="form-input"
                placeholder="you@institution.edu"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password" className="form-input"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a href="#" className="link-text">Forgot password?</a>
            </div>

            {error && <div className="toast toast-error" style={{ position: 'relative', margin: '0' }}>{error}</div>}

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="login-demo-note">
              ℹ Demo credentials pre-filled. Just click Sign In.
            </div>
          </form>
        </div>

        <button className="back-btn" onClick={() => navigate('landing')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
