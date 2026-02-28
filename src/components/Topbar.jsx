export default function Topbar({ user, theme, onToggleTheme, onLogout, title }) {
  return (
    <div className="topbar">
      <div className="topbar-user">
        {user?.photoURL && (
          <img
            src={user.photoURL}
            width={32}
            height={32}
            style={{ borderRadius: '50%' }}
            alt="avatar"
          />
        )}
        <span>{title || user?.displayName || user?.email}</span>
      </div>
      <div className="topbar-actions">
        <button className="btn-theme" onClick={onToggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {onLogout && (
          <button className="btn-logout" onClick={onLogout}>
            התנתק
          </button>
        )}
      </div>
    </div>
  );
}
