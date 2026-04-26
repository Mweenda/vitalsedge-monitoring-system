import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VitalSigns, Anomaly, PatientData, AuditLog } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import {
  Activity, Heart, Thermometer, Droplets, AlertTriangle,
  Bell, Shield, Users, User, Clipboard, SettingsIcon, Calendar, Cpu, Radio,
  Sun, Moon, RefreshCw, Wifi, WifiOff, Zap,
  Trash2, Edit3, CheckCircle2, Mail, Fingerprint, Phone, MessageSquare,
  Search, Home, LayoutGrid, TrendingUp, FileText, ChevronRight,
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
import { clsx } from 'clsx';
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

function useDeviceRefresh(intervalSec = 60) {
  const [countdown, setCountdown] = useState(intervalSec);
  const [refreshedAt, setRefreshedAt] = useState(new Date());
  const [tick, setTick] = useState(0);

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

function useEmergencyAlert(alerts: Anomaly[]) {
  const [activeEmergency, setActiveEmergency] = useState<Anomaly | null>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (activeEmergency) return;
    const unacked = alerts.find(
      (a) => a.severity === 'high' && !a.acknowledged && a.id && !seenIds.current.has(a.id),
    );
    if (unacked) {
      seenIds.current.add(unacked.id!);
      setActiveEmergency(unacked);
    }
  }, [alerts, activeEmergency]);

  const dismiss = useCallback(() => setActiveEmergency(null), []);
  return { activeEmergency, dismiss };
}

