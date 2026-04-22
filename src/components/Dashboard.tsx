import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VitalSigns, Anomaly, PatientData, AuditLog } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import {
  Activity, Heart, Thermometer, Droplets, AlertTriangle,
  Bell, Shield, Users, User, Clipboard, Settings, Calendar, Cpu, Radio,
  Sun, Moon, RefreshCw, Wifi, WifiOff, Zap, ChevronRight,
  Trash2, Edit3, CheckCircle2, Mail, Fingerprint, Phone, MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  collection, onSnapshot, query, orderBy, limit, where,
  doc, getDoc, updateDoc, addDoc, deleteDoc,
} from 'firebase/firestore';
import { useFirebase } from './FirebaseProvider';

import AdminClinicianManagement from './AdminClinicianManagement';
import OnboardingFlow from './OnboardingFlow';
import { ThresholdEditor } from './ThresholdEditor';
import { PatientEditor } from './PatientEditor';
import { PatientRoster } from './PatientRoster';
import { clsx } from 'clsx';
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout';
import { VitalSignCard } from './dashboard/VitalSignCard';
import { ChartCard } from './dashboard/ChartCard';
import { EmptyState, LoadingState, Button, Card, CardHeader } from './common';
import { generateMockTelemetryState } from '../utils/mockTelemetry';
import { getComplianceFooterLabels } from '../config/appConfig';
import { EmergencyAlertModal } from './EmergencyAlertModal';
import { useTheme } from './ThemeContext';
import { UserProfileMenu } from './UserProfileMenu';
import { EnhancedProfileView } from './EnhancedProfileView';
import { UserSettingsView } from './UserSettingsView';
import { HomePage } from './HomePage';
import MedicalRAGAssistant from './MedicalRAGAssistant';
import { MedicalAssistant } from './ai';
import styles from './Dashboard.module.css';

// ─── Types ──────────────────────────────────────────────────────────────────

type ActiveTab =
  | 'home'
  | 'overview' | 'trends' | 'settings' | 'audit'
  | 'patients' | 'clinic' | 'clinicians' | 'system_logs'
  | 'profile' | 'user_settings' | 'rag_assistant';

const TAB_TITLES: Record<ActiveTab, string> = {
  home: 'Home',
  overview: 'Patient overview',
  trends: 'Historical trends',
  settings: 'Device configuration',
  audit: 'Audit trail',
  patients: 'Patient records',
  clinic: 'Clinic overview',
  clinicians: 'Clinician management',
  system_logs: 'System logs',
  profile: 'My profile',
  user_settings: 'Settings',
  rag_assistant: 'AI Medical Assistant',
};

// ─── Device-refresh hook ────────────────────────────────────────────────────
// Returns a countdown (0-60) and the last time data was refreshed.
function useDeviceRefresh(intervalSec = 60) {
  const [countdown, setCountdown] = useState(intervalSec);
  const [refreshedAt, setRefreshedAt] = useState(new Date());
  const [tick, setTick] = useState(0); // increment to signal "data should re-fetch"

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setRefreshedAt(new Date());
          setTick((t) => t + 1);
          return intervalSec;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [intervalSec]);

  return { countdown, refreshedAt, tick };
}

