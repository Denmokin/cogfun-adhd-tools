import { useScrollDirection } from "@/hooks";
import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Topbar({ user, theme, onToggleTheme, onLogout, title }) {
  const scrollDirection = useScrollDirection(50, 80);
  const isHidden = scrollDirection === 'down';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

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
      {/* ADHD Tools dropdown nav */}
      <div className="topbar-nav" ref={dropdownRef}>
        <div className="dropdown">
          <button
            className={`dropbtn ${dropdownOpen ? 'active' : ''}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            ADHD Tools
          </button>
          {dropdownOpen && (
            <div className="dropdown-content">
              <NavLink
                to="/aaa"
                onClick={() => setDropdownOpen(false)}
                className={({ isActive }) => isActive ? 'nav-active' : ''}
              >
                AAA
              </NavLink>
              <NavLink
                to="/daily"
                onClick={() => setDropdownOpen(false)}
                className={({ isActive }) => isActive ? 'nav-active' : ''}
              >
                Daily Task Randomizer
              </NavLink>
            </div>
          )}
        </div>
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
