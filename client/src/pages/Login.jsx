import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, ArrowRight, ArrowLeft, Lock, Mail, AlertCircle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo, loginAsDemoAdmin, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');

  const from = location.state?.from?.pathname && location.state?.from?.pathname !== '/'
    ? location.state.from.pathname
    : '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please verify your credentials or register a new account.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in. Check your inbox for the confirmation link.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    navigate(from, { replace: true });
  };

  const handleDemoAdminLogin = () => {
    loginAsDemoAdmin();
    navigate('/admin/overview', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#D6EBF3] dark:bg-[#152B35] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Landing Page Button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#526C78] dark:text-[#C0D5DC] hover:text-[#243D49] dark:hover:text-[#EAF4F7] bg-white/80 dark:bg-[#203D49]/80 hover:bg-white dark:hover:bg-[#203D49] px-3.5 py-2 rounded-xl border border-[#C4DCE3] dark:border-[#365765] hover:border-[#447F98] transition-all shadow-2xs hover:shadow-xs group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-[#447F98] dark:text-[#83BDCF]" />
            <span>Back to Landing Page</span>
          </Link>
        </div>

        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#447F98] items-center justify-center text-white shadow-md mb-2">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#243D49] dark:text-[#EAF4F7] tracking-tight">
            Welcome to SpendWise
          </h1>
          <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
            Smart personal finance & expense management
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl p-6 sm:p-8 shadow-card">
          {/* Notification Messages */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#C0D5DC] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#91ADB8]" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-none focus:ring-2 focus:ring-[#447F98] dark:focus:ring-[#83BDCF]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#C0D5DC]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#447F98] dark:text-[#83BDCF] hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#91ADB8]" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-none focus:ring-2 focus:ring-[#447F98] dark:focus:ring-[#83BDCF]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2"
              icon={ArrowRight}
              iconPosition="right"
              loading={loading}
              disabled={loading}
            >
              Sign In to SpendWise
            </Button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C4DCE3] dark:border-[#365765]"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white dark:bg-[#203D49] px-3 text-[#526C78] dark:text-[#83BDCF]">
                Portfolio Preview
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full py-2.5 text-xs font-semibold"
              icon={Sparkles}
              onClick={handleDemoLogin}
            >
              Explore with Demo Account (User)
            </Button>

            <button
              type="button"
              onClick={handleDemoAdminLogin}
              className="w-full py-2.5 px-3 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ShieldCheck size={15} className="text-purple-600 dark:text-purple-400" />
              <span>Preview Admin Portal (Demo Admin)</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#243D49] dark:text-[#83BDCF] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
