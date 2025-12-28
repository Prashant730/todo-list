import { useState, useRef, useEffect } from 'react';
import { FiSun, FiMoon, FiBookmark, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import NotificationSystem from './NotificationSystem';
import QuickActions from './QuickActions';

export default function Header({ onAddTask, onShowTemplates, onShowAuth }) {
  const { state, dispatch } = useTodo();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-10 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          📚 Study Planner
        </h1>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <QuickActions onAddTask={onAddTask} />
              <button onClick={onShowTemplates} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition" title="Task Templates">
                <FiBookmark size={20} />
              </button>
              <NotificationSystem />
            </>
          )}

          <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition">
            {state.theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden animate-slide-in">
                  <div className="p-3 border-b border-[var(--border-color)]">
                    <p className="font-medium truncate">{user?.name || 'User'}</p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition text-left">
                      <FiSettings size={18} />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition text-left"
                    >
                      <FiLogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onShowAuth}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition font-medium"
            >
              <FiUser size={18} />
              <span className="hidden sm:block">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
