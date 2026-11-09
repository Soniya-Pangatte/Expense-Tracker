import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, ArrowLeft, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(email.trim(), password, name.trim());

      // Check if email confirmation is required by Supabase
      if (data?.user && !data?.session) {
        setSuccess(true);
      } else {
        // Immediate login
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err.message?.includes('User already registered') || err.message?.includes('unique constraint')) {
        setError('An account with this email already exists. Please sign in or reset your password.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
            Create SpendWise Account
          </h1>
          <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
            Start tracking expenses, receipts, and budgets today
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl p-6 sm:p-8 shadow-card">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#243D49] dark:text-[#EAF4F7]">
                Verify Your Email
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#C0D5DC] leading-relaxed">
                We've dispatched a confirmation link to <strong className="text-[#243D49] dark:text-[#EAF4F7]">{email}</strong>.
                Please check your inbox to activate your account.
              </p>
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => navigate('/login', { state: { message: 'Verification link sent! Sign in after confirming.' } })}
              >
                Return to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#C0D5DC] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#91ADB8]" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-none focus:ring-2 focus:ring-[#447F98] dark:focus:ring-[#83BDCF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#C0D5DC] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#91ADB8]" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-none focus:ring-2 focus:ring-[#447F98] dark:focus:ring-[#83BDCF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#C0D5DC] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#91ADB8]" size={16} />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-none focus:ring-2 focus:ring-[#447F98] dark:focus:ring-[#83BDCF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" size={16} />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
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
                Create Account
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-[#526C78] dark:text-[#83BDCF]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#243D49] dark:text-[#83BDCF] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
