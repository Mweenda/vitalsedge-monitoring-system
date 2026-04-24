import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Dashboard } from "./components/Dashboard";
import { EdgeDevice } from "./components/EdgeDevice";
import { FirebaseProvider, useFirebase } from "./components/FirebaseProvider";
import { Login } from "./components/Login";
import { CheckCircle2, ArrowLeft, Activity, Loader2 } from "lucide-react";

import LandingPage from "./components/LandingPage";
import OnboardingFlow from "./components/OnboardingFlow";
import DoctorOnboarding from "./pages/DoctorOnboarding";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeContext";
import { DegradedBanner } from "./components/system/DegradedBanner";
import { PasswordResetHandler } from "./components/PasswordResetHandler";

const LandingPageWrapper = () => {
  const navigate = useNavigate();
  return (
    <LandingPage
      onGetStarted={() => navigate("/doctor-onboarding")}
      onLogin={() => navigate("/login")}
    />
  );
};

const LoginWrapper = () => {
  const navigate = useNavigate();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed left-6 top-6 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 shadow-lg backdrop-blur-md transition hover:border-white/20 hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to home
      </button>
      <Login />
    </div>
  );
};

const PatientOnboardingWrapper = () => {
  const navigate = useNavigate();
  return (
    <OnboardingFlow
      onComplete={() => navigate("/login")}
      onCancel={() => navigate("/")}
    />
  );
};

const RegistrationSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_48%,_#e2e8f0_100%)] px-6 py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700">
            Registration Received
          </p>
          <h1 className="font-serif text-4xl leading-tight text-slate-950 md:text-5xl">
            Your onboarding has been submitted for clinical verification.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            The hospital administration will review your credentials and confirm
            access. You should expect a verification update by email after the
            review window closes.
          </p>
        </div>
        <div className="grid gap-4 rounded-3xl bg-slate-950 px-6 py-5 text-sm text-slate-200 md:grid-cols-3">
          <div>
            <p className="font-semibold text-white">What happens next</p>
            <p className="mt-2 text-slate-300">
              Credential review begins immediately after submission.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Expected turnaround</p>
            <p className="mt-2 text-slate-300">
              Most reviews are completed within 2 to 3 business days.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Access activation</p>
            <p className="mt-2 text-slate-300">
              You will receive email confirmation once your account is approved.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </button>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading, degraded, error } = useFirebase();

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div aria-hidden className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Activity className="h-7 w-7 text-white" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden />
          <span className="text-sm font-medium tracking-tight">Preparing your session…</span>
        </div>
        <p className="max-w-xs text-center text-xs text-slate-500">
          Verifying credentials and syncing your workspace.
        </p>
      </div>
    );
  }

  return (
    <div>
      {user && degraded && (
        <DegradedBanner
          message={
            error === "timeout"
              ? "Limited connectivity detected. The app is in degraded mode and write actions are temporarily unavailable."
              : "Limited connectivity. The app is in degraded mode and write actions are temporarily unavailable."
          }
        />
      )}
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        <Route
          path="/"
          element={
            loading ? (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
              </div>
            ) : !user ? (
              <LandingPageWrapper />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/login"
          element={
            loading ? (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
              </div>
            ) : !user ? (
              <LoginWrapper />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/patient-onboarding"
          element={
            loading ? (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
              </div>
            ) : !user ? (
              <PatientOnboardingWrapper />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/doctor-onboarding"
          element={
            <ErrorBoundary>
              <DoctorOnboarding />
            </ErrorBoundary>
          }
        />
        <Route
          path="/registration-success"
          element={<RegistrationSuccessPage />}
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <div className="relative min-h-screen">
                <Dashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/device"
          element={
            user ? (
              <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-6">
                <div className="space-y-6 w-full max-w-md">
                  <div className="text-center space-y-2">
                    <h2 className="text-[#8E9299] text-[10px] font-bold uppercase tracking-[0.3em]">
                      Hardware Simulation
                    </h2>
                    <p className="text-white/40 text-[11px] leading-relaxed">
                      This component simulates the embedded ESP32/STM32 edge
                      node. It performs local signal processing and anomaly
                      detection before transmitting summaries to Firestore.
                    </p>
                  </div>
                  <EdgeDevice />
                </div>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/resetPassword"
          element={
            <PasswordResetHandler />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FirebaseProvider bootstrapTimeoutMs={15000}>
          <AppContent />
        </FirebaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
