import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Unable to send reset instructions. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D6EBF3] dark:bg-[#152B35] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#447F98] items-center justify-center text-[#D6EBF3] shadow-md mb-2">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#243D49] dark:text-[#D6EBF3] tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-[#526C78] dark:text-[#83BDCF]">
            We'll send recovery instructions to your email address
          </p>
        </div>

        <div className="bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl p-6 sm:p-8 shadow-card">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4 text-center py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-[#243D49] dark:text-[#D6EBF3]">
                Check Your Email
              </h3>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] leading-relaxed">
                If an account exists for <strong className="text-[#243D49] dark:text-[#D6EBF3]">{email}</strong>, a password reset link has been dispatched.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#526C78] dark:text-[#83BDCF] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526C78] dark:text-[#83BDCF]" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#D6EBF3]/50 dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#D6EBF3] focus:outline-none focus:ring-2 focus:ring-[#447F98]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 mt-2"
                loading={loading}
                disabled={loading}
              >
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#526C78] hover:text-[#243D49] dark:text-[#83BDCF] dark:hover:text-[#D6EBF3] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

