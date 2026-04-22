/**
 * Component Exports Index
 *
 * Central export point for all components.
 * Organize imports by functional domain.
 */

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export { Login } from './Login';
export { PasswordReset } from './PasswordReset';

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export { default as OnboardingFlow } from './OnboardingFlow';

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILE & SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
export { UserProfileMenu } from './UserProfileMenu';
export type { UserRole } from './UserProfileMenu';
export { ProfileView } from './ProfileView';
export { EnhancedProfileView } from './EnhancedProfileView';
export { UserSettingsView } from './UserSettingsView';

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export { Dashboard } from './Dashboard';
export { PatientRoster } from './PatientRoster';
export { EdgeDevice } from './EdgeDevice';
export { ThresholdEditor } from './ThresholdEditor';
export { PatientEditor } from './PatientEditor';

// ─────────────────────────────────────────────────────────────────────────────
// AI & MEDICAL ASSISTANCE
// ─────────────────────────────────────────────────────────────────────────────
export { MedicalRAGAssistant } from './MedicalRAGAssistant';
export { MedicalAssistant } from './ai';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export { ThemeCard } from './layout/ThemeCard';
export type { ThemeCardProps, ThemeCardVariant } from './layout/ThemeCard';
export { ThemeProvider } from './ThemeContext';
export { EmergencyAlertModal } from './EmergencyAlertModal';
export { ErrorBoundary } from './ErrorBoundary';
export { HomePage } from './HomePage';
export { default as LandingPage } from './LandingPage';

// ─────────────────────────────────────────────────────────────────────────────
// COMMON/SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export * from './common';
export { GlassInput } from './GlassInput';
export { ToastProvider, useToast, ToastHelpers } from './ToastNotifications';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export { DegradedBanner } from './system/DegradedBanner';
export { default as AdminClinicianManagement } from './AdminClinicianManagement';
