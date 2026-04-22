import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, ShieldCheck, Save, X, AlertTriangle, Loader2 } from 'lucide-react';
import { PatientData } from '../types';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { logAudit } from '../lib/audit';
import { useFirebase } from './FirebaseProvider';
import { Button, Card, FormField, Alert } from './common';

interface PatientEditorProps {
  patient: PatientData;
  onClose: () => void;
  onSave: (updatedPatient: PatientData) => void;
}

const conditionOptions = ['CHF', 'COPD', 'CKD', 'Diabetes', 'Hypertension', 'Post-Op'];
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'discharged', label: 'Discharged' },
  { value: 'transferred', label: 'Transferred' },
];

export const PatientEditor: React.FC<PatientEditorProps> = ({
  patient,
  onClose,
  onSave
}) => {
  const { userData, degraded } = useFirebase();
  const [formData, setFormData] = useState<Partial<PatientData>>({
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone,
    condition: patient.condition,
    status: patient.status,
    deviceId: patient.deviceId,
    mrn: patient.mrn,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof PatientData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (degraded) {
      setError('Patient updates are unavailable while the app is in degraded mode.');
      return;
    }

    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      setError('First and last name are required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const patientRef = doc(db, 'patients', patient.id);
      const updates = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(patientRef, updates);

      await logAudit({
        db,
        action: 'UPDATE_PATIENT',
        actorId: auth.currentUser?.uid,
        actorRole: userData?.role,
        targetId: patient.id,
        metadata: {
          patientName: `${updates.firstName} ${updates.lastName}`,
          changes: formData
        }
      });

      onSave({ ...patient, ...updates } as PatientData);
      onClose();
    } catch (err: any) {
      console.error('Error updating patient:', err);
      setError(err.message || 'Failed to update patient.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="overflow-hidden rounded-[2rem] border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-950 text-neutral-900 dark:text-white">Edit Patient Profile</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && <Alert type="error" title="Update failed" message={error} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="edit-first-name"
                name="given-name"
                label="First Name"
                value={formData.firstName || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
              <FormField
                id="edit-last-name"
                name="family-name"
                label="Last Name"
                value={formData.lastName || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="edit-email"
                name="email"
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <FormField
                id="edit-phone"
                name="tel"
                label="Phone"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="edit-condition" className="text-sm font-medium text-slate-700 dark:text-slate-300">Condition</label>
                <select
                  id="edit-condition"
                  name="condition"
                  value={formData.condition}
                  onChange={(e) => updateField('condition', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                >
                  {conditionOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-status" className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                >
                  {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="edit-mrn"
                name="patientMrn"
                label="MRN"
                value={formData.mrn || ''}
                onChange={(e) => updateField('mrn', e.target.value)}
              />
              <FormField
                id="edit-device-id"
                name="patientDeviceId"
                label="Device ID"
                value={formData.deviceId || ''}
                onChange={(e) => updateField('deviceId', e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3 bg-neutral-50/50">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
