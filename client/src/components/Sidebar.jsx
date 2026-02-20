/** Sidebar — shared between Teacher and Student dashboards */
export default function Sidebar({ brand = 'NeuralExam', items, activeTab, onTab, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon sm"><span className="brand-icon-inner">N</span></div>
        <span className="brand-name">{brand}</span>
      </div>

      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.key}
            className={`sidebar-item${activeTab === item.key ? ' active' : ''}`}
            onClick={() => onTab(item.key)}
          >
            <item.Icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{user.initials}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button className="icon-btn" onClick={onLogout} title="Logout">
          {/* Lucide LogOut SVG inline to avoid dynamic import complexity */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
