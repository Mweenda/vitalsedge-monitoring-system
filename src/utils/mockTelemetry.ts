import type { Anomaly, PatientData, VitalSigns } from '../types';

type TimeRange = '24h' | '7d' | '30d';

const CONDITION_BASELINES: Record<string, Omit<VitalSigns, 'patientId' | 'measuredAt'>> = {
  CHF: {
    heartRate: 88,
    spo2: 95,
    temperature: 36.8,
    systolicBP: 132,
    diastolicBP: 84,
    glucose: 118,
  },
  COPD: {
    heartRate: 84,
    spo2: 93,
    temperature: 36.9,
    systolicBP: 126,
    diastolicBP: 80,
    glucose: 109,
  },
  CKD: {
    heartRate: 78,
    spo2: 96,
    temperature: 36.7,
    systolicBP: 136,
    diastolicBP: 86,
    glucose: 112,
  },
  Diabetes: {
    heartRate: 76,
    spo2: 97,
    temperature: 36.7,
    systolicBP: 124,
    diastolicBP: 79,
    glucose: 158,
  },
  Hypertension: {
    heartRate: 79,
    spo2: 97,
    temperature: 36.7,
    systolicBP: 146,
    diastolicBP: 95,
    glucose: 114,
  },
  'Post-Op': {
    heartRate: 90,
    spo2: 96,
    temperature: 37.2,
    systolicBP: 128,
    diastolicBP: 82,
    glucose: 122,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(input: string) {
  return Array.from(input).reduce((acc, char, index) => {
    return acc + char.charCodeAt(0) * (index + 1);
  }, 0);
}

function getBaseline(patient: PatientData) {
  return CONDITION_BASELINES[patient.condition] ?? CONDITION_BASELINES.CHF;
}

function getSignalProfile(patient: PatientData) {
  const seed = hashSeed(`${patient.id}:${patient.mrn}:${patient.condition}`);
  return {
    seed,
    phase: (seed % 360) * (Math.PI / 180),
    drift: ((seed % 17) - 8) / 10,
    anomalyStride: 7 + (seed % 5),
    anomalyOffset: seed % 6,
  };
}

function getPointTimestamp(now: Date, index: number, total: number, range: TimeRange | 'overview') {
  const rangeMs =
    range === 'overview'
      ? 30 * 5 * 60 * 1000
      : range === '24h'
        ? 24 * 60 * 60 * 1000
        : range === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
  const stepMs = total > 1 ? rangeMs / (total - 1) : 0;
  return new Date(now.getTime() - rangeMs + stepMs * index);
}

function createPoint(patient: PatientData, timestamp: Date, index: number) {
  const base = getBaseline(patient);
  const profile = getSignalProfile(patient);
  const phase = profile.phase + index * 0.45 + timestamp.getTime() / 3_600_000;
  const minorWave = Math.sin(phase) * 1.8;
  const majorWave = Math.cos(phase / 2.2) * 2.4;
  const anomalyPulse =
    (index + profile.anomalyOffset) % profile.anomalyStride === 0
      ? 1
      : 0;

  const point: VitalSigns = {
    patientId: patient.id,
    heartRate: Math.round(base.heartRate + majorWave * 2 + minorWave + anomalyPulse * 18 + profile.drift),
    spo2: clamp(Number((base.spo2 + Math.sin(phase / 1.8) * 0.9 - anomalyPulse * 1.7).toFixed(1)), 85, 100),
    temperature: clamp(Number((base.temperature + Math.cos(phase / 3) * 0.2 + anomalyPulse * 0.35).toFixed(1)), 35.5, 40.5),
    systolicBP: Math.round(base.systolicBP + majorWave * 2.5 + anomalyPulse * 10),
    diastolicBP: Math.round(base.diastolicBP + minorWave * 1.4 + anomalyPulse * 6),
    glucose: Math.round(base.glucose + Math.sin(phase / 2.7) * 8 + anomalyPulse * (patient.condition === 'Diabetes' ? 24 : 10)),
    measuredAt: timestamp.toISOString(),
  };

  return point;
}

export function generateMockVitalsSeries(
  patient: PatientData,
  range: TimeRange | 'overview',
  now = new Date(),
) {
  const total =
    range === 'overview' ? 30 : range === '24h' ? 48 : range === '7d' ? 56 : 60;

  return Array.from({ length: total }, (_, index) => {
    const timestamp = getPointTimestamp(now, index, total, range);
    return createPoint(patient, timestamp, index);
  });
}

function breachThresholds(patient: PatientData, point: VitalSigns): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (point.heartRate > patient.thresholds.hr.max) {
    anomalies.push({
      patientId: patient.id,
      type: 'tachycardia',
      severity: point.heartRate > patient.thresholds.hr.max + 10 ? 'high' : 'medium',
      message: `Heart rate is elevated at ${point.heartRate} BPM.`,
      timestamp: point.measuredAt,
      value: point.heartRate,
    });
  }

  if (point.spo2 < patient.thresholds.spo2.min) {
    anomalies.push({
      patientId: patient.id,
      type: 'hypoxia',
      severity: point.spo2 < patient.thresholds.spo2.min - 2 ? 'high' : 'medium',
      message: `SpO2 has dropped to ${point.spo2}%.`,
      timestamp: point.measuredAt,
      value: point.spo2,
    });
  }

  if (point.temperature > patient.thresholds.temperature.max) {
    anomalies.push({
      patientId: patient.id,
      type: 'fever',
      severity: point.temperature > patient.thresholds.temperature.max + 0.4 ? 'medium' : 'low',
      message: `Temperature is elevated at ${point.temperature}°C.`,
      timestamp: point.measuredAt,
      value: point.temperature,
    });
  }

  if (point.systolicBP > patient.thresholds.systolicBP.max || point.diastolicBP > patient.thresholds.diastolicBP.max) {
    anomalies.push({
      patientId: patient.id,
      type: 'hypertension',
      severity: point.systolicBP > patient.thresholds.systolicBP.max + 8 ? 'medium' : 'low',
      message: `Blood pressure reading is high at ${point.systolicBP}/${point.diastolicBP} mmHg.`,
      timestamp: point.measuredAt,
      value: point.systolicBP,
    });
  }

  if (point.glucose > patient.thresholds.glucose.max || point.glucose < patient.thresholds.glucose.min) {
    anomalies.push({
      patientId: patient.id,
      type: 'glucose_abnormal',
      severity: point.glucose > patient.thresholds.glucose.max + 15 || point.glucose < patient.thresholds.glucose.min - 15 ? 'high' : 'medium',
      message: `Glucose reading is outside target range at ${point.glucose} mg/dL.`,
      timestamp: point.measuredAt,
      value: point.glucose,
    });
  }

  return anomalies;
}

export function generateMockAnomalies(patient: PatientData, vitals: VitalSigns[]) {
  return vitals
    .flatMap((point) => breachThresholds(patient, point))
    .slice(-6)
    .reverse();
}

export function generateMockTelemetryState(
  patient: PatientData,
  range: TimeRange,
  now = new Date(),
) {
  const overviewSeries = generateMockVitalsSeries(patient, 'overview', now);
  const historicalSeries = generateMockVitalsSeries(patient, range, now);
  const anomalies = generateMockAnomalies(patient, overviewSeries);

  return {
    overviewSeries,
    historicalSeries,
    anomalies,
    latest: overviewSeries[overviewSeries.length - 1],
    sourceLabel: 'Simulated patient telemetry',
  };
}