export const Dashboard: React.FC = () => {
  const hrGradientId = React.useId();
  const { userData } = useFirebase();
  const { theme, toggleTheme, isDark } = useTheme();

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

  const { countdown, refreshedAt, tick: deviceTick } = useDeviceRefresh(60);
  const { activeEmergency, dismiss: dismissEmergency } = useEmergencyAlert(alerts);
  const complianceLabels = getComplianceFooterLabels();

  const navigateTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  }, []);

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
    if (!window.confirm('Are you sure you want to delete this patient record?')) return;
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

  useEffect(() => {
    if (!userData) return;
    let q;
    if (userData.role === 'PATIENT') {
      q = query(collection(db, 'patients'), where('id', '==', userData.uid));
    } else {
      q = query(collection(db, 'patients'));
    }
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientData));
      if (userData.role === 'CLINICIAN' && userData.clinicId) {
        data = data.filter(p => p.clinicId === userData.clinicId);
      }
      setPatients(data);
      if (data.length > 0 && !selectedPatientId) {
        const ownRecord = data.find(p => p.id === userData.uid);
        setSelectedPatientId(ownRecord?.id ?? data[0].id);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'patients'));
    return unsub;
  }, [userData]);

  useEffect(() => {
    if (!selectedPatientId || patients.length === 0) return;
    setPatient(prev => {
      if (prev?.id === selectedPatientId) return prev;
      return patients.find(p => p.id === selectedPatientId) ?? prev;
    });
  }, [selectedPatientId, patients]);

  useEffect(() => {
    if (!selectedPatientId) return;
    getDoc(doc(db, 'patients', selectedPatientId))
      .then(snap => {
        if (snap.exists()) {
          setPatient({ id: snap.id, ...snap.data() } as PatientData);
          logAudit('view_patient', 'patient', selectedPatientId);
        }
      })
      .catch(err => handleFirestoreError(err, OperationType.GET, `patients/${selectedPatientId}`));

    const vitalsQ = query(collection(db, 'patients', selectedPatientId, 'vitals'), orderBy('measuredAt', 'desc'), limit(30));
    const unsubVitals = onSnapshot(vitalsQ, (snap) => {
      setVitalsHistory(snap.docs.map(d => d.data() as VitalSigns).reverse());
    });

    const histQ = query(collection(db, 'patients', selectedPatientId, 'vitals'), orderBy('measuredAt', 'desc'), limit(timeRange === '24h' ? 100 : 500));
    const histUnsub = onSnapshot(histQ, (snap) => {
      setHistoricalData(snap.docs.map(d => d.data() as VitalSigns).reverse());
    });

    const anomQ = query(collection(db, 'patients', selectedPatientId, 'anomalies'), orderBy('timestamp', 'desc'), limit(20));
    const unsubAnom = onSnapshot(anomQ, (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Anomaly)));
    });

    return () => { unsubVitals(); histUnsub(); unsubAnom(); };
  }, [selectedPatientId, timeRange]);

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

  useEffect(() => {
    if (!patient) return;
    const id = window.setInterval(() => setMockNow(new Date()), 5000);
    return () => clearInterval(id);
  }, [patient]);

  useEffect(() => {
    const id = window.setInterval(() => setMockNowSlow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  const openCount = notificationItems.filter(n => !n.acknowledged).length;
  const urgentCount = notificationItems.filter(n => n.severity === 'high' && !n.acknowledged).length;

  const rosterAlerts = useMemo(() => {
    return patients.flatMap(p => {
      if (p.id === selectedPatientId) return displayedAlerts;
      return patientTelemetryMap[p.id]?.anomalies ?? [];
    });
  }, [patients, selectedPatientId, displayedAlerts, patientTelemetryMap]);

return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-slate-950" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">VitalsEdge</h1>
            </div>
          </div>

          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold">
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-full w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="text-green-400">Live</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-amber-400">Simulated</span>
                </>
              )}
            </div>

            <button className="relative p-2.5 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-emerald-400" />
              {openCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <button onClick={toggleTheme} className="p-2.5 hover:bg-slate-800 rounded-lg transition-colors">
              {isDark ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
            </button>
            {userData?.role !== 'PATIENT' && (
              <Button type="button" size="sm" onClick={() => setShowOnboarding(true)}>
                <Users className="h-4 w-4" />Add Patient
              </Button>
            )}
            <div className="pl-3 border-l border-white/10">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-60 bg-slate-900/50 border-r border-white/10">
          <div className="p-4">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 rounded-xl shadow-lg mb-6 hover:shadow-xl transition-shadow">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">Emergency</div>
                <div className="text-xs opacity-90">Alert system</div>
              </div>
            </button>

<nav className="space-y-1.5">
              <button onClick={() => navigateTab('home')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'home' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <Home className="w-4 h-4" /><span className="text-sm font-medium">Home</span>
              </button>
              <button onClick={() => navigateTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <LayoutGrid className="w-4 h-4" /><span className="text-sm font-medium">Dashboard</span>
              </button>
              <button onClick={() => navigateTab('patients')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'patients' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <Users className="w-4 h-4" /><span className="text-sm font-medium">Patients</span>
              </button>
              <button onClick={() => navigateTab('trends')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'trends' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <TrendingUp className="w-4 h-4" /><span className="text-sm font-medium">Trends</span>
              </button>
              <button onClick={() => navigateTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <Cpu className="w-4 h-4" /><span className="text-sm font-medium">Device Config</span>
              </button>
              <button onClick={() => navigateTab('rag_assistant')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'rag_assistant' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <MessageSquare className="w-4 h-4 text-emerald-500" /><span className="text-sm font-medium">AI Assistant</span>
              </button>
              {userData?.role === 'ADMIN' && (
                <>
                  <button onClick={() => navigateTab('clinicians')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'clinicians' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                    <Shield className="w-4 h-4" /><span className="text-sm font-medium">Clinicians</span>
                  </button>
                  <button onClick={() => navigateTab('clinic')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'clinic' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                    <Clipboard className="w-4 h-4" /><span className="text-sm font-medium">Clinic</span>
                  </button>
                  <button onClick={() => navigateTab('audit')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'audit' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                    <FileText className="w-4 h-4" /><span className="text-sm font-medium">Audit</span>
                  </button>
                </>
              )}
            </nav>

            {complianceLabels.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500">
                {complianceLabels.map((label) => (<span key={label}>{label}</span>))}
              </div>
            )}

            <div className="mt-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white text-center">
              <div className="mb-3">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center text-3xl">🩺</div>
              </div>
              <div className="font-semibold text-sm mb-1">AI Medical</div>
              <div className="text-xs opacity-90 mb-3">Assistant</div>
              <button onClick={() => navigateTab('rag_assistant')} className="w-full bg-white text-emerald-600 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-colors">Open Chat</button>
            </div>
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
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

          {/* Tab content */}
          {activeTab === 'home' ? (
            <HomePage fullName={userData?.fullName ?? auth.currentUser?.displayName ?? undefined} role={userData?.role} clinicName={(userData as any)?.clinicName} />
          ) : activeTab === 'profile' ? (
            <EnhancedProfileView user={userData} onBack={() => navigateTab('overview')} />
          ) : activeTab === 'user_settings' ? (
            <UserSettingsView user={userData} onBack={() => navigateTab('overview')} onSignOut={() => { auth.signOut(); navigateTab('home'); }} />
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
            <DeviceConfigView patient={patient} latestVitals={latestVitals} alerts={displayedAlerts} telemetrySourceLabel={telemetrySourceLabel} isLive={isLive} countdown={countdown} refreshedAt={refreshedAt} onConfigureThresholds={() => setShowThresholdEditor(true)} />
          ) : activeTab === 'clinicians' ? (
            <AdminClinicianManagement />
          ) : activeTab === 'patients' ? (
            <PatientManagement patients={patients} alerts={rosterAlerts} onAddClick={() => setShowOnboarding(true)} onEditClick={(p) => setEditingPatient(p)} onDeleteClick={(id) => deletePatient(id)} onViewClick={(id) => { setSelectedPatientId(id); navigateTab('overview'); }} />
          ) : activeTab === 'clinic' ? (
            <ClinicOverview patients={patients} alerts={displayedAlerts} />
          ) : activeTab === 'trends' ? (
            <TrendsView patient={patient} vitalsHistory={displayedHistoricalData} telemetrySourceLabel={telemetrySourceLabel} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          ) : (
            /* OVERVIEW */
            <>
              {activeEmergency && patient && <EmergencyAlertModal alert={activeEmergency} patient={patient} onAcknowledge={handleAcknowledge} onEscalate={handleEscalate} onDismiss={dismissEmergency} />}
              {patients.length === 0 ? (
                <EmptyState icon={Users} title="No patients enrolled" description="Add a patient to begin monitoring." action={{ label: 'Add patient', onClick: () => setShowOnboarding(true) }} />
              ) : !patient ? (
                <LoadingState message="Loading patient data…" submessage="Fetching vitals from your workspace." />
              ) : (
                <>
                  <header className="mb-8 flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <h2 className="text-3xl font-semibold tracking-tight text-white">{patient.firstName} {patient.lastName}</h2>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                        <span>Age: {patient.age}</span>
                        <span>MRN: {patient.mrn}</span>
                        <span className="font-semibold text-red-400">{patient.condition}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={clsx('flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold shadow-sm', isLive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400')}>
                        {isLive ? <Wifi className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
                        {telemetrySourceLabel}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-300 shadow-sm">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        Cloud sync active
                      </div>
                    </div>
                  </header>

                  {/* Stats Cards - Vitals Grid */}
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mb-3">
                          <Heart className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-sm text-slate-400 mb-1.5">Heart Rate</div>
                        <div className="text-3xl font-bold text-white">{latestVitals?.heartRate || 0} <span className="text-lg font-normal text-slate-400">BPM</span></div>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-3">
                          <Activity className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div className="text-sm text-slate-400 mb-1.5">SpO2</div>
                        <div className="text-3xl font-bold text-white">{latestVitals?.spo2 || 0} <span className="text-lg font-normal text-slate-400">%</span></div>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
                          <Thermometer className="w-8 h-8 text-amber-400" />
                        </div>
                        <div className="text-sm text-slate-400 mb-1.5">Temperature</div>
                        <div className="text-3xl font-bold text-white">{latestVitals?.temperature || 0} <span className="text-lg font-normal text-slate-400">°C</span></div>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
                          <Droplets className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-sm text-slate-400 mb-1.5">Glucose</div>
                        <div className="text-3xl font-bold text-white">{latestVitals?.glucose || 0} <span className="text-lg font-normal text-slate-400">mg/dL</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Signal Feed + Monitoring Status */}
                  <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                      <CardHeader title="Signal feed" subtitle="Real-time patient readings — 5 s sampling cadence" action={<Radio className="h-4 w-4 text-emerald-500" />} />
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              <th className="py-3 pr-4">Time</th>
                              <th className="py-3 pr-4">HR</th>
                              <th className="py-3 pr-4">SpO2</th>
                              <th className="py-3 pr-4">Temp</th>
                              <th className="py-3 pr-4">Glucose</th>
                              <th className="py-3">BP</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm text-slate-300">
                            {recentSignalFeed.map((r) => (
                              <tr key={r.measuredAt} className="border-b border-white/5 last:border-b-0">
                                <td className="py-3 pr-4 text-xs font-medium text-slate-500">{new Date(r.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                <td className="py-3 pr-4 font-semibold">{r.heartRate} BPM</td>
                                <td className="py-3 pr-4">{r.spo2}%</td>
                                <td className="py-3 pr-4">{r.temperature}°C</td>
                                <td className="py-3 pr-4">{r.glucose} mg/dL</td>
                                <td className="py-3 text-slate-500">{r.systolicBP}/{r.diastolicBP}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                    <Card>
                      <CardHeader title="Monitoring status" subtitle="Session telemetry posture" action={<Cpu className="h-4 w-4 text-slate-500" />} />
                      <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Telemetry source</div>
                          <div className="mt-1 text-sm font-semibold text-emerald-100">{telemetrySourceLabel}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Device</div>
                          <div className="mt-1 text-sm font-semibold text-white">{patient.deviceId || 'Awaiting assignment'}</div>
                          <div className="text-xs text-slate-500">{patient.condition}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Open alerts</div>
                            <div className="mt-1 text-2xl font-semibold text-white">{displayedAlerts.filter(a => !a.acknowledged).length}</div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last sync</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {latestVitals ? new Date(latestVitals.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Charts + Anomaly Log */}
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                      <ChartCard title="Heart rate — real-time" subtitle="Last 30 samples with threshold reference lines" chartClassName="border-0 bg-transparent p-0">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                            <AreaChart data={displayedVitalsHistory}>
                              <defs>
                                <linearGradient id={hrGradientId} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.7} />
                                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="measuredAt" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleTimeString()} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <ReferenceLine y={patient.thresholds.hr.max} stroke="#dc2626" strokeDasharray="4 4" label={{ value: `Max ${patient.thresholds.hr.max}`, fontSize: 9, fill: '#dc2626' }} />
                              <ReferenceLine y={patient.thresholds.hr.min} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Min ${patient.thresholds.hr.min}`, fontSize: 9, fill: '#f59e0b' }} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                              <Area type="monotone" dataKey="heartRate" stroke="#dc2626" fill={`url(#${hrGradientId})`} strokeWidth={2} isAnimationActive={false} />
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
                              <Line type="monotone" dataKey="glucose" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Glucose" isAnimationActive={false} />
                              <Line type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2} dot={false} name="SpO2" isAnimationActive={false} strokeDasharray="5 5" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartCard>
                    </div>
                    <Card className="p-5">
                      <CardHeader title="Anomaly log" subtitle="Edge-detected alerts for this patient" action={<Bell className="h-4 w-4 text-gray-400" />} />
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
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-white"
                                onClick={() => alert.id && handleAcknowledge(alert.id)}
                              >
                                <div className="mb-2 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className={`h-4 w-4 ${alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">{alert.type}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm leading-relaxed text-gray-700">{alert.message}</p>
                                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-xs">
                                  <span className="font-medium text-gray-500">Value: {alert.value}</span>
                                  <span className={alert.acknowledged ? 'font-semibold text-emerald-600' : 'font-semibold text-cyan-600'}>
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
        </main>
      </div>

      {/* Floating Medical Assistant */}
      {activeTab !== 'rag_assistant' && (
        <MedicalAssistant patientId={selectedPatientId ?? undefined} />
      )}

      {/* Modals */}
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
    </div>
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
    { label: 'Heart Rate', icon: <Heart className="h-4 w-4" />, current: latestVitals ? `${latestVitals.heartRate} BPM` : '—', target: `${patient.thresholds.hr.min}–${patient.thresholds.hr.max} BPM`, inRange: latestVitals ? latestVitals.heartRate >= patient.thresholds.hr.min && latestVitals.heartRate <= patient.thresholds.hr.max : true, value: latestVitals?.heartRate, min: patient.thresholds.hr.min, max: patient.thresholds.hr.max },
    { label: 'SpO2', icon: <Activity className="h-4 w-4" />, current: latestVitals ? `${latestVitals.spo2}%` : '—', target: `≥ ${patient.thresholds.spo2.min}%`, inRange: latestVitals ? latestVitals.spo2 >= patient.thresholds.spo2.min : true, value: latestVitals?.spo2, min: patient.thresholds.spo2.min, max: 100 },
    { label: 'Temperature', icon: <Thermometer className="h-4 w-4" />, current: latestVitals ? `${latestVitals.temperature}°C` : '—', target: `≤ ${patient.thresholds.temperature.max}°C`, inRange: latestVitals ? latestVitals.temperature <= patient.thresholds.temperature.max : true, value: latestVitals?.temperature, min: 35, max: patient.thresholds.temperature.max + 1 },
    { label: 'Glucose', icon: <Droplets className="h-4 w-4" />, current: latestVitals ? `${latestVitals.glucose} mg/dL` : '—', target: `${patient.thresholds.glucose.min}–${patient.thresholds.glucose.max} mg/dL`, inRange: latestVitals ? latestVitals.glucose >= patient.thresholds.glucose.min && latestVitals.glucose <= patient.thresholds.glucose.max : true, value: latestVitals?.glucose, min: patient.thresholds.glucose.min, max: patient.thresholds.glucose.max },
  ];

  const outOfRange = params.filter(p => !p.inRange);
  const pctComplete = (countdown / 60) * 100;
  const circumference = 2 * Math.PI * 14;

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Device Configuration</h2>
          <p className="mt-1 text-sm text-gray-600">Live parameters from the monitoring node assigned to this patient.</p>
        </div>
        <Button type="button" variant="primary" onClick={onConfigureThresholds}>
          <SettingsIcon className="h-4 w-4" /> Configure thresholds
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className={clsx('flex items-center gap-4 rounded-2xl border p-5', isLive ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
          {isLive ? <Wifi className="h-8 w-8 text-green-600" /> : <WifiOff className="h-8 w-8 text-amber-600" />}
          <div>
            <div className={clsx('text-xs font-bold uppercase tracking-widest', isLive ? 'text-green-700' : 'text-amber-700')}>
              {isLive ? 'Device connected' : 'Simulation mode'}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-gray-900">{patient.deviceId || 'VE-NODE-UNASSIGNED'}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
              <circle cx="24" cy="24" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="24" cy="24" r="14" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pctComplete)} style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
            </svg>
            <span className="absolute text-xs font-bold text-gray-900">{countdown}</span>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Next refresh</div>
            <div className="mt-0.5 text-sm font-semibold text-gray-900">{countdown}s</div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <RefreshCw className="h-3 w-3" />
              Last: {refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        <div className={clsx('flex items-center gap-4 rounded-2xl border p-5', outOfRange.length > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50')}>
          <AlertTriangle className={clsx('h-8 w-8', outOfRange.length > 0 ? 'text-red-600' : 'text-emerald-600')} />
          <div>
            <div className={clsx('text-xs font-bold uppercase tracking-widest', outOfRange.length > 0 ? 'text-red-700' : 'text-emerald-700')}>
              {outOfRange.length > 0 ? `${outOfRange.length} out of range` : 'All within range'}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-gray-900">{alerts.filter(a => !a.acknowledged).length} open anomalies</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader title="Parameter alignment" subtitle="Current readings vs configured threshold boundaries" />
        <div className="space-y-3">
          {params.map((row) => {
            const pct = row.value !== undefined && row.max > row.min ? Math.min(100, Math.max(0, ((row.value - row.min) / (row.max - row.min)) * 100)) : 50;
            return (
              <div key={row.label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{row.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{row.label}</div>
                      <div className="text-[10px] text-gray-500">Target: {row.target}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-gray-700">{row.current}</span>
                    <span className={clsx('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', row.inRange ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {row.inRange ? '✓ OK' : '⚠ Review'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className={clsx('h-1.5 rounded-full transition-all duration-700', row.inRange ? 'bg-cyan-500' : 'bg-red-500')} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

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
    return timeRange === '24h' ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Clinical Trends</h2>
          <p className="text-sm text-gray-600">Longitudinal vitals across the current monitoring window · {patient.mrn}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
            {telemetrySourceLabel}
          </span>
          <div className="flex rounded-lg bg-gray-100 p-1">
            {(['24h', '7d', '30d'] as const).map(r => (
              <button key={r} onClick={() => onTimeRangeChange(r)} className={clsx('rounded-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all', timeRange === r ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900')}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(c => (
          <Card key={c.label} className="p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <ChartCard title="Blood Pressure & Glucose" subtitle="Systolic, diastolic, and glucose overlay">
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
                <Line type="stepAfter" dataKey="glucose" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Glucose" isAnimationActive={false} />
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
                <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temp °C" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </section>
  );
};

// ─── ClinicOverview ────────────────────────────────────────────────────────────

const ClinicOverview = ({ patients, alerts }: { patients: PatientData[]; alerts: Anomaly[] }) => {
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged);
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Clinic Overview</h2>
          <p className="text-sm text-gray-600">Aggregate roster health, active alerts, and coverage.</p>
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
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{p.firstName} {p.lastName}</div>
                    <div className="text-xs text-gray-500">{p.condition}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div className="font-medium text-gray-700">{p.deviceId || 'UNASSIGNED'}</div>
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
            <MetricBar label="Avg Data Latency" valueLabel="142 ms" fillClassName="bg-cyan-500" widthClassName="w-[15%]" />
            <MetricBar label="Alert Response Coverage" valueLabel={`${patients.length === 0 ? 0 : Math.max(40, 100 - highAlerts.length * 12)}%`} fillClassName="bg-amber-500" widthClassName={highAlerts.length > 0 ? 'w-[72%]' : 'w-[92%]'} />
          </div>
        </Card>
      </div>
    </section>
  );
};

// ─── PatientManagement ────────────────────────────────────────────────────

const PatientManagement = ({
  patients, alerts, onAddClick, onEditClick, onDeleteClick, onViewClick,
}: {
  patients: PatientData[];
  alerts: Anomaly[];
  onAddClick: () => void;
  onEditClick: (patient: PatientData) => void;
  onDeleteClick: (id: string) => void;
  onViewClick: (id: string) => void;
}) => (
  <section className="space-y-8">
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/20 bg-white/40 p-6 backdrop-blur-md sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Patient Records</h2>
        <p className="mt-1 text-base text-gray-600">Manage the clinical roster and view comprehensive patient profiles.</p>
      </div>
      <Button onClick={onAddClick} size="lg" className="rounded-2xl shadow-lg shadow-cyan-600/20">
        <Users className="h-5 w-5" /> Enroll New Patient
      </Button>
    </div>
    
    {patients.length === 0 ? (
      <EmptyState icon={Users} title="No registered patients" description="Your clinical roster is empty." action={{ label: 'Enroll Patient', onClick: onAddClick }} />
    ) : (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map(p => {
          const patientAlerts = alerts.filter(a => a.patientId === p.id);
          const isStable = patientAlerts.length === 0;
          return (
            <Card key={p.id || p.mrn} className="group relative overflow-hidden border-white/40 bg-white/60 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20" padding="none">
              <div className={clsx("h-1.5 w-full transition-opacity group-hover:opacity-80", isStable ? "bg-emerald-500" : "bg-red-500")} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className={clsx("flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner", isStable ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                    <User className="h-7 w-7" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onEditClick(p)} className="rounded-xl p-2.5 text-gray-400 hover:bg-cyan-50 hover:text-cyan-600" title="Edit Profile">
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button onClick={() => onDeleteClick(p.id)} className="rounded-xl p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete Record">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 mb-6">
                  <h3 className="text-xl font-bold tracking-tight text-gray-900">{p.firstName} {p.lastName}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx("rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm", p.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600")}>
                      {p.status}
                    </span>
                    <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700 shadow-sm">
                      {p.condition}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 border-t border-gray-100 py-5">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-1.5 text-gray-400">
                      <Fingerprint className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-gray-600">{p.mrn}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-1.5 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="truncate text-gray-600">{p.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-1.5 text-gray-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-gray-600">{p.phone}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-center gap-2.5">
                    {isStable ? (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-tight text-emerald-700">Status</p>
                          <p className="text-xs font-semibold text-emerald-800">Stable</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <AlertTriangle className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-tight text-red-700">Alerts</p>
                          <p className="text-xs font-semibold text-red-800">{patientAlerts.length} Active</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onViewClick(p.id)} className="rounded-xl font-bold hover:bg-white">
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

// ─── AuditTrail ──────────────────────────────────────────────────────────

const AuditTrail = ({ logs }: { logs: AuditLog[] }) => (
  <section className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Security Audit Trail</h2>
        <p className="text-sm text-gray-600">High-value actions performed across the workspace.</p>
      </div>
      <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Admin only</span>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-900 text-white text-[10px] uppercase tracking-widest">
            <th className="p-4 border-r border-white/10">Timestamp</th>
            <th className="p-4 border-r border-white/10">User</th>
            <th className="p-4 border-r border-white/10">Action</th>
            <th className="p-4 border-r border-white/10">Resource</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="text-[11px] font-mono">
          {logs.length === 0 ? (
            <tr><td colSpan={5} className="p-12 text-center text-sm text-gray-500">No audit events recorded yet.</td></tr>
          ) : logs.map(log => (
            <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td className="p-4 border-r border-gray-200">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="p-4 border-r border-gray-200 opacity-60">{log.userId.slice(0, 8)}…</td>
              <td className="p-4 border-r border-gray-200 font-bold uppercase">{log.action}</td>
              <td className="p-4 border-r border-gray-200 opacity-70">{log.resourceType}: {log.resourceId}</td>
              <td className="p-4">
                <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
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

// ─── SystemLogs ────────────────────────────────────────────────────────────────

const SystemLogs = ({ logs }: { logs: any[] }) => (
  <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900">System Logs</h2>
      <p className="text-sm text-gray-600">Latest client-side Firestore and runtime issues.</p>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-900 text-white text-[10px] uppercase tracking-widest">
            <th className="p-4">Timestamp</th><th className="p-4">Op</th><th className="p-4">Path</th><th className="p-4">Error</th><th className="p-4">User</th>
          </tr>
        </thead>
        <tbody className="text-[10px] font-mono">
          {logs.length === 0 ? (
            <tr><td colSpan={5} className="p-12 text-center text-sm text-gray-500">No system errors logged.</td></tr>
          ) : logs.map(log => (
            <tr key={log.id} className="border-b border-gray-200 hover:bg-red-50">
              <td className="p-4 opacity-60">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="p-4 font-bold uppercase text-red-600">{log.operationType}</td>
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

// ─── MetricBar ────────────────────────────────────────────────────────────

const MetricBar = ({ label, valueLabel, fillClassName, widthClassName }: { label: string; valueLabel: string; fillClassName: string; widthClassName: string }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{valueLabel}</span>
    </div>
    <div className="h-2 rounded-full bg-gray-200">
      <div className={`h-2 rounded-full ${fillClassName} ${widthClassName}`} />
    </div>
  </div>
);