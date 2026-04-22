import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Phone, CheckCircle, Clock, Activity, Heart, Thermometer, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import type { Anomaly, PatientData } from '../types';

interface EmergencyAlertModalProps {
  alert: Anomaly;
  patient: PatientData;
  onAcknowledge: (alertId: string) => void;
  onEscalate: (alertId: string) => void;
  onDismiss: () => void;
}

const ESCALATE_AFTER_SEC = 90;

function playAlarmBeep(ctx: AudioContext) {
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  gainNode.gain.setValueAtTime(0, ctx.currentTime);

  [0, 0.18, 0.36].forEach((offset) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
    osc.connect(gainNode);
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime + offset);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + offset + 0.12);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.13);
  });
}

const VITAL_ICON: Record<string, React.ReactNode> = {
  tachycardia: <Heart className="h-5 w-5" />,
  bradycardia: <Heart className="h-5 w-5" />,
  hypoxia: <Activity className="h-5 w-5" />,
  fever: <Thermometer className="h-5 w-5" />,
  glucose_abnormal: <Droplets className="h-5 w-5" />,
  hypertension: <Activity className="h-5 w-5" />,
};

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  alert,
  patient,
  onAcknowledge,
  onEscalate,
  onDismiss,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(ESCALATE_AFTER_SEC);
  const [acknowledged, setAcknowledged] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    alarmIntervalRef.current = null;
  }, []);

  useEffect(() => {
    try {
      audioCtxRef.current = new (window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      playAlarmBeep(ctx);
      alarmIntervalRef.current = setInterval(() => playAlarmBeep(ctx), 2800);
    } catch {
      // Audio unavailable.
    }

    return () => {
      stopAlarm();
      audioCtxRef.current?.close();
    };
  }, [stopAlarm]);

  useEffect(() => {
    if (acknowledged) return;

    countdownRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(countdownRef.current!);
          stopAlarm();
          onEscalate(alert.id ?? '');
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [acknowledged, alert.id, onEscalate, stopAlarm]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    stopAlarm();
    if (countdownRef.current) clearInterval(countdownRef.current);
    onAcknowledge(alert.id ?? '');
    setTimeout(onDismiss, 1200);
  };

  const handleEscalate = () => {
    stopAlarm();
    if (countdownRef.current) clearInterval(countdownRef.current);
    onEscalate(alert.id ?? '');
    onDismiss();
  };

  const pct = (secondsLeft / ESCALATE_AFTER_SEC) * 100;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      >
        {!acknowledged && (
          <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" initial={false}>
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full w-full max-h-[640px] max-w-[600px] rounded-3xl border-2 border-red-500/70"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={clsx(
            'relative w-full max-w-[560px] overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-2xl ring-1',
            acknowledged ? 'ring-emerald-500/60' : 'ring-red-500/60',
          )}
        >
          <div className={clsx('flex items-center justify-between px-6 py-4', acknowledged ? 'bg-emerald-600' : 'bg-red-700')}>
            <div className="flex items-center gap-3">
              {acknowledged ? (
                <CheckCircle className="h-6 w-6 text-white" />
              ) : (
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
                  <AlertTriangle className="h-6 w-6 text-white" />
                </motion.div>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {acknowledged ? 'Alert acknowledged' : 'Critical patient alert'}
                </div>
                <div className="text-base font-semibold text-white">
                  {acknowledged ? 'Response logged' : 'Immediate clinical action required'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Patient</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {patient.firstName} {patient.lastName}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-[11px] font-medium">
                  <span className="text-white/50">MRN: <span className="text-white/80">{patient.mrn}</span></span>
                  <span className="text-white/50">Age: <span className="text-white/80">{patient.age}</span></span>
                  <span className="rounded-full bg-red-900/60 px-2 py-0.5 text-red-300">{patient.condition}</span>
                </div>
              </div>
              {!acknowledged && (
                <div className="shrink-0">
                  <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                    <circle cx="28" cy="28" r={radius} fill="none" stroke="#ffffff18" strokeWidth="3" />
                    <motion.circle
                      cx="28"
                      cy="28"
                      r={radius}
                      fill="none"
                      stroke={secondsLeft < 20 ? '#ef4444' : secondsLeft < 45 ? '#f59e0b' : '#22c55e'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease' }}
                    />
                  </svg>
                  <div className="mt-1 text-center text-[10px] text-white/50">{secondsLeft}s</div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-red-700/50 p-2 text-red-300">
                  {VITAL_ICON[alert.type] ?? <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase tracking-wide text-red-300">{alert.type.replace(/_/g, ' ')}</span>
                    <span className="rounded-full bg-red-700/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-200">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    {new Date(alert.timestamp).toLocaleString()}
                    {alert.value !== undefined && <span className="ml-2 font-mono text-white/60">Measured: {alert.value}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAcknowledge}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                <CheckCircle className="h-4 w-4" />
                Acknowledge & Respond
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-600/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-600/20"
              >
                <Phone className="h-4 w-4" />
                Escalate to Team
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
