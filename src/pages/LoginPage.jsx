import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Leaf } from 'lucide-react';
import { Sweet, Toast } from '@/utils/sweet';
import LoginFooter from '@/components/LoginFooter';
import { API_BASE_URL } from '../config/api.js';

const API = API_BASE_URL;

const roleHome = (role) => {
  switch (role) {
    case 'admin': return '/admin';
    case 'field_supervisor': return '/supervisor';
    case 'production_manager': return '/production-dashboard';
    case 'inventory_manager': return '/inventory';
    case 'worker': return '/worker';
    default: return '/';
  }
};

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
      const payload = { email: email.trim().toLowerCase(), password: password.trim() };
      const res = await axios.post(`${API}/api/auth/login`, payload, { timeout: 10000 });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // notify the whole app (Navbar listens to this)
      window.dispatchEvent(new Event('auth-changed'));

      Toast.fire({ icon: 'success', title: 'Signed in successfully' });
      navigate(roleHome(res.data.user.role), { replace: true });
    } catch (err) {
      console.error('Login error:', err?.response?.status, err?.response?.data);
      const msg = err?.response?.data?.message || 'Invalid credentials';
      setError(msg);
      Sweet.fire({ icon: 'error', title: 'Sign in failed', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="relative flex-1 flex items-center justify-center bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-300 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-96 h-96 rounded-full bg-green-500 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
        {/* Single button to go to Home (always visible) */}
        <button
          className="btn btn-outline w-full mb-4"
          type="button"
          onClick={() => navigate('/')}
        >
          ← Home
        </button>

        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/favicon.png" alt="CeylonLeaf" className="w-9 h-9 rounded" />
            <span className="text-white text-2xl font-semibold tracking-tight">CeylonLeaf</span>
          </div>
          <p className="text-center text-white/80 mb-6">
            Sign in to manage fields, workers, and factory handovers.
          </p>

          {error && (
            <div className="alert alert-error mb-4 py-2 text-sm">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="form-control">
              <div className="label">
                <span className="label-text text-white/90">Email</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/70">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="admin@tea.com"
                  className="input input-bordered w-full pl-11 bg-white text-black placeholder-gray-700 border-black/40 focus:border-black focus:ring-2 focus:ring-black/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="form-control">
              <div className="label">
                <span className="label-text text-white/90">Password</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/70">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-11 pr-11 bg-white text-black placeholder-gray-700 border-black/40 focus:border-black focus:ring-2 focus:ring-black/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-700 hover:text-black"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

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

          <div className="mt-6 text-xs sm:text-sm text-white/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              <span>Tea estates • Factory integration</span>
            </div>
            <span>v1.0</span>
          </div>
        </div>

        <p className="text-center text-white/70 text-xs mt-4 mb-8">
          Trouble logging in? Contact your administrator for credentials.
        </p>
        </div>
      </div>
      
      <LoginFooter />
    </div>
  );
};

export default LoginPage;
