/**
 * Vital Signs Validation Utilities
 * Validates vital sign readings against clinical norms and thresholds
 */

import { VitalSigns, Anomaly } from '../types';

// Clinical reference ranges
const VITAL_RANGES = {
  heartRate: { min: 40, max: 180 },
  spo2: { min: 85, max: 100 },
  temperature: { min: 35, max: 42 },
  systolicBP: { min: 70, max: 200 },
  diastolicBP: { min: 40, max: 130 },
  glucose: { min: 50, max: 400 },
};

export interface ValidationResult {
  isValid: boolean;
  anomalies: Anomaly[];
  warnings: string[];
}

/**
 * Validate vital signs against clinical norms
 */
export function validateVitals(vitals: VitalSigns, thresholds?: Record<string, { min: number; max: number }>): ValidationResult {
  const anomalies: Anomaly[] = [];
  const warnings: string[] = [];

  // Use custom thresholds if provided, otherwise use clinical ranges
  const ranges = thresholds || VITAL_RANGES;

  // Heart Rate validation
  if (vitals.heartRate < ranges.heartRate.min) {
    anomalies.push({
      patientId: vitals.patientId,
      type: 'tachycardia',
      severity: 'low',
      message: `Low heart rate: ${vitals.heartRate} bpm`,
      timestamp: vitals.measuredAt,
      value: vitals.heartRate,
    });
  } else if (vitals.heartRate > ranges.heartRate.max) {
    anomalies.push({
      patientId: vitals.patientId,
      type: 'tachycardia',
      severity: vitals.heartRate > 120 ? 'high' : 'medium',
      message: `High heart rate: ${vitals.heartRate} bpm`,
      timestamp: vitals.measuredAt,
      value: vitals.heartRate,
    });
  }

  // SpO2 validation
  if (vitals.spo2 < ranges.spo2.min) {
    anomalies.push({
      patientId: vitals.patientId,
      type: 'hypoxia',
      severity: vitals.spo2 < 90 ? 'high' : 'medium',
      message: `Low oxygen saturation: ${vitals.spo2}%`,
      timestamp: vitals.measuredAt,
      value: vitals.spo2,
    });
  }

  // Temperature validation
  if (vitals.temperature > 38.5) {
    anomalies.push({
      patientId: vitals.patientId,
      type: 'fever',
      severity: vitals.temperature > 39.5 ? 'high' : 'medium',
      message: `Elevated temperature: ${vitals.temperature}°C`,
      timestamp: vitals.measuredAt,
      value: vitals.temperature,
    });
  }

  // Blood Pressure validation
  if (vitals.systolicBP > 160 || vitals.diastolicBP > 100) {
    anomalies.push({
      patientId: vitals.patientId,
      type: 'hypertension',
      severity: vitals.systolicBP > 180 || vitals.diastolicBP > 110 ? 'high' : 'medium',
      message: `Elevated blood pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`,
      timestamp: vitals.measuredAt,
      value: vitals.systolicBP,
    });
  } else if (vitals.systolicBP < 90 || vitals.diastolicBP < 60) {
    anomalies.push({
      patientId: vitals.patientId,
      type: 'hypotension',
      severity: 'medium',
      message: `Low blood pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`,
      timestamp: vitals.measuredAt,
      value: vitals.systolicBP,
    });
  }

  // Glucose validation
  if (vitals.glucose < 70 || vitals.glucose > 250) {
    anomalies.push({
      patientId: vitals.patientId,
      type: 'glucose_abnormal',
      severity: vitals.glucose < 60 || vitals.glucose > 300 ? 'high' : 'medium',
      message: `Abnormal glucose: ${vitals.glucose} mg/dL`,
      timestamp: vitals.measuredAt,
      value: vitals.glucose,
    });
  }

  return {
    isValid: anomalies.length === 0,
    anomalies,
    warnings,
  };
}

/**
 * Check if vital is within acceptable range
 */
export function isVitalInRange(
  vital: keyof VitalSigns,
  value: number,
  customRanges?: Record<string, { min: number; max: number }>
): boolean {
  const ranges = customRanges || VITAL_RANGES;
  const range = ranges[vital as keyof typeof VITAL_RANGES];
  
  if (!range) return true;
  return value >= range.min && value <= range.max;
}

/**
 * Get severity level for vital reading
 */
export function getVitalSeverity(
  vital: keyof VitalSigns,
  value: number
): 'low' | 'medium' | 'high' {
  const range = VITAL_RANGES[vital as keyof typeof VITAL_RANGES];
  
  if (!range) return 'low';

  const normalMin = range.min;
  const normalMax = range.max;
  const range_size = normalMax - normalMin;

  if (value < normalMin) {
    const deviation = normalMin - value;
    if (deviation > range_size * 0.3) return 'high';
    if (deviation > range_size * 0.15) return 'medium';
    return 'low';
  }

  if (value > normalMax) {
    const deviation = value - normalMax;
    if (deviation > range_size * 0.3) return 'high';
    if (deviation > range_size * 0.15) return 'medium';
    return 'low';
  }

  return 'low';
}

/**
 * Compare vitals for trends
 */
export function compareVitals(previous: VitalSigns, current: VitalSigns): {
  trend: 'improving' | 'declining' | 'stable';
  changes: Record<string, { previous: number; current: number; change: number }>;
} {
  const changes: Record<string, { previous: number; current: number; change: number }> = {};
  let improving = 0;
  let declining = 0;

  const vitalKeys: (keyof VitalSigns)[] = ['heartRate', 'spo2', 'temperature', 'systolicBP', 'diastolicBP', 'glucose'];

  vitalKeys.forEach((key) => {
    if (key === 'patientId' || key === 'measuredAt') return;
    
    const prev = previous[key] as number;
    const curr = current[key] as number;
    const change = curr - prev;

    changes[key] = { previous: prev, current: curr, change };

    if (key === 'temperature' || key === 'heartRate' || key === 'systolicBP' || key === 'diastolicBP') {
      if (change > 0) declining++;
      else if (change < 0) improving++;
    } else if (key === 'spo2' || key === 'glucose') {
      if (change > 0) improving++;
      else if (change < 0) declining++;
    }
  });

  const trend: 'improving' | 'declining' | 'stable' = improving > declining ? 'improving' : declining > improving ? 'declining' : 'stable';

  return { trend, changes };
}
