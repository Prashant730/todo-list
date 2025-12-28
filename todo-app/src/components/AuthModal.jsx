import { useState } from 'react';
import { FiMail, FiLock, FiUser, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
  const { login, register, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (form.password.length < 6) {
          setFormError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await register(form.email, form.password, form.name);
      }
      onClose();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <FiX size={20} />
          </button>
          <h2 className="text-2xl font-bold">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-white/80 mt-1">
            {isLogin ? 'Sign in to sync your tasks' : 'Start organizing your study life'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(formError || error) && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {formError || error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="input-field w-full pl-10 pr-4 py-3 rounded-xl"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="input-field w-full pl-10 pr-4 py-3 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                className="input-field w-full pl-10 pr-12 py-3 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl font-medium text-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          <div className="text-center pt-4 border-t border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormError('');
                }}
                className="ml-2 text-[var(--accent)] hover:underline font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
