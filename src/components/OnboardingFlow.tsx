import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserRoundPlus,
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { Alert, Button, Card, FormField } from './common';
import type { PatientData } from '../types';
import { logAudit } from '../lib/audit';

interface OnboardingFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Thresholds = PatientData['thresholds'];

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  mrn: string;
  condition: string;
  clinicId: string;
  deviceId: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  thresholds: Thresholds;
};

const STEP_ORDER = [
  { id: 1, title: 'Identity', description: 'Patient record and contact details', icon: UserRoundPlus },
  { id: 2, title: 'Clinical', description: 'Monitoring context and device assignment', icon: HeartPulse },
  { id: 3, title: 'Thresholds', description: 'Alert bounds for remote monitoring', icon: Activity },
  { id: 4, title: 'Review', description: 'Confirm the record before enrollment', icon: ClipboardList },
] as const;

function createDefaultThresholds(): Thresholds {
  return {
    hr: { min: 50, max: 120 },
    spo2: { min: 92, max: 100 },
    temperature: { min: 36.0, max: 38.2 },
    glucose: { min: 70, max: 180 },
    systolicBP: { min: 90, max: 140 },
    diastolicBP: { min: 60, max: 90 },
  };
}

function generateMrn() {
  return `VE-${Math.floor(100000 + Math.random() * 900000)}`;
}

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

const conditionOptions = ['CHF', 'COPD', 'CKD', 'Diabetes', 'Hypertension', 'Post-Op'];
const clinicOptions = [
  { value: 'maina_soko', label: 'Maina Soko Medical Centre' },
  { value: 'uth', label: 'University Teaching Hospital' },
  { value: 'chilenje', label: 'Chilenje Level 1 Hospital' },
];

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  mrn: generateMrn(),
  condition: 'CHF',
  clinicId: 'maina_soko',
  deviceId: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  thresholds: createDefaultThresholds(),
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onCancel }) => {
  const { userData, degraded } = useFirebase();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const clinicianLabel =
    userData?.fullName || auth.currentUser?.displayName || auth.currentUser?.email || 'Authenticated clinician';

  const validationError = useMemo(() => {
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) return 'Enter the patient’s full name.';
      if (!formData.email.trim()) return 'Enter the patient email address.';
      if (!formData.phone.trim()) return 'Enter the patient phone number.';
      if (!formData.dateOfBirth) return 'Enter the patient date of birth.';
      if (!formData.emergencyContactName.trim()) return 'Add an emergency contact name.';
      if (!formData.emergencyContactPhone.trim()) return 'Add an emergency contact phone number.';
    }

    if (step === 2) {
      if (!formData.mrn.trim()) return 'Assign a medical record number.';
      if (!formData.clinicId) return 'Select the primary facility.';
      if (!formData.condition) return 'Select the primary condition.';
    }

    if (step === 3) {
      const thresholds = formData.thresholds;
      const ranges: Array<[string, number, number]> = [
        ['Heart rate', thresholds.hr.min, thresholds.hr.max],
        ['SpO2', thresholds.spo2.min, thresholds.spo2.max],
        ['Temperature', thresholds.temperature.min, thresholds.temperature.max],
        ['Glucose', thresholds.glucose.min, thresholds.glucose.max],
        ['Systolic BP', thresholds.systolicBP.min, thresholds.systolicBP.max],
        ['Diastolic BP', thresholds.diastolicBP.min, thresholds.diastolicBP.max],
      ];
      for (const [label, min, max] of ranges) {
        if (min >= max) return `${label} minimum must be less than maximum.`;
      }
    }

    return null;
  }, [formData, step]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const updateThreshold = (key: keyof Thresholds, bound: 'min' | 'max', value: number) => {
    setFormData((current) => ({
      ...current,
      thresholds: {
        ...current.thresholds,
        [key]: {
          ...current.thresholds[key],
          [bound]: value,
        },
      },
    }));
  };

  const handleNext = () => {
    setError(null);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((current) => Math.min(current + 1, STEP_ORDER.length));
  };

  const handleBack = () => {
    setError(null);
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!auth.currentUser) {
      setError('You must be signed in to enroll a patient.');
      return;
    }

    if (degraded) {
      setError('Patient enrollment is unavailable while the app is in degraded mode.');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const patientData: PatientData & {
        enrolledByUserId: string;
        enrolledByEmail: string | null;
        lastActivityAt: string;
      } = {
        id: '',
        mrn: formData.mrn.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        age: calculateAge(formData.dateOfBirth),
        condition: formData.condition,
        clinicId: formData.clinicId,
        status: 'active',
        deviceId: formData.deviceId.trim() || 'UNASSIGNED',
        thresholds: formData.thresholds,
        emergencyContact: {
          name: formData.emergencyContactName.trim(),
          relationship: formData.emergencyContactRelationship.trim() || 'Primary contact',
          phone: formData.emergencyContactPhone.trim(),
        },
        createdAt: now,
        updatedAt: now,
        enrolledByUserId: auth.currentUser.uid,
        enrolledByEmail: auth.currentUser.email,
        lastActivityAt: now,
      };

      const patientRef = await addDoc(collection(db, 'patients'), patientData);

      await logAudit({
        db,
        action: 'CREATE_PATIENT',
        actorId: auth.currentUser.uid,
        actorRole: userData?.role as string | undefined,
        targetId: patientRef.id,
        metadata: {
          patientName: `${patientData.firstName} ${patientData.lastName}`,
          mrn: patientData.mrn,
          clinicId: patientData.clinicId,
          condition: patientData.condition,
        },
      });

      onComplete();
    } catch (err: any) {
      console.error('Patient onboarding error:', err);
      setError(err?.message || 'Failed to enroll patient.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepConfig = STEP_ORDER[step - 1];
  const progress = (step / STEP_ORDER.length) * 100;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Patient onboarding</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Create a monitoring-ready patient record</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enroll a patient with a complete dashboard-compatible profile, monitoring thresholds, and emergency contact details.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Authenticated clinician
            </div>
            <div className="mt-1 truncate text-xs text-slate-600">{clinicianLabel}</div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-white/70 bg-white/95 shadow-[0_28px_100px_rgba(15,23,42,0.1)]" padding="none">
          <div className="border-b border-neutral-200 px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  {STEP_ORDER.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === step;
                    const isComplete = item.id < step;
                    return (
                      <div
                        key={item.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          isActive
                            ? 'border-blue-200 bg-blue-50 text-blue-800'
                            : isComplete
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-neutral-200 bg-white text-neutral-500'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {item.title}
                      </div>
                    );
                  })}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">{currentStepConfig.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{currentStepConfig.description}</p>
              </div>
              <div className="min-w-[180px]">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Completion</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100">
                  <motion.div
                    className="h-2 rounded-full bg-blue-600"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {error && (
              <Alert
                type="error"
                title="Patient enrollment needs attention"
                message={error}
                className="mb-6"
              />
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid gap-6 lg:grid-cols-2"
                >
                  <section className="space-y-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Patient identity</h3>
                      <p className="mt-1 text-sm text-slate-600">Capture the details clinicians need to locate and contact the patient.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="patient-first-name" name="given-name" autoComplete="given-name" label="First name" value={formData.firstName} onChange={(event) => updateField('firstName', event.target.value)} leftIcon={<User className="h-4 w-4" />} />
                      <FormField id="patient-last-name" name="family-name" autoComplete="family-name" label="Last name" value={formData.lastName} onChange={(event) => updateField('lastName', event.target.value)} leftIcon={<User className="h-4 w-4" />} />
                    </div>
                    <FormField id="patient-email" name="email" autoComplete="email" type="email" label="Email address" value={formData.email} onChange={(event) => updateField('email', event.target.value)} leftIcon={<Mail className="h-4 w-4" />} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="patient-phone" name="tel" autoComplete="tel" type="tel" label="Phone number" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
                      <FormField id="patient-dob" name="bday" autoComplete="bday" type="text" label="Date of birth" value={formData.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} placeholder="YYYY-MM-DD" leftIcon={<Calendar className="h-4 w-4" />} />
                    </div>
                  </section>

                  <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Emergency contact</h3>
                      <p className="mt-1 text-sm text-slate-600">Use a reliable contact for care coordination and escalation.</p>
                    </div>
                    <FormField id="patient-contact-name" name="emergencyContactName" autoComplete="name" label="Contact name" value={formData.emergencyContactName} onChange={(event) => updateField('emergencyContactName', event.target.value)} leftIcon={<User className="h-4 w-4" />} />
                    <FormField id="patient-contact-relationship" name="emergencyContactRelationship" label="Relationship" value={formData.emergencyContactRelationship} onChange={(event) => updateField('emergencyContactRelationship', event.target.value)} placeholder="Spouse, sibling, caregiver" leftIcon={<ShieldCheck className="h-4 w-4" />} />
                    <FormField id="patient-contact-phone" name="emergencyContactPhone" autoComplete="tel" type="tel" label="Contact phone" value={formData.emergencyContactPhone} onChange={(event) => updateField('emergencyContactPhone', event.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                      The dashboard will compute age from the date of birth and keep this record aligned with roster and monitoring views.
                    </div>
                  </section>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="clinical"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
                >
                  <section className="space-y-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Monitoring profile</h3>
                      <p className="mt-1 text-sm text-slate-600">Set the facility, primary condition, and operational identifiers used by the dashboard.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="patient-mrn" name="patientMrn" label="Medical record number" value={formData.mrn} onChange={(event) => updateField('mrn', event.target.value)} />
                      <FormField id="patient-device-id" name="patientDeviceId" label="Device ID" value={formData.deviceId} onChange={(event) => updateField('deviceId', event.target.value)} placeholder="Optional until device assignment" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Facility</label>
                      <select
                        id="patient-clinic-id"
                        name="clinicId"
                        value={formData.clinicId}
                        onChange={(e) => updateField('clinicId', e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                      >
                        {clinicOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary condition</label>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {conditionOptions.map((condition) => (
                          <button
                            key={condition}
                            type="button"
                            onClick={() => updateField('condition', condition)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                              formData.condition === condition
                                ? 'border-blue-200 bg-blue-50 text-blue-800'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            {condition}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-900">Enrollment summary</h3>
                    <dl className="space-y-4 text-sm">
                      <SummaryRow label="Patient" value={`${formData.firstName || 'Pending'} ${formData.lastName || ''}`.trim() || 'Pending'} />
                      <SummaryRow label="MRN" value={formData.mrn} />
                      <SummaryRow label="Facility" value={clinicOptions.find((option) => option.value === formData.clinicId)?.label || 'Not selected'} />
                      <SummaryRow label="Condition" value={formData.condition} />
                      <SummaryRow label="Device" value={formData.deviceId.trim() || 'Unassigned'} />
                    </dl>
                  </section>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="thresholds"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ThresholdRangeCard label="Heart rate" unit="BPM" min={formData.thresholds.hr.min} max={formData.thresholds.hr.max} onMinChange={(value) => updateThreshold('hr', 'min', value)} onMaxChange={(value) => updateThreshold('hr', 'max', value)} />
                    <ThresholdRangeCard label="SpO2" unit="%" min={formData.thresholds.spo2.min} max={formData.thresholds.spo2.max} onMinChange={(value) => updateThreshold('spo2', 'min', value)} onMaxChange={(value) => updateThreshold('spo2', 'max', value)} />
                    <ThresholdRangeCard label="Temperature" unit="°C" min={formData.thresholds.temperature.min} max={formData.thresholds.temperature.max} onMinChange={(value) => updateThreshold('temperature', 'min', value)} onMaxChange={(value) => updateThreshold('temperature', 'max', value)} step={0.1} />
                    <ThresholdRangeCard label="Glucose" unit="mg/dL" min={formData.thresholds.glucose.min} max={formData.thresholds.glucose.max} onMinChange={(value) => updateThreshold('glucose', 'min', value)} onMaxChange={(value) => updateThreshold('glucose', 'max', value)} />
                    <ThresholdRangeCard label="Systolic blood pressure" unit="mmHg" min={formData.thresholds.systolicBP.min} max={formData.thresholds.systolicBP.max} onMinChange={(value) => updateThreshold('systolicBP', 'min', value)} onMaxChange={(value) => updateThreshold('systolicBP', 'max', value)} />
                    <ThresholdRangeCard label="Diastolic blood pressure" unit="mmHg" min={formData.thresholds.diastolicBP.min} max={formData.thresholds.diastolicBP.max} onMinChange={(value) => updateThreshold('diastolicBP', 'min', value)} onMaxChange={(value) => updateThreshold('diastolicBP', 'max', value)} />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
                >
                  <section className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
                    <h3 className="text-sm font-semibold text-slate-900">Patient summary</h3>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <SummaryCard label="Full name" value={`${formData.firstName} ${formData.lastName}`.trim() || 'Pending'} />
                      <SummaryCard label="MRN" value={formData.mrn} />
                      <SummaryCard label="Date of birth" value={formData.dateOfBirth || 'Pending'} />
                      <SummaryCard label="Age" value={String(calculateAge(formData.dateOfBirth) || 'Pending')} />
                      <SummaryCard label="Condition" value={formData.condition} />
                      <SummaryCard label="Facility" value={clinicOptions.find((option) => option.value === formData.clinicId)?.label || 'Pending'} />
                      <SummaryCard label="Device" value={formData.deviceId.trim() || 'UNASSIGNED'} />
                      <SummaryCard label="Emergency contact" value={formData.emergencyContactName || 'Pending'} />
                    </dl>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-900">Configured thresholds</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      <SummaryRow label="Heart rate" value={`${formData.thresholds.hr.min}-${formData.thresholds.hr.max} BPM`} />
                      <SummaryRow label="SpO2" value={`${formData.thresholds.spo2.min}-${formData.thresholds.spo2.max}%`} />
                      <SummaryRow label="Temperature" value={`${formData.thresholds.temperature.min}-${formData.thresholds.temperature.max} °C`} />
                      <SummaryRow label="Glucose" value={`${formData.thresholds.glucose.min}-${formData.thresholds.glucose.max} mg/dL`} />
                      <SummaryRow label="Systolic BP" value={`${formData.thresholds.systolicBP.min}-${formData.thresholds.systolicBP.max} mmHg`} />
                      <SummaryRow label="Diastolic BP" value={`${formData.thresholds.diastolicBP.min}-${formData.thresholds.diastolicBP.max} mmHg`} />
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      The enrolled record will appear in the patient roster immediately after creation.
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Button type="button" variant="ghost" onClick={step === 1 ? onCancel : handleBack} disabled={isLoading}>
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
                Exit flow
              </Button>
              <Button type="button" onClick={step === STEP_ORDER.length ? handleSubmit : handleNext} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving patient
                  </>
                ) : step === STEP_ORDER.length ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete enrollment
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ThresholdRangeCard = ({
  label,
  unit,
  min,
  max,
  onMinChange,
  onMaxChange,
  step = 1,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  step?: number;
}) => (
  <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      <p className="mt-1 text-sm text-slate-600">Alert clinicians when readings move outside the safe range.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <NumericInput id={`${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-min`} name={`${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_min`} label="Minimum" unit={unit} value={min} onChange={onMinChange} step={step} />
      <NumericInput id={`${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-max`} name={`${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_max`} label="Maximum" unit={unit} value={max} onChange={onMaxChange} step={step} />
    </div>
  </section>
);

const NumericInput = ({
  label,
  unit,
  id,
  name,
  value,
  onChange,
  step,
}: {
  label: string;
  unit: string;
  id: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
}) => (
  <label className="block space-y-2">
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700">
      <input
        id={id}
        name={name}
        type="number"
        value={value}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 focus:outline-none dark:text-white"
      />
      <span className="ml-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{unit}</span>
    </div>
  </label>
);

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</div>
    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{value}</div>
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
    <span className="text-sm text-slate-600">{label}</span>
    <span className="text-right text-sm font-medium text-slate-900">{value}</span>
  </div>
);

export default OnboardingFlow;
