import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, AuthError } from 'firebase/auth';
import { LogIn, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, Activity, Sparkles } from 'lucide-react';
import { PasswordReset } from './PasswordReset';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    'w-full rounded-xl border border-white/10 bg-slate-900/60 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <motion.div
          className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px]"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ delay: 0.1 }}
            className="mb-8 text-center"
          >
            <motion.div
              className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 blur-lg opacity-50" />
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-lg shadow-emerald-500/30">
                <Activity className="h-8 w-8 text-slate-950" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                VitalsEdge
              </span>
            </h1>
            <p className="mt-3 text-sm text-gray-400">
              AI-powered patient monitoring for clinicians
            </p>
          </motion.div>

          {/* Login Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <span className="text-sm text-gray-400">Signing in...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="mb-6 overflow-hidden"
                >
                  <div className="flex gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <div>
                      <p className="font-semibold text-red-200">Sign-in issue</p>
                      <p className="mt-1 text-sm text-red-100/90">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Method Toggle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: mounted ? 1 : 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex rounded-xl border border-white/10 bg-slate-800/50 p-1"
            >
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={clsx(
                  'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
                  loginMethod === 'email'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white',
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
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white',
                )}
              >
                Google
              </button>
            </motion.div>

            {/* Email Login Form */}
            <AnimatePresence mode="wait">
              {loginMethod === 'email' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="email-input" className="mb-2 block text-xs font-medium text-gray-400">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
                    {emailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-red-400"
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password-input" className="mb-2 block text-xs font-medium text-gray-400">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <input
                        id="password-input"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className={clsx(inputBase, 'pr-12', passwordError && 'border-red-500/50 focus:ring-red-500/20')}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-red-400"
                      >
                        {passwordError}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleEmailLogin}
                    disabled={isLoading || !!emailError || !!passwordError}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <LogIn className="h-5 w-5" />
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </motion.button>
                </motion.div>
              )}

              {/* Google Login */}
              {loginMethod === 'google' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms Checkbox */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: mounted ? 1 : 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex gap-3"
            >
              <input
                type="checkbox"
                id="terms-checkbox"
                name="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
              />
              <label htmlFor="terms-checkbox" className="cursor-pointer text-xs leading-relaxed text-gray-500">
                I agree to the{' '}
                <span className="text-gray-300 underline decoration-white/20 underline-offset-2 hover:text-white transition-colors">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-gray-300 underline decoration-white/20 underline-offset-2 hover:text-white transition-colors">
                  Privacy Policy
                </span>
                , including HIPAA-aligned data handling.
              </label>
            </motion.div>

            {/* Forgot Password */}
            <motion.button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              whileHover={{ scale: 1.02 }}
              className="mt-6 w-full text-center text-sm font-medium text-gray-500 transition-colors hover:text-emerald-400"
            >
              Forgot password?
            </motion.button>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 pt-6 border-t border-white/10">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <p className="text-xs uppercase tracking-widest text-gray-600">
                HIPAA-Ready · End-to-End Encrypted
              </p>
            </div>
          </div>

          {/* Sign up link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            New to VitalsEdge?{' '}
            <a
              href="/doctor-onboarding"
              className="font-medium text-emerald-400 underline decoration-emerald-400/20 underline-offset-2 hover:text-emerald-300 transition-colors"
            >
              Create clinician account
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;