import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Leaf } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password }, { withCredentials: true });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      switch (res.data.user.role) {
        case 'admin':
          navigate('/admin-dashboard'); break;
        case 'worker':
          navigate('/worker-dashboard'); break;
        case 'production_manager':
          navigate('/production-dashboard'); break;
        case 'inventory_manager':
          navigate('/inventory-dashboard'); break;
        case 'field_supervisor':
          navigate('/field-dashboard'); break;
        default:
          navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err?.response?.status, err?.response?.data);
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
      {/* subtle background accent */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-300 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-96 h-96 rounded-full bg-green-500 blur-3xl" />
      </div>

      {/* card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 sm:p-8">
          {/* brand */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/favicon.png" alt="CeylonLeaf" className="w-9 h-9 rounded" />
            <span className="text-white text-2xl font-semibold tracking-tight">CeylonLeaf</span>
          </div>
          <p className="text-center text-white/80 mb-6">
            Sign in to manage fields, workers, and factory handovers.
          </p>

          {/* error */}
          {error && (
            <div className="alert alert-error mb-4 py-2 text-sm">
              <span>{error}</span>
            </div>
          )}

          {/* form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* email */}
            <label className="form-control">
              <div className="label">
                <span className="label-text text-white/90">Email</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-white/60">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="admin@tea.com"
                  className="input input-bordered w-full pl-11 bg-white/90 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            {/* password */}
            <label className="form-control">
              <div className="label">
                <span className="label-text text-white/90">Password</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-white/60">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-11 pr-11 bg-white/90 focus:bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

            {/* actions */}
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary w-full mt-2 ${loading ? 'btn-disabled' : ''}`}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* helper footer */}
          <div className="mt-6 text-xs sm:text-sm text-white/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              <span>Tea estates • Factory integration</span>
            </div>
            <span>v1.0</span>
          </div>
        </div>

        {/* small note */}
        <p className="text-center text-white/70 text-xs mt-4">
          Trouble logging in? Contact your administrator for credentials.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