// ─── Emergency alert hook ───────────────────────────────────────────────────
// Tracks which alert IDs have already been surfaced so we never re-show the same one.
function useEmergencyAlert(alerts: Anomaly[]) {
  const [activeEmergency, setActiveEmergency] = useState<Anomaly | null>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (activeEmergency) return; // one at a time
    const unacked = alerts.find(
      (a) =>
        a.severity === 'high' &&
        !a.acknowledged &&
        a.id &&
        !seenIds.current.has(a.id),
    );
    if (unacked) {
      seenIds.current.add(unacked.id!);
      setActiveEmergency(unacked);
    }
  }, [alerts, activeEmergency]);

  const dismiss = useCallback(() => setActiveEmergency(null), []);

  return { activeEmergency, dismiss };
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const hrGradientId = React.useId();
  const { userData } = useFirebase();
  const { theme, toggleTheme, isDark } = useTheme();

  // ── State ──────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalSigns[]>([]);
  const [historicalData, setHistoricalData] = useState<VitalSigns[]>([]);
  const [alerts, setAlerts] = useState<Anomaly[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isExporting, setIsExporting] = useState(false);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showThresholdEditor, setShowThresholdEditor] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientData | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mockNow, setMockNow] = useState(() => new Date());
  const [mockNowSlow, setMockNowSlow] = useState(() => new Date());
  const seededRef = useRef(false);

  // Device config 60s refresh
  const { countdown, refreshedAt, tick: deviceTick } = useDeviceRefresh(60);

  // ── Seed Mock Patients if not exists ────────────────────────────────────────
  useEffect(() => {
    // Seed logic removed to clean up hardcoded features.
    // Use an external script or admin interface to add patients.
  }, []);

  // ── Audit logger ────────────────────────────────────────────────────────────
  const logAudit = async (action: string, resourceType: string, resourceId: string, details?: any) => {
    try {
      const logData: any = {
        userId: auth.currentUser?.uid || 'anonymous',
        action, resourceType, resourceId,
        status: 'success',
        timestamp: new Date().toISOString(),
      };
      if (details !== undefined) logData.details = details;
      await addDoc(collection(db, 'audit_logs'), logData);
    } catch (e) { console.error('Audit log failed', e); }
  };

  const deletePatient = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'patients', patientId));
      if (selectedPatientId === patientId) {
        setSelectedPatientId(null);
        setPatient(null);
      }
      await logAudit('delete_patient', 'patient', patientId);
    } catch (err) {
      handleFirestoreError(err as any, OperationType.DELETE, `patients/${patientId}`);
    }
  };

  // ── Patient list snapshot ──────────────────────────────────────────────────
  // Filter patients based on user role: clinicians see their assigned patients, patients see their own record
  useEffect(() => {
    if (!userData) return;

    let q;
    if (userData.role === 'PATIENT') {
      // Patients see only their own record
      q = query(collection(db, 'patients'), where('id', '==', userData.uid));
    } else {
      // Clinicians/Admins see all patients (filtered by clinic in component)
      q = query(collection(db, 'patients'));
    }

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientData));
      
      // For clinicians (non-admin), filter by clinicId
      if (userData.role === 'CLINICIAN' && userData.clinicId) {
        data = data.filter(p => p.clinicId === userData.clinicId);
      }
      
      setPatients(data);
      // Auto-select first patient if none selected, but prefer own record for patients
      if (data.length > 0 && !selectedPatientId) {
        const ownRecord = data.find(p => p.id === userData.uid);
        setSelectedPatientId(ownRecord?.id ?? data[0].id);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'patients'));
    return unsub;
  }, [userData]);

  // ── Seed patient immediately from cached list (no Firestore round-trip) ──
  useEffect(() => {
    if (!selectedPatientId || patients.length === 0) return;
    setPatient(prev => {
      if (prev?.id === selectedPatientId) return prev;
      return patients.find(p => p.id === selectedPatientId) ?? prev;
    });
  }, [selectedPatientId, patients]);

  // ── Selected patient data + real-time subscriptions ───────────────────────
  useEffect(() => {
    if (!selectedPatientId) return;

    // Background authoritative fetch
    getDoc(doc(db, 'patients', selectedPatientId))
      .then(snap => {
        if (snap.exists()) {
          setPatient({ id: snap.id, ...snap.data() } as PatientData);
          logAudit('view_patient', 'patient', selectedPatientId);
        }
      })
      .catch(err => handleFirestoreError(err, OperationType.GET, `patients/${selectedPatientId}`));

    // Real-time vitals — Overview (last 30 samples, written by EdgeDevice every 5s)
    const vitalsQ = query(
      collection(db, 'patients', selectedPatientId, 'vitals'),
      orderBy('measuredAt', 'desc'),
      limit(30),
    );
    const unsubVitals = onSnapshot(vitalsQ, (snap) => {
      setVitalsHistory(snap.docs.map(d => d.data() as VitalSigns).reverse());
    });

    // Historical (for Trends tab)
    const histQ = query(
      collection(db, 'patients', selectedPatientId, 'vitals'),
      orderBy('measuredAt', 'desc'),
      limit(timeRange === '24h' ? 100 : 500),
    );
    let unsubHist: (() => void) | undefined;
    const histUnsub = onSnapshot(histQ, (snap) => {
      setHistoricalData(snap.docs.map(d => d.data() as VitalSigns).reverse());
    });
    unsubHist = histUnsub;

    // Anomalies — real-time from Firestore (written by EdgeDevice)
    const anomQ = query(
      collection(db, 'patients', selectedPatientId, 'anomalies'),
      orderBy('timestamp', 'desc'),
      limit(20),
    );
    const unsubAnom = onSnapshot(anomQ, (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Anomaly)));
    });

    return () => { unsubVitals(); unsubHist?.(); unsubAnom(); };
  }, [selectedPatientId, timeRange]);

  // ── Admin-only subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (userData?.role !== 'ADMIN' || activeTab !== 'audit') return;
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog))));
    return unsub;
  }, [userData, activeTab]);

  useEffect(() => {
    if (userData?.role !== 'ADMIN' || activeTab !== 'system_logs') return;
    const q = query(collection(db, 'system_errors'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, snap => setSystemErrors(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => handleFirestoreError(err, OperationType.LIST, 'system_errors'));
    return unsub;
  }, [userData, activeTab]);

  // ── Clocks ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!patient) return;
    const id = window.setInterval(() => setMockNow(new Date()), 5000);
    return () => clearInterval(id);
  }, [patient]);

  useEffect(() => {
    const id = window.setInterval(() => setMockNowSlow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAcknowledge = async (alertId: string) => {
    if (!selectedPatientId) return;
    try {
      await updateDoc(doc(db, 'patients', selectedPatientId, 'anomalies', alertId), {
        acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: auth.currentUser?.uid || 'anonymous',
      });
      logAudit('acknowledge_alert', 'anomaly', alertId, { patientId: selectedPatientId });
    } catch (err) {
      handleFirestoreError(err as any, OperationType.UPDATE, `anomalies/${alertId}`);
    }
  };

  const handleEscalate = async (alertId: string) => {
    if (!selectedPatientId || !alertId) return;
    try {
      await updateDoc(doc(db, 'patients', selectedPatientId, 'anomalies', alertId), {
        escalated: true,
        escalatedAt: new Date().toISOString(),
        escalatedBy: auth.currentUser?.uid || 'anonymous',
      });
      logAudit('escalate_alert', 'anomaly', alertId, { patientId: selectedPatientId });
    } catch (err) {
      handleFirestoreError(err as any, OperationType.UPDATE, `anomalies/${alertId}`);
    }
  };

  const updateThresholds = async (newThresholds: PatientData['thresholds']) => {
    if (!selectedPatientId) return;
    try {
      await updateDoc(doc(db, 'patients', selectedPatientId), {
        thresholds: newThresholds, updatedAt: new Date().toISOString(),
      });
      setPatient(prev => prev ? { ...prev, thresholds: newThresholds } : null);
      logAudit('update_thresholds', 'patient', selectedPatientId, newThresholds);
    } catch (err) {
      handleFirestoreError(err as any, OperationType.UPDATE, `patients/${selectedPatientId}`);
    }
  };

  const handleExport = async () => {
    if (!patient || displayedHistoricalData.length === 0) return;
    setIsExporting(true);
    try {
      const csv = [
        ['Timestamp', 'HR (BPM)', 'SpO2 (%)', 'Temp (°C)', 'Glucose (mg/dL)', 'Systolic', 'Diastolic'],
        ...displayedHistoricalData.map(v => [v.measuredAt, v.heartRate, v.spo2, v.temperature, v.glucose, v.systolicBP || '', v.diastolicBP || '']),
      ].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `VitalsEdge_${patient.lastName}_${new Date().toISOString().split('T')[0]}.csv`;
      a.style.visibility = 'hidden';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      await logAudit('export_data', 'patient', selectedPatientId!, { count: displayedHistoricalData.length });
    } catch { } finally { setIsExporting(false); }
  };

  // ── Derived telemetry ──────────────────────────────────────────────────────
  const mockTelemetry = useMemo(
    () => (patient ? generateMockTelemetryState(patient, timeRange, mockNow) : null),
    [patient, timeRange, mockNow],
  );

  const displayedVitalsHistory = vitalsHistory.length > 0 ? vitalsHistory : mockTelemetry?.overviewSeries ?? [];
  const displayedHistoricalData = historicalData.length > 0 ? historicalData : mockTelemetry?.historicalSeries ?? [];
  const displayedAlerts = alerts.length > 0 ? alerts : mockTelemetry?.anomalies ?? [];
  const telemetrySourceLabel = vitalsHistory.length > 0 ? 'Live device telemetry' : mockTelemetry?.sourceLabel ?? 'No telemetry available';
  const latestVitals = displayedVitalsHistory[displayedVitalsHistory.length - 1];
  const isLive = vitalsHistory.length > 0;

  // Notification map (slow clock — all patients)
  const patientTelemetryMap = useMemo(() => (
    Object.fromEntries(patients.map(p => [p.id, generateMockTelemetryState(p, '24h', mockNowSlow)]))
  ), [patients, mockNowSlow]);

  const recentSignalFeed = displayedVitalsHistory.slice(-6).reverse();

  const notificationItems = useMemo(() => {
    const nowIso = mockNowSlow.toISOString();
    return patients
      .flatMap(p => {
        const src = p.id === selectedPatientId ? displayedAlerts : patientTelemetryMap[p.id]?.anomalies ?? [];
        return src.map((a, i) => ({
          id: a.id ?? `${p.id}-${a.type}-${i}`,
          patientName: `${p.firstName} ${p.lastName}`,
          mrn: p.mrn, condition: p.condition,
          severity: a.severity, message: a.message,
          timestamp: a.timestamp ?? nowIso,
          acknowledged: Boolean(a.acknowledged),
          patientId: p.id,
        }));
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [patients, selectedPatientId, displayedAlerts, patientTelemetryMap, mockNowSlow]);

  const urgentCount = notificationItems.filter(n => n.severity === 'high' && !n.acknowledged).length;
  const openCount = notificationItems.filter(n => !n.acknowledged).length;

  // ── Emergency alert ─────────────────────────────────────────────────────────
  const { activeEmergency, dismiss: dismissEmergency } = useEmergencyAlert(displayedAlerts);

  const complianceLabels = getComplianceFooterLabels();

  const navigateTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  }, []);

  // ── Nav helper ──────────────────────────────────────────────────────────────
  const navClass = (tab: ActiveTab) => clsx(
    'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors',
    activeTab === tab
      ? 'border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
      : 'border border-transparent text-neutral-600 hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/60',
  );

  // ── Roster Alerts (All Patients) ──────────────────────────────────────────
  const rosterAlerts = useMemo(() => {
    return patients.flatMap(p => {
      if (p.id === selectedPatientId) return displayedAlerts;
      return patientTelemetryMap[p.id]?.anomalies ?? [];
    });
  }, [patients, selectedPatientId, displayedAlerts, patientTelemetryMap]);

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const sidebar = (
    <>
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md shadow-blue-600/30">
          <Activity className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-neutral-900 dark:text-white">VitalsEdge</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Clinical monitoring</p>
        </div>
      </div>

      {/* Patients (Roster) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <PatientRoster
          patients={patients}
          selectedPatientId={selectedPatientId}
          onPatientSelect={(id) => {
            setSelectedPatientId(id);
            navigateTab('overview');
          }}
          alerts={rosterAlerts}
        />
      </div>

      {/* Nav */}
      <nav className="flex shrink-0 flex-col gap-1.5 border-t border-neutral-100 dark:border-neutral-800 px-4 py-4">
        <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Workspace</div>
        <button type="button" onClick={() => navigateTab('overview')} className={navClass('overview')}>
          <Activity className="h-4 w-4 shrink-0" /> Overview
        </button>
        <button type="button" onClick={() => navigateTab('rag_assistant')} className={navClass('rag_assistant')}>
          <MessageSquare className="h-4 w-4 shrink-0 text-emerald-500" /> AI Medical Assistant
        </button>
        <button type="button" onClick={() => navigateTab('trends')} className={navClass('trends')}>
          <Clipboard className="h-4 w-4 shrink-0" /> Historical Trends
        </button>
        <button type="button" onClick={() => navigateTab('settings')} className={navClass('settings')}>
          <Cpu className="h-4 w-4 shrink-0" /> Device Config
        </button>
        {userData?.role === 'ADMIN' && <>
          <div className="mb-1 mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Admin</div>
          <button type="button" onClick={() => navigateTab('clinicians')} className={navClass('clinicians')}>
            <Users className="h-4 w-4 shrink-0" /> Clinician Management
          </button>
          <button type="button" onClick={() => navigateTab('clinic')} className={navClass('clinic')}>
            <Shield className="h-4 w-4 shrink-0" /> Clinic Overview
          </button>
        </>}
        {(userData?.role === 'ADMIN' || userData?.role === 'CLINIC_MANAGER' || userData?.role === 'CLINICIAN') && (
          <button type="button" onClick={() => navigateTab('patients')} className={navClass('patients')}>
            <Clipboard className="h-4 w-4 shrink-0" /> Patient Records
          </button>
        )}
        {userData?.role === 'ADMIN' && <>
          <button type="button" onClick={() => navigateTab('audit')} className={navClass('audit')}>
            <Shield className="h-4 w-4 shrink-0" /> Audit Trail
          </button>
          <button type="button" onClick={() => navigateTab('system_logs')} className={navClass('system_logs')}>
            <AlertTriangle className="h-4 w-4 shrink-0" /> System Logs
          </button>
        </>}
      </nav>

      {complianceLabels.length > 0 && (
        <div className="shrink-0 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-neutral-400 dark:text-neutral-600">
            {complianceLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // ── Header actions ──────────────────────────────────────────────────────────
  const topNavActions = (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Live status indicator */}
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold">
        {isLive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-green-700 dark:text-green-400">Live</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-amber-700 dark:text-amber-400">Simulated</span>
          </>
        )}
      </div>

      {/* Dark / light toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Bell */}
      <div className="relative">
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setShowNotifications(v => !v)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
        >
          <Bell className="h-4 w-4" />
          {openCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
              {Math.min(openCount, 9)}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-[min(94vw,23rem)] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">Patient alerts</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {urgentCount} urgent · {openCount} open
                  </div>
                </div>
                <button onClick={() => setShowNotifications(false)} className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Close</button>
              </div>
              <div className="max-h-[26rem] overflow-y-auto p-2.5">
                {notificationItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-neutral-500">No active notifications.</div>
                ) : (
                  <div className="space-y-2">
                    {notificationItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 px-4 py-3 text-left transition-colors hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setSelectedPatientId(item.patientId);
                          navigateTab('overview');
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white">{item.patientName}</div>
                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{item.mrn} · {item.condition}</div>
                          </div>
                          <span className={clsx(
                            'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                            item.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                              : item.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                          )}>
                            {item.severity}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-neutral-600 dark:text-neutral-400">{item.message}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add patient — only shown for staff roles */}
      {userData?.role !== 'PATIENT' && (
        <Button type="button" size="sm" onClick={() => setShowOnboarding(true)}>
          <Users className="h-4 w-4" />
          Add patient
        </Button>
      )}

      {/* Profile menu — always rightmost in the header */}
      <UserProfileMenu
        fullName={userData?.fullName ?? auth.currentUser?.displayName ?? undefined}
        email={auth.currentUser?.email ?? undefined}
        role={userData?.role}
        onNavigate={(target) => {
          if (target === 'profile') navigateTab('profile');
          if (target === 'settings') navigateTab('user_settings');
        }}
        onSignOut={() => {
          setPatient(null);
          setPatients([]);
          setAlerts([]);
          setVitalsHistory([]);
          setHistoricalData([]);
        }}
      />
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Emergency alert — shown over everything */}
      {activeEmergency && patient && (
        <EmergencyAlertModal
          alert={activeEmergency}
          patient={patient}
          onAcknowledge={handleAcknowledge}
          onEscalate={handleEscalate}
          onDismiss={dismissEmergency}
        />
      )}

      <AuthenticatedLayout
        title={TAB_TITLES[activeTab]}
        subtitle={
          patient && ['overview', 'trends', 'settings'].includes(activeTab)
            ? `${patient.firstName} ${patient.lastName}`
            : undefined
        }
        topNavActions={topNavActions}
        sidebar={sidebar}
        activeTab={activeTab}
        onNavigateHome={() => navigateTab('home')}
        onNavigateDashboard={() => navigateTab('overview')}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {/* Onboarding modal */}
        <AnimatePresence>
          {showOnboarding && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
              <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
                <OnboardingFlow onComplete={() => setShowOnboarding(false)} onCancel={() => setShowOnboarding(false)} />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Tab routing */}
        {activeTab === 'home' ? (
          <HomePage
            fullName={userData?.fullName ?? auth.currentUser?.displayName ?? undefined}
            role={userData?.role}
            clinicName={(userData as any)?.clinicName}
          />
        ) : activeTab === 'profile' ? (
          <EnhancedProfileView
            user={userData}
            onBack={() => navigateTab('home')}
          />
        ) : activeTab === 'user_settings' ? (
          <UserSettingsView
            user={userData}
            onBack={() => navigateTab('home')}
            onSignOut={() => {
              auth.signOut();
              navigateTab('home');
            }}
          />
        ) : activeTab === 'rag_assistant' ? (
          <div className="mx-auto w-full max-w-4xl px-0 sm:px-2">
            <div className="h-[min(52rem,calc(100dvh-6.5rem))] min-h-[22rem] w-full sm:h-[min(56rem,calc(100dvh-7.5rem))] sm:min-h-[28rem]">
              <MedicalRAGAssistant
                patientId={selectedPatientId ?? undefined}
                userRole={userData?.role === 'ADMIN' ? 'admin' : userData?.role === 'DOCTOR' || userData?.role === 'CLINICIAN' ? 'clinician' : 'patient'}
                userName={userData?.fullName ?? auth.currentUser?.displayName ?? 'User'}
              />
            </div>
          </div>
        ) : activeTab === 'audit' ? (
          <AuditTrail logs={auditLogs} />
        ) : activeTab === 'system_logs' ? (
          <SystemLogs logs={systemErrors} />
        ) : activeTab === 'settings' ? (
          <DeviceConfigView
            patient={patient}
            latestVitals={latestVitals}
            alerts={displayedAlerts}
            telemetrySourceLabel={telemetrySourceLabel}
            isLive={isLive}
            countdown={countdown}
            refreshedAt={refreshedAt}
            onConfigureThresholds={() => setShowThresholdEditor(true)}
          />
        ) : activeTab === 'clinicians' ? (
          <AdminClinicianManagement />
        ) : activeTab === 'patients' ? (
          <PatientManagement
            patients={patients}
            alerts={rosterAlerts}
            onAddClick={() => setShowOnboarding(true)}
            onEditClick={(p) => setEditingPatient(p)}
            onDeleteClick={(id) => deletePatient(id)}
            onViewClick={(id) => {
              setSelectedPatientId(id);
              navigateTab('overview');
            }}
          />
        ) : activeTab === 'clinic' ? (
          <ClinicOverview patients={patients} alerts={displayedAlerts} />
        ) : activeTab === 'trends' ? (
          <TrendsView
            patient={patient}
            vitalsHistory={displayedHistoricalData}
            telemetrySourceLabel={telemetrySourceLabel}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        ) : (
          /* ── OVERVIEW ── */
          <>
            {patients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No patients enrolled"
                description="Add a patient to begin monitoring."
                action={{ label: 'Add patient', onClick: () => setShowOnboarding(true) }}
              />
            ) : !patient ? (
              <LoadingState message="Loading patient data…" submessage="Fetching vitals from your workspace." />
            ) : (
              <>
                {/* Patient header */}
                <header className="mb-8 flex flex-col gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-8 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                      {patient.firstName} {patient.lastName}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <span>Age: {patient.age}</span>
                      <span>MRN: {patient.mrn}</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{patient.condition}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={clsx(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold shadow-sm',
                      isLive
                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400'
                        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
                    )}>
                      {isLive ? <Wifi className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
                      {telemetrySourceLabel}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      Cloud sync active
                    </div>
                  </div>
                </header>

                {/* Vitals grid */}
                <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <VitalSignCard label="Heart Rate" value={latestVitals?.heartRate || 0} unit="BPM" icon={<Heart className="h-4 w-4" />} status={(latestVitals?.heartRate ?? 0) > 100 || (latestVitals?.heartRate ?? 0) < 60 ? 'alert' : 'normal'} />
                  <VitalSignCard label="SpO2" value={latestVitals?.spo2 || 0} unit="%" icon={<Activity className="h-4 w-4" />} status={(latestVitals?.spo2 ?? 100) < 95 ? 'alert' : 'normal'} />
                  <VitalSignCard label="Temperature" value={latestVitals?.temperature || 0} unit="°C" icon={<Thermometer className="h-4 w-4" />} status={(latestVitals?.temperature ?? 0) > 38 ? 'alert' : 'normal'} />
                  <VitalSignCard label="Glucose" value={latestVitals?.glucose || 0} unit="mg/dL" icon={<Droplets className="h-4 w-4" />} status={(latestVitals?.glucose ?? 0) > 140 ? 'warning' : 'normal'} />
                </div>

                {/* Signal feed + monitoring status */}
                <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
                  <Card className="xl:col-span-2">
                    <CardHeader title="Signal feed" subtitle="Real-time patient readings — 5 s sampling cadence" action={<Radio className="h-4 w-4 text-blue-600" />} />
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                            <th className="py-3 pr-4">Time</th>
                            <th className="py-3 pr-4">HR</th>
                            <th className="py-3 pr-4">SpO2</th>
                            <th className="py-3 pr-4">Temp</th>
                            <th className="py-3 pr-4">Glucose</th>
                            <th className="py-3">BP</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-neutral-700 dark:text-neutral-300">
                          {recentSignalFeed.map((r) => (
                            <tr key={r.measuredAt} className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
                              <td className="py-3 pr-4 text-xs font-medium text-neutral-400">{new Date(r.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                              <td className="py-3 pr-4 font-semibold">{r.heartRate} BPM</td>
                              <td className="py-3 pr-4">{r.spo2}%</td>
                              <td className="py-3 pr-4">{r.temperature}°C</td>
                              <td className="py-3 pr-4">{r.glucose} mg/dL</td>
                              <td className="py-3 text-neutral-500">{r.systolicBP}/{r.diastolicBP}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card>
                    <CardHeader title="Monitoring status" subtitle="Session telemetry posture" action={<Cpu className="h-4 w-4 text-neutral-400" />} />
                    <div className="space-y-4">
                      <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Telemetry source</div>
                        <div className="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-200">{telemetrySourceLabel}</div>
                      </div>
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Device</div>
                        <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{patient.deviceId || 'Awaiting assignment'}</div>
                        <div className="text-xs text-neutral-500">{patient.condition}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Open alerts</div>
                          <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
                            {displayedAlerts.filter(a => !a.acknowledged).length}
                          </div>
                        </div>
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Last sync</div>
                          <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">
                            {latestVitals ? new Date(latestVitals.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Charts + anomaly log */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="space-y-8 lg:col-span-2">
                    <ChartCard title="Heart rate — real-time" subtitle="Last 30 samples with threshold reference lines" chartClassName="border-0 bg-transparent p-0">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                          <AreaChart data={displayedVitalsHistory}>
                            <defs>
                              <linearGradient id={hrGradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="measuredAt" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleTimeString()} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <ReferenceLine y={patient.thresholds.hr.max} stroke="#dc2626" strokeDasharray="4 4" label={{ value: `Max ${patient.thresholds.hr.max}`, fontSize: 9, fill: '#dc2626' }} />
                            <ReferenceLine y={patient.thresholds.hr.min} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Min ${patient.thresholds.hr.min}`, fontSize: 9, fill: '#f59e0b' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                            <Area type="monotone" dataKey="heartRate" stroke="#2563eb" fill={`url(#${hrGradientId})`} strokeWidth={2} isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>

                    <ChartCard title="Glucose & SpO2" subtitle="Stability over recent samples" chartClassName="border-0 bg-transparent p-0">
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                          <LineChart data={displayedVitalsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="measuredAt" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleTimeString()} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <ReferenceLine y={patient.thresholds.glucose.max} stroke="#dc2626" strokeDasharray="4 4" />
                            <ReferenceLine y={patient.thresholds.spo2.min} stroke="#f59e0b" strokeDasharray="4 4" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                            <Line type="monotone" dataKey="glucose" stroke="#2563eb" strokeWidth={2} dot={false} name="Glucose" isAnimationActive={false} />
                            <Line type="monotone" dataKey="spo2" stroke="#059669" strokeWidth={2} dot={false} name="SpO2" isAnimationActive={false} strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  </div>

                  {/* Anomaly sidebar */}
                  <Card className="p-5">
                    <CardHeader title="Anomaly log" subtitle="Edge-detected alerts for this patient" action={<Bell className="h-4 w-4 text-neutral-400" />} />
                    <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {displayedAlerts.length === 0 ? (
                          <EmptyState icon={Bell} title="No active anomalies" description="No anomaly events in the current monitoring window." />
                        ) : (
                          displayedAlerts.map((alert) => (
                            <motion.button
                              key={alert.id}
                              type="button"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-left transition-colors hover:bg-white dark:hover:bg-neutral-800"
                              onClick={() => alert.id && handleAcknowledge(alert.id)}
                            >
                              <div className="mb-2 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className={`h-4 w-4 ${alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">{alert.type}</span>
                                </div>
                                <span className="text-xs text-neutral-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{alert.message}</p>
                              <div className="mt-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 pt-3 text-xs">
                                <span className="font-medium text-neutral-500">Value: {alert.value}</span>
                                <span className={alert.acknowledged ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-blue-600 dark:text-blue-400'}>
                                  {alert.acknowledged ? 'Acknowledged ✓' : 'Tap to acknowledge'}
                                </span>
                              </div>
                            </motion.button>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </AuthenticatedLayout>

      {/* Floating Medical Assistant (hidden when full assistant page is active) */}
      {activeTab !== 'rag_assistant' && (
        <MedicalAssistant patientId={selectedPatientId ?? undefined} />
      )}

      {showThresholdEditor && patient && (
        <ThresholdEditor patient={patient} onClose={() => setShowThresholdEditor(false)} onSave={updateThresholds} />
      )}

      {editingPatient && (
        <PatientEditor
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={(updated) => {
            setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
            if (patient?.id === updated.id) setPatient(updated);
          }}
        />
      )}
    </>
  );
};

// ─── DeviceConfigView ────────────────────────────────────────────────────────

interface DeviceConfigProps {
  patient: PatientData | null;
  latestVitals?: VitalSigns;
  alerts: Anomaly[];
  telemetrySourceLabel: string;
  isLive: boolean;
  countdown: number;
  refreshedAt: Date;
  onConfigureThresholds: () => void;
}

const DeviceConfigView: React.FC<DeviceConfigProps> = ({
  patient, latestVitals, alerts, telemetrySourceLabel, isLive,
  countdown, refreshedAt, onConfigureThresholds,
}) => {
  if (!patient) return <LoadingState message="Loading device profile…" submessage="Select a patient from the roster." />;

  const params = [
    {
      label: 'Heart Rate',
      icon: <Heart className="h-4 w-4" />,
      current: latestVitals ? `${latestVitals.heartRate} BPM` : '—',
      target: `${patient.thresholds.hr.min}–${patient.thresholds.hr.max} BPM`,
      inRange: latestVitals ? latestVitals.heartRate >= patient.thresholds.hr.min && latestVitals.heartRate <= patient.thresholds.hr.max : true,
      value: latestVitals?.heartRate,
      min: patient.thresholds.hr.min,
      max: patient.thresholds.hr.max,
    },
    {
      label: 'SpO2',
      icon: <Activity className="h-4 w-4" />,
      current: latestVitals ? `${latestVitals.spo2}%` : '—',
      target: `≥ ${patient.thresholds.spo2.min}%`,
      inRange: latestVitals ? latestVitals.spo2 >= patient.thresholds.spo2.min : true,
      value: latestVitals?.spo2,
      min: patient.thresholds.spo2.min,
      max: 100,
    },
    {
      label: 'Temperature',
      icon: <Thermometer className="h-4 w-4" />,
      current: latestVitals ? `${latestVitals.temperature}°C` : '—',
      target: `≤ ${patient.thresholds.temperature.max}°C`,
      inRange: latestVitals ? latestVitals.temperature <= patient.thresholds.temperature.max : true,
      value: latestVitals?.temperature,
      min: 35,
      max: patient.thresholds.temperature.max + 1,
    },
    {
      label: 'Glucose',
      icon: <Droplets className="h-4 w-4" />,
      current: latestVitals ? `${latestVitals.glucose} mg/dL` : '—',
      target: `${patient.thresholds.glucose.min}–${patient.thresholds.glucose.max} mg/dL`,
      inRange: latestVitals ? latestVitals.glucose >= patient.thresholds.glucose.min && latestVitals.glucose <= patient.thresholds.glucose.max : true,
      value: latestVitals?.glucose,
      min: patient.thresholds.glucose.min,
      max: patient.thresholds.glucose.max,
    },
    {
      label: 'Systolic BP',
      icon: <Zap className="h-4 w-4" />,
      current: latestVitals ? `${latestVitals.systolicBP} mmHg` : '—',
      target: `≤ ${patient.thresholds.systolicBP?.max ?? 140} mmHg`,
      inRange: latestVitals && patient.thresholds.systolicBP ? latestVitals.systolicBP! <= patient.thresholds.systolicBP.max : true,
      value: latestVitals?.systolicBP,
      min: 90,
      max: (patient.thresholds.systolicBP?.max ?? 140) + 10,
    },
    {
      label: 'Diastolic BP',
      icon: <Zap className="h-4 w-4" />,
      current: latestVitals ? `${latestVitals.diastolicBP} mmHg` : '—',
      target: `≤ ${patient.thresholds.diastolicBP?.max ?? 90} mmHg`,
      inRange: latestVitals && patient.thresholds.diastolicBP ? latestVitals.diastolicBP! <= patient.thresholds.diastolicBP.max : true,
      value: latestVitals?.diastolicBP,
      min: 50,
      max: (patient.thresholds.diastolicBP?.max ?? 90) + 10,
    },
  ];

  const outOfRange = params.filter(p => !p.inRange);
  const pctComplete = (countdown / 60) * 100;
  const circumference = 2 * Math.PI * 14;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Device Configuration</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Live parameters from the monitoring node assigned to this patient. Auto-refreshes every 60 seconds.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={onConfigureThresholds}>
          <Settings className="h-4 w-4" /> Configure thresholds
        </Button>
      </div>

      {/* Status bar */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Connection status */}
        <div className={clsx(
          'flex items-center gap-4 rounded-2xl border p-5',
          isLive
            ? 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-950/40'
            : 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/40',
        )}>
          {isLive ? <Wifi className="h-8 w-8 text-green-600 dark:text-green-400" /> : <WifiOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
          <div>
            <div className={clsx('text-xs font-bold uppercase tracking-widest', isLive ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')}>
              {isLive ? 'Device connected' : 'Simulation mode'}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">
              {patient.deviceId || 'VE-NODE-UNASSIGNED'}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Patient: {patient.firstName} {patient.lastName} · MRN {patient.mrn}
            </div>
          </div>
        </div>

        {/* Refresh countdown */}
        <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
              <circle cx="24" cy="24" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="14" fill="none"
                stroke="#2563eb" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pctComplete / 100)}
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <span className="absolute text-xs font-bold text-neutral-900 dark:text-white">{countdown}</span>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Next refresh</div>
            <div className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">{countdown}s</div>
            <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
              <RefreshCw className="h-3 w-3" />
              Last: {refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Alert posture */}
        <div className={clsx(
          'flex items-center gap-4 rounded-2xl border p-5',
          outOfRange.length > 0
            ? 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/40'
            : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/40',
        )}>
          <AlertTriangle className={clsx('h-8 w-8', outOfRange.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')} />
          <div>
            <div className={clsx('text-xs font-bold uppercase tracking-widest', outOfRange.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400')}>
              {outOfRange.length > 0 ? `${outOfRange.length} out of range` : 'All within range'}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">
              {alerts.filter(a => !a.acknowledged).length} open anomalies
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">60 s sampling cadence</div>
          </div>
        </div>
      </div>

      {/* Parameter grid */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Parameter alignment" subtitle="Current readings vs configured threshold boundaries" />
          <div className="space-y-3">
            {params.map((row) => {
              const pct = row.value !== undefined && row.max > row.min
                ? Math.min(100, Math.max(0, ((row.value - row.min) / (row.max - row.min)) * 100))
                : 50;
              return (
                <div key={row.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 dark:text-neutral-500">{row.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">{row.label}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Target: {row.target}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-neutral-700 dark:text-neutral-300">{row.current}</span>
                      <span className={clsx(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                        row.inRange ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                      )}>
                        {row.inRange ? '✓ OK' : '⚠ Review'}
                      </span>
                    </div>
                  </div>
                  {/* Fill bar */}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className={clsx('h-1.5 rounded-full transition-all duration-700', row.inRange ? 'bg-blue-500' : 'bg-red-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          {/* Device state card */}
          <Card>
            <CardHeader title="Device state" subtitle="Node identity and telemetry source" />
            <div className="space-y-3">
              <InfoRow label="Device ID" value={patient.deviceId || 'UNASSIGNED'} mono />
              <InfoRow label="Condition profile" value={patient.condition} />
              <InfoRow label="Sampling rate" value="5 s / reading" />
              <InfoRow label="Dashboard refresh" value="60 s cadence" />
              <InfoRow label="Telemetry feed" value={telemetrySourceLabel} />
              <InfoRow label="Last vitals at" value={latestVitals ? new Date(latestVitals.measuredAt).toLocaleTimeString() : 'Pending'} />
            </div>
          </Card>

          {/* Recent anomalies */}
          <Card>
            <CardHeader title="Recent anomaly posture" subtitle="Last 3 detected events" />
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-300">
                No active anomalies detected.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((a) => (
                  <div key={a.id ?? `${a.type}-${a.timestamp}`} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">{a.type.replace(/_/g, ' ')}</span>
                      <span className={clsx(
                        'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                        a.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          : a.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                      )}>
                        {a.severity}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{a.message}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

// ─── Small helper ────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-2 last:border-b-0 last:pb-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">{label}</span>
    <span className={clsx('text-xs font-semibold text-neutral-800 dark:text-neutral-200', mono && 'font-mono')}>{value}</span>
  </div>
);

// ─── TrendsView ──────────────────────────────────────────────────────────────
const TrendsView = ({
  patient, vitalsHistory, telemetrySourceLabel, timeRange, onTimeRangeChange,
}: {
  patient: PatientData | null;
  vitalsHistory: VitalSigns[];
  telemetrySourceLabel: string;
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (r: '24h' | '7d' | '30d') => void;
}) => {
  const spo2GradientId = React.useId();
  if (!patient) return <LoadingState message="Loading trends…" submessage="Select a patient from the roster." />;

  const summaryCards = [
    { label: 'Avg HR', value: vitalsHistory.length > 0 ? `${Math.round(vitalsHistory.reduce((s, e) => s + e.heartRate, 0) / vitalsHistory.length)} BPM` : 'N/A' },
    { label: 'Min SpO2', value: vitalsHistory.length > 0 ? `${Math.min(...vitalsHistory.map(e => e.spo2))}%` : 'N/A' },
    { label: 'Peak Temp', value: vitalsHistory.length > 0 ? `${Math.max(...vitalsHistory.map(e => e.temperature)).toFixed(1)}°C` : 'N/A' },
    { label: 'Latest Glucose', value: vitalsHistory.length > 0 ? `${vitalsHistory[vitalsHistory.length - 1].glucose} mg/dL` : 'N/A' },
  ];

  const fmtX = (val: string) => {
    const d = new Date(val);
    return timeRange === '24h'
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Clinical Trends</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Longitudinal vitals across the current monitoring window · {patient.mrn}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            {telemetrySourceLabel}
          </span>
          <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1">
            {(['24h', '7d', '30d'] as const).map(r => (
              <button key={r} onClick={() => onTimeRangeChange(r)}
                className={clsx('rounded-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all',
                  timeRange === r ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white')}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(c => (
          <Card key={c.label} className="p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <ChartCard title="Blood Pressure & Glucose" subtitle="Systolic, diastolic, and glucose overlay — threshold lines shown">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={360}>
              <LineChart data={vitalsHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4d4d8" />
                <XAxis dataKey="measuredAt" tick={{ fontSize: 9 }} tickFormatter={fmtX} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#334155' }} />
                <ReferenceLine y={patient.thresholds.glucose.max} stroke="#dc2626" strokeDasharray="4 4" />
                <ReferenceLine y={patient.thresholds.glucose.min} stroke="#f59e0b" strokeDasharray="4 4" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', color: '#f8fafc', fontSize: 10 }} />
                <Line type="monotone" dataKey="systolicBP" stroke="#EF4444" strokeWidth={2} dot={false} name="Systolic" isAnimationActive={false} />
                <Line type="monotone" dataKey="diastolicBP" stroke="#F59E0B" strokeWidth={2} dot={false} name="Diastolic" isAnimationActive={false} />
                <Line type="stepAfter" dataKey="glucose" stroke="#2563EB" strokeWidth={1.5} dot={false} name="Glucose" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="SpO2 & Temperature" subtitle="Oxygen saturation and temperature drift over time">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={360}>
              <AreaChart data={vitalsHistory}>
                <defs>
                  <linearGradient id={spo2GradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4d4d8" />
                <XAxis dataKey="measuredAt" tick={{ fontSize: 9 }} tickFormatter={fmtX} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#334155' }} />
                <ReferenceLine y={patient.thresholds.spo2.min} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={patient.thresholds.temperature.max} stroke="#dc2626" strokeDasharray="4 4" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', color: '#f8fafc', fontSize: 10 }} />
                <Area type="monotone" dataKey="spo2" stroke="#10B981" fill={`url(#${spo2GradientId})`} strokeWidth={2} name="SpO2 %" isAnimationActive={false} />
                <Line type="monotone" dataKey="temperature" stroke="#3B82F6" strokeWidth={2} dot={false} name="Temp °C" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </section>
  );
};

// ─── Other sub-views (unchanged structure, dark mode classes added) ───────────

const ClinicOverview = ({ patients, alerts }: { patients: PatientData[]; alerts: Anomaly[] }) => {
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged);
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Clinic Overview</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Aggregate roster health, active alerts, and coverage.</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <VitalSignCard label="Total Patients" value={patients.length} unit="records" icon={<Users className="h-4 w-4" />} status="normal" />
        <VitalSignCard label="Active Alerts" value={alerts.filter(a => !a.acknowledged).length} unit="open" icon={<Bell className="h-4 w-4" />} status={alerts.some(a => !a.acknowledged) ? 'warning' : 'normal'} />
        <VitalSignCard label="Critical Alerts" value={highAlerts.length} unit="high" icon={<AlertTriangle className="h-4 w-4" />} status={highAlerts.length > 0 ? 'alert' : 'normal'} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Patient roster" subtitle="Assigned monitoring endpoints" />
          <div className="space-y-3">
            {patients.length === 0 ? <EmptyState icon={Users} title="No enrolled patients" description="Enroll a patient to populate the roster." /> : (
              patients.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">{p.firstName} {p.lastName}</div>
                    <div className="text-xs text-neutral-500">{p.condition}</div>
                  </div>
                  <div className="text-right text-xs text-neutral-500">
                    <div className="font-medium text-neutral-700 dark:text-neutral-300">{p.deviceId || 'UNASSIGNED'}</div>
                    <div>{p.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="System health" subtitle="Operational indicators" />
          <div className="space-y-6">
            <MetricBar label="Edge Node Connectivity" valueLabel="98.4%" fillClassName="bg-emerald-500" widthClassName="w-[98.4%]" />
            <MetricBar label="Avg Data Latency" valueLabel="142 ms" fillClassName="bg-blue-600" widthClassName="w-[15%]" />
            <MetricBar label="Alert Response Coverage" valueLabel={`${patients.length === 0 ? 0 : Math.max(40, 100 - highAlerts.length * 12)}%`} fillClassName="bg-amber-500" widthClassName={highAlerts.length > 0 ? 'w-[72%]' : 'w-[92%]'} />
          </div>
        </Card>
      </div>
    </section>
  );
};

const PatientManagement = ({
  patients,
  alerts,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onViewClick,
}: {
  patients: PatientData[];
  alerts: Anomaly[];
  onAddClick: () => void;
  onEditClick: (patient: PatientData) => void;
  onDeleteClick: (id: string) => void;
  onViewClick: (id: string) => void;
}) => (
  <section className="space-y-8">
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/20 bg-white/40 p-6 backdrop-blur-md dark:border-white/5 dark:bg-white/5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Patient Records</h2>
        <p className="mt-1 text-base text-neutral-600 dark:text-neutral-400">Manage the clinical roster and view comprehensive patient profiles.</p>
      </div>
      <Button onClick={onAddClick} size="lg" className="rounded-2xl shadow-lg shadow-blue-600/20">
        <Users className="h-5 w-5" /> Enroll New Patient
      </Button>
    </div>
    
    {patients.length === 0 ? (
      <EmptyState icon={Users} title="No registered patients" description="Your clinical roster is empty. Start by enrolling your first patient to begin monitoring." action={{ label: 'Enroll Patient', onClick: onAddClick }} />
    ) : (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map(p => {
          const patientAlerts = alerts.filter(a => a.patientId === p.id);
          const isStable = patientAlerts.length === 0;
          
          return (
            <Card key={p.id || p.mrn} className="group relative overflow-hidden border-white/40 bg-white/60 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-blue-500" padding="none">
              {/* Stability Accent Bar */}
              <div className={clsx(
                "h-1.5 w-full transition-opacity group-hover:opacity-80",
                isStable ? "bg-emerald-500" : "bg-red-500"
              )} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className={clsx(
                    "flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110",
                    isStable ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" : "bg-red-50 text-red-600 dark:bg-red-950/30"
                  )}>
                    <User className="h-7 w-7" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditClick(p)}
                      className="rounded-xl p-2.5 text-neutral-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                      title="Edit Profile"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDeleteClick(p.id)}
                      className="rounded-xl p-2.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                      title="Delete Record"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {p.firstName} {p.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx(
                      "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                      p.status === 'active' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    )}>
                      {p.status}
                    </span>
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 shadow-sm dark:bg-blue-950/40 dark:text-blue-300">
                      {p.condition}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-neutral-100 py-5 dark:border-neutral-800">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-1.5 text-slate-400 dark:bg-neutral-800">
                      <Fingerprint className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-neutral-600 dark:text-neutral-400">{p.mrn}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-1.5 text-slate-400 dark:bg-neutral-800">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="truncate text-neutral-600 dark:text-neutral-400">{p.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-1.5 text-slate-400 dark:bg-neutral-800">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-neutral-600 dark:text-neutral-400">{p.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                  <div className="flex items-center gap-2.5">
                    {isStable ? (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-tight text-emerald-700 dark:text-emerald-400">Status</p>
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Stable</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50">
                          <AlertTriangle className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-tight text-red-700 dark:text-red-400">Alerts</p>
                          <p className="text-xs font-semibold text-red-800 dark:text-red-300">{patientAlerts.length} Active</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onViewClick(p.id)} className="rounded-xl font-bold hover:bg-white dark:hover:bg-neutral-800">
                    View Profile <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    )}
  </section>
);

const AuditTrail = ({ logs }: { logs: AuditLog[] }) => (
  <section className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Security Audit Trail</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">High-value actions performed across the workspace.</p>
      </div>
      <span className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">Admin only</span>
    </div>
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-900 dark:bg-neutral-950 text-white text-[10px] uppercase tracking-widest">
            <th className="p-4 border-r border-white/10">Timestamp</th>
            <th className="p-4 border-r border-white/10">User</th>
            <th className="p-4 border-r border-white/10">Action</th>
            <th className="p-4 border-r border-white/10">Resource</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="text-[11px] font-mono">
          {logs.length === 0 ? (
            <tr><td colSpan={5} className="p-12 text-center text-sm text-neutral-500">No audit events recorded yet.</td></tr>
          ) : logs.map(log => (
            <tr key={log.id} className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <td className="p-4 border-r border-neutral-200 dark:border-neutral-700">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="p-4 border-r border-neutral-200 dark:border-neutral-700 opacity-60">{log.userId.slice(0, 8)}…</td>
              <td className="p-4 border-r border-neutral-200 dark:border-neutral-700 font-bold uppercase">{log.action}</td>
              <td className="p-4 border-r border-neutral-200 dark:border-neutral-700 opacity-70">{log.resourceType}: {log.resourceId}</td>
              <td className="p-4">
                <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                  {log.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const SystemLogs = ({ logs }: { logs: any[] }) => (
  <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">System Logs</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">Latest client-side Firestore and runtime issues.</p>
    </div>
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-900 dark:bg-neutral-950 text-white text-[10px] uppercase tracking-widest">
            <th className="p-4">Timestamp</th><th className="p-4">Op</th><th className="p-4">Path</th><th className="p-4">Error</th><th className="p-4">User</th>
          </tr>
        </thead>
        <tbody className="text-[10px] font-mono">
          {logs.length === 0 ? (
            <tr><td colSpan={5} className="p-12 text-center text-sm text-neutral-500">No system errors logged.</td></tr>
          ) : logs.map(log => (
            <tr key={log.id} className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-950/20">
              <td className="p-4 opacity-60">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="p-4 font-bold uppercase text-red-600 dark:text-red-400">{log.operationType}</td>
              <td className="p-4 opacity-70">{log.path || 'N/A'}</td>
              <td className="max-w-xs truncate p-4" title={log.error}>{log.error}</td>
              <td className="p-4 opacity-60">{log.authInfo?.userId?.slice(0, 8) || 'N/A'}…</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const MetricBar = ({ label, valueLabel, fillClassName, widthClassName }: { label: string; valueLabel: string; fillClassName: string; widthClassName: string }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <span className="font-semibold text-neutral-900 dark:text-white">{valueLabel}</span>
    </div>
    <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
      <div className={`h-2 rounded-full ${fillClassName} ${widthClassName}`} />
    </div>
  </div>
);

