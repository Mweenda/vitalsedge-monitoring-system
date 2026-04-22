import React, { useState, useEffect } from 'react';
import { VitalSigns, Anomaly, PatientData } from '../types';
import { Activity, Thermometer, Droplets, Heart, AlertCircle, Cpu, Users, ChevronDown } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { generateMockTelemetryState } from '../utils/mockTelemetry';

export const EdgeDevice: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [vitals, setVitals] = useState<VitalSigns>({
    patientId: selectedPatientId,
    heartRate: 72,
    spo2: 98,
    temperature: 36.6,
    systolicBP: 120,
    diastolicBP: 80,
    glucose: 95,
    measuredAt: new Date().toISOString(),
  });
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isProvisioned, setIsProvisioned] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  useEffect(() => {
    setIsProvisioned(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const patientList = snapshot.docs.map((patientDoc) => ({ id: patientDoc.id, ...patientDoc.data() } as PatientData));
      setPatients(patientList);
      setSelectedPatientId((current) => current || patientList[0]?.id || '');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'patients');
    });

    return () => unsubscribe();
  }, []);

  // Listen for patient threshold updates
  useEffect(() => {
    if (!isProvisioned || !selectedPatientId) return;

    const unsubscribe = onSnapshot(doc(db, 'patients', selectedPatientId), (snap) => {
      if (snap.exists()) {
        setPatient({ id: snap.id, ...snap.data() } as PatientData);
      }
    });

    return () => unsubscribe();
  }, [isProvisioned, selectedPatientId]);

  // Simulation loop
  useEffect(() => {
    if (!isProvisioned || !patient) return;

    const interval = setInterval(async () => {
      const newVitals = generateMockTelemetryState(patient, '24h', new Date()).latest;

      setVitals(newVitals);
      detectAnomalies(newVitals, patient);

      try {
        await addDoc(collection(db, 'patients', selectedPatientId, 'vitals'), newVitals);
      } catch (error) {
        console.error("Failed to sync vitals:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isProvisioned, patient, selectedPatientId]);

  const detectAnomalies = async (data: VitalSigns, currentPatient: PatientData) => {
    const newAnomalies: Anomaly[] = [];
    const now = new Date().toISOString();
    const thresholds = currentPatient.thresholds;

    if (data.heartRate > thresholds.hr.max) {
      newAnomalies.push({
        patientId: selectedPatientId,
        type: 'tachycardia',
        severity: 'medium',
        message: `High heart rate detected: ${data.heartRate} BPM (Threshold: ${thresholds.hr.max})`,
        timestamp: now,
        value: data.heartRate
      });
    }

    if (data.spo2 < thresholds.spo2.min) {
      newAnomalies.push({
        patientId: selectedPatientId,
        type: 'hypoxia',
        severity: 'high',
        message: `Low SpO2 detected: ${data.spo2}% (Threshold: ${thresholds.spo2.min})`,
        timestamp: now,
        value: data.spo2
      });
    }

    if (data.temperature > thresholds.temperature.max) {
      newAnomalies.push({
        patientId: selectedPatientId,
        type: 'fever',
        severity: 'low',
        message: `Fever detected: ${data.temperature}°C (Threshold: ${thresholds.temperature.max})`,
        timestamp: now,
        value: data.temperature
      });
    }

    if (newAnomalies.length > 0) {
      setAnomalies(prev => [...newAnomalies, ...prev].slice(0, 5));
      for (const anomaly of newAnomalies) {
        try {
          await addDoc(collection(db, 'patients', selectedPatientId, 'anomalies'), {
            ...anomaly,
            acknowledged: false
          });
        } catch (error) {
          console.error("Failed to sync anomaly:", error);
        }
      }
    }
  };

  return (
    <div className="bg-[#151619] text-white p-6 rounded-xl border border-[#2A2B2F] shadow-2xl w-full max-w-md font-mono relative overflow-hidden">
      {/* Patient Selector Overlay */}
      <AnimatePresence>
        {showPatientSelector && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-[#151619]/95 z-50 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 border-b border-[#2A2B2F] pb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest">Select Patient Node</h3>
              <button onClick={() => setShowPatientSelector(false)} className="text-[10px] opacity-50 hover:opacity-100">CLOSE</button>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {patients.length === 0 ? (
                <div className="text-[10px] text-[#8E9299]">No enrolled patients available.</div>
              ) : (
                patients.map((patientOption) => (
                  <button
                    key={patientOption.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(patientOption.id);
                      setShowPatientSelector(false);
                      setAnomalies([]);
                    }}
                    className="w-full rounded border border-[#2A2B2F] bg-slate-900 p-3 text-left hover:border-emerald-400"
                  >
                    <div className="text-xs font-semibold text-white">
                      {patientOption.firstName} {patientOption.lastName}
                    </div>
                    <div className="text-[10px] text-[#8E9299]">
                      {patientOption.mrn} • {patientOption.condition} • {patientOption.deviceId || 'UNASSIGNED'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6 border-b border-[#2A2B2F] pb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-[10px] font-bold tracking-widest uppercase">Edge Node v2.1</h2>
            <button 
              onClick={() => setShowPatientSelector(true)}
              className="flex items-center gap-1 text-[9px] text-emerald-400 hover:underline"
            >
              <Users className="w-2 h-2" /> {patient ? `${patient.firstName} ${patient.lastName}` : 'SELECT PATIENT'} <ChevronDown className="w-2 h-2" />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-2 text-[10px] ${isProvisioned ? 'text-emerald-400' : 'text-amber-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isProvisioned ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isProvisioned ? 'SYNC ACTIVE' : 'PROVISIONING...'}
          </div>
          <div className="text-[8px] opacity-30 font-mono mt-1">TX: {Math.random().toString(16).slice(2, 8).toUpperCase()}</div>
        </div>
      </div>

      {/* Signal Processing Visualization */}
      <div className="h-8 flex items-end gap-1 mb-6 px-2 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ height: [4, Math.random() * 24 + 4, 4] }}
            transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
            className="flex-1 bg-emerald-500"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-[#1A1B1E] rounded border border-[#2A2B2F]">
          <div className="flex items-center gap-2 text-[#8E9299] text-[10px] mb-1">
            <Heart className="w-3 h-3" /> HEART RATE
          </div>
          <div className="text-2xl font-bold">{vitals.heartRate}<span className="text-xs text-[#8E9299] ml-1">BPM</span></div>
        </div>
        <div className="p-3 bg-[#1A1B1E] rounded border border-[#2A2B2F]">
          <div className="flex items-center gap-2 text-[#8E9299] text-[10px] mb-1">
            <Activity className="w-3 h-3" /> SpO2
          </div>
          <div className="text-2xl font-bold">{vitals.spo2.toFixed(1)}<span className="text-xs text-[#8E9299] ml-1">%</span></div>
        </div>
        <div className="p-3 bg-[#1A1B1E] rounded border border-[#2A2B2F]">
          <div className="flex items-center gap-2 text-[#8E9299] text-[10px] mb-1">
            <Thermometer className="w-3 h-3" /> TEMP
          </div>
          <div className="text-2xl font-bold">{vitals.temperature}<span className="text-xs text-[#8E9299] ml-1">°C</span></div>
        </div>
        <div className="p-3 bg-[#1A1B1E] rounded border border-[#2A2B2F]">
          <div className="flex items-center gap-2 text-[#8E9299] text-[10px] mb-1">
            <Droplets className="w-3 h-3" /> GLUCOSE
          </div>
          <div className="text-2xl font-bold">{vitals.glucose}<span className="text-xs text-[#8E9299] ml-1">mg/dL</span></div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] text-[#8E9299] uppercase tracking-wider mb-2">Local Event Log</h3>
        {anomalies.length === 0 ? (
          <div className="text-[10px] text-[#4A4B4F] italic">No anomalies detected locally.</div>
        ) : (
          anomalies.map((a, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-[#1A1B1E] rounded border-l-2 border-red-500">
              <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-red-400 uppercase">{a.type}</div>
                <div className="text-[9px] text-[#8E9299]">{new Date(a.timestamp).toLocaleTimeString()}</div>
                <div className="text-[8px] text-[#4A4B4F]">{a.message}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#2A2B2F] flex justify-between items-center">
        <div className="text-[9px] text-[#4A4B4F]">POWER: BATTERY 84%</div>
        <div className="text-[9px] text-[#4A4B4F]">UPTIME: 04:22:15</div>
      </div>
    </div>
  );
};
