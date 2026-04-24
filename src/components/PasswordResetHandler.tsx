import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { verifyPasswordResetCode, applyPasswordReset } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface PasswordResetHandlerProps {
  oobCode?: string;
  continueUrl?: string;
}

export const PasswordResetHandler: React.FC<PasswordResetHandlerProps> = ({ 
  oobCode 
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function verifyCode() {
      if (!oobCode) {
        setError('Missing reset code. Please request a new password reset.');
        setIsLoading(false);
        return;
      }
      
      try {
        const email_ = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email_);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Reset code verification failed:', err);
        setError('Invalid or expired reset link. Please request a new password reset.');
        setIsLoading(false);
      }
    }
    
    verifyCode();
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsResetting(true);
    
    try {
      await applyPasswordReset(auth, oobCode!, password);
      setSuccess(true);
      
      if (email) {
        const userRef = doc(db, 'users', email.toLowerCase());
        await getDoc(userRef);
      }
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]" />
        <div className="relative flex min-h-screen items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
            <p className="mt-4 text-slate-400">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]" />
        <div className="relative flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-10"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/15 ring-1 ring-red-500/30">
              <AlertCircle className="h-9 w-9 text-red-400" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Reset Link Invalid</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{error}</p>
            <a
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/25 transition hover:bg-blue-700"
            >
              Back to Sign In
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]" />
        <div className="relative flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-10"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/15 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Password Reset</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700"
            >
              Sign In
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]" />
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-10"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/25">
              <Lock className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/90">
                Account recovery
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-white">New password</h1>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            Enter a new password for <span className="text-white font-medium">{email}</span>
          </p>

          {error && (
            <div
              role="alert"
              className="mb-6 flex gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-left text-sm text-red-100"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="mb-2 block text-xs font-medium text-slate-400">
                New password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-xs font-medium text-slate-400">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isResetting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting...
                </span>
              ) : 'Reset password'}
            </button>
          </form>

          <p className="mt-8 border-t border-white/10 pt-6 text-center text-[11px] uppercase tracking-widest text-slate-600">
            HIPAA-ready · Encrypted session
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PasswordResetHandler;