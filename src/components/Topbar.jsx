import { useScrollDirection } from "@/hooks";

export default function Topbar({ user, theme, onToggleTheme, onLogout, title }) {
  const scrollDirection = useScrollDirection(50, 80);
  const isHidden = scrollDirection === 'down';

  return (
    <div className={`topbar ${isHidden ? 'topbar--hidden' : ''}`}>
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
          <button className="btn-logout" onClick={() => confirm('להתנתק?') && onLogout()}>
            יציאה 👋
          </button>
        )}
      </div>
    </div>
  );
}
