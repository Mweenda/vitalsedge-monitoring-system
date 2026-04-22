import React, { useState } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, AuthError } from 'firebase/auth';
import { LogIn, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, Activity } from 'lucide-react';
import { PasswordReset } from './PasswordReset';
import { clsx } from 'clsx';

export const Login: React.FC = () => {
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'google'>('email');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
  }

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleEmailLogin = async () => {
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!validateEmail(email) || !validatePassword(password)) {
      setError('Please fix the errors below and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authError = err as AuthError;
      
      // Check if emulators are not running (connection refused)
      if (authError.message?.includes('ERR_CONNECTION_REFUSED') || 
          authError.message?.includes('inet afi') ||
          authError.code === 'network-request-failed') {
        setError('Firebase emulators are not running. Start them with: pnpm run dev:full');
      } else if (authError.code === 'auth/user-not-found') {
        setError('No account found with this email address. Please check your email or sign up for a new account.');
      } else if (authError.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or click "Forgot Password" to reset it.');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email address format. Please enter a valid email.');
      } else if (authError.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please wait a few minutes before trying again.');
      } else if (authError.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support for assistance.');
      } else if (authError.code === 'auth/configuration-not-found') {
        setError('Authentication service is not properly configured. Please contact support.');
      } else {
        setError(`Login failed: ${authError.message || 'An unexpected error occurred. Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const authError = err as AuthError;

      // Check if emulators are not running (connection refused)
      if (authError.message?.includes('ERR_CONNECTION_REFUSED') || 
          authError.message?.includes('inet afi') ||
          authError.code === 'network-request-failed') {
        setError('Firebase emulators are not running. Start them with: pnpm run dev:full');
      } else if (authError.code === 'auth/popup-blocked') {
        setError('The login popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (authError.code === 'auth/cancelled-popup-request') {
        setError('A previous login request was cancelled. Please wait a moment and try again.');
      } else if (authError.code === 'auth/popup-closed-by-user') {
        setError('The login window was closed before completion. Please try again.');
      } else if (authError.code === 'auth/configuration-not-found') {
        setError('Google authentication is not properly configured. Please contact support.');
      } else {
        setError(`Google login failed: ${authError.message || 'An unexpected error occurred. Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    'w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(15,23,42,0.9),transparent_55%)]" aria-hidden />

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-xl sm:p-10">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/70 backdrop-blur-sm">
              <Loader2 className="h-9 w-9 animate-spin text-blue-400" aria-hidden />
            </div>
          )}

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25">
              <Activity className="h-7 w-7 text-slate-950" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
              VitalsEdge
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Sign in to the remote monitoring portal for clinicians.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-left text-sm text-red-100"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
              <div>
                <p className="font-semibold text-red-200">Sign-in issue</p>
                <p className="mt-1 text-red-100/90">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6 flex rounded-xl border border-white/10 bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={clsx(
                'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
                loginMethod === 'email'
                  ? 'bg-blue-600 text-slate-950 shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white',
              )}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('google')}
              className={clsx(
                'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
                loginMethod === 'google'
                  ? 'bg-blue-600 text-slate-950 shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white',
              )}
            >
              Google
            </button>
          </div>

          {loginMethod === 'email' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email-input" className="mb-2 block text-xs font-medium text-slate-400">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="email-input"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@hospital.org"
                    autoComplete="email"
                    className={clsx(inputBase, emailError && 'border-red-500/50 focus:ring-red-500/20')}
                    disabled={isLoading}
                  />
                </div>
                {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="password-input" className="mb-2 block text-xs font-medium text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password-input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={clsx(inputBase, 'pr-12', passwordError && 'border-red-500/50 focus:ring-red-500/20')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>}
              </div>

              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={isLoading || !!emailError || !!passwordError}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <LogIn className="h-5 w-5" aria-hidden />
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          )}

          {loginMethod === 'google' && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <LogIn className="h-5 w-5" aria-hidden />
              {isLoading ? 'Signing in…' : 'Continue with Google'}
            </button>
          )}

          <div className="mt-6 flex gap-3 text-left">
            <input
              type="checkbox"
              id="terms-checkbox"
              name="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/30"
            />
            <label htmlFor="terms-checkbox" className="cursor-pointer text-xs leading-relaxed text-slate-500">
              I agree to the{' '}
              <span className="text-slate-300 underline decoration-white/20 underline-offset-2 hover:text-white">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-slate-300 underline decoration-white/20 underline-offset-2 hover:text-white">
                Privacy Policy
              </span>
              , including HIPAA-aligned data handling.
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswordReset(true)}
            className="mt-6 w-full text-center text-xs font-medium text-slate-500 transition hover:text-blue-400"
          >
            Forgot password?
          </button>

          <p className="mt-8 border-t border-white/10 pt-6 text-center text-[11px] uppercase tracking-widest text-slate-600">
            HIPAA-ready · Encrypted session
          </p>
        </div>
      </div>
    </div>
  );
};
