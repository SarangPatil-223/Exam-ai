/** Toast — auto-fades notification */
export default function Toast({ message, type = 'info' }) {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  return (
    <div className={`toast toast-${type}`} style={{ animation: 'toastIn 0.3s ease' }}>
      <span className="toast-icon">{icons[type] ?? icons.info}</span>
      <span>{message}</span>
    </div>
  );
}
