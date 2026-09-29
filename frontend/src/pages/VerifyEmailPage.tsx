import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Inbox } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const emailParam = searchParams.get('email') || (location.state as { email?: string })?.email || '';
  const registeredUsername = (location.state as { username?: string })?.username || '';
  const registeredToken = (location.state as { token?: string })?.token || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // If no initial code was triggered, request one
    if (email) {
      handleResendCode();
    }
  }, [email]);

  const handleResendCode = async () => {
    if (!email) return;
    setIsResending(true);
    setError(null);
    try {
      await authService.sendVerificationCode(email);
      setSuccess('A verification code has been dispatched to your email inbox.');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setError('Please provide your email and the 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await authService.verifyEmail(email.trim(), code.trim());
      setSuccess('Email verified successfully! Activating your author profile...');

      // If registered token exists, log the user in immediately
      if (registeredToken && registeredUsername) {
        setSession({
          username: registeredUsername,
          email: email.trim(),
          role: 'User',
          token: registeredToken,
        });
      }

      setTimeout(() => {
        navigate('/profile');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired verification code';
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-600/20">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-sm text-slate-400">
            We have dispatched a 6-digit confirmation code to your email inbox.
          </p>
        </div>

        {/* Real Email Inbox Instructions Notice */}
        <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/30 p-4 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
            <Inbox className="w-4 h-4 text-indigo-400" />
            Check Your Mail Inbox
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A 6-digit confirmation code was sent to <span className="text-white font-medium">{email || 'your email'}</span>. Please check your <span className="text-white font-medium">Inbox</span> or <span className="text-white font-medium">Spam folder</span> and enter the code below.
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                Resend Code
              </button>
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 849201"
              maxLength={6}
              required
              className="w-full text-center tracking-widest font-mono text-xl py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || code.length < 6}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <ShieldCheck className="w-4 h-4" />
            {isVerifying ? 'Verifying Code...' : 'Verify Email & Activate Profile'}
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Already verified?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Sign In to Your Account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
