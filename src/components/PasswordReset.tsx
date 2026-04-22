import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface PasswordResetProps {
  onBack: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset failed:', err);

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]"
          aria-hidden
        />
        <div className="relative flex min-h-screen items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-10"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/15 ring-1 ring-blue-500/30">
              <CheckCircle2 className="h-9 w-9 text-blue-400" aria-hidden />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              We sent reset instructions to <strong className="text-slate-200">{email}</strong>. 
              Follow the link in that message to choose a new password.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-8 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/25 transition hover:bg-blue-700"
            >
              Back to sign in
            </button>

            <p className="mt-2 text-xs text-slate-500">
              Didn’t get it? Check spam or promotions.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]"
        aria-hidden
      />
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-10">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/70 backdrop-blur-sm">
              <Loader2 className="h-9 w-9 animate-spin text-blue-400" aria-hidden />
            </div>
          )}

          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/25">
              <Activity className="h-6 w-6 text-slate-950" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/90">
                Account recovery
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-white">Reset password</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </button>

          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            Enter the email associated with your clinician account. We’ll send a secure link to reset your password.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-6 flex gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-left text-sm text-red-100"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
              <div>
                <p className="font-semibold text-red-200">Couldn’t send email</p>
                <p className="mt-1 text-red-100/90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="mb-2 block text-xs font-medium text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@hospital.org"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isLoading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-8 border-t border-white/10 pt-6 text-center text-[11px] uppercase tracking-widest text-slate-600">
            HIPAA-ready · Encrypted session
          </p>
        </div>
      </div>
    </div>
  );
};
