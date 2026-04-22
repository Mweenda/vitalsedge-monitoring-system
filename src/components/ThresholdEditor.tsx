import React, { useState, useEffect } from 'react';
import { Activity, Settings, Save, X, Check, AlertTriangle } from 'lucide-react';
import { PatientData } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { logAudit } from '../lib/audit';
import { useFirebase } from './FirebaseProvider';

interface ThresholdEditorProps {
  patient: PatientData;
  onClose: () => void;
  onSave: (updatedThresholds: PatientData['thresholds']) => void;
}

interface ThresholdField {
  key: keyof PatientData['thresholds'];
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  icon: React.ReactNode;
}

export const ThresholdEditor: React.FC<ThresholdEditorProps> = ({
  patient,
  onClose,
  onSave
}) => {
  const { userData, degraded } = useFirebase();
  const [isEditing, setIsEditing] = useState(false);
  const [thresholds, setThresholds] = useState(patient.thresholds);
  const [originalThresholds, setOriginalThresholds] = useState(patient.thresholds);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const thresholdFields: ThresholdField[] = [
    {
      key: 'hr',
      label: 'Heart Rate',
      unit: 'BPM',
      min: 30,
      max: 200,
      step: 5,
      icon: <Activity className="w-4 h-4" />
    },
    {
      key: 'spo2',
      label: 'SpO2',
      unit: '%',
      min: 70,
      max: 100,
      step: 1,
      icon: <Activity className="w-4 h-4" />
    },
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      min: 35.0,
      max: 42.0,
      step: 0.1,
      icon: <Activity className="w-4 h-4" />
    },
    {
      key: 'glucose',
      label: 'Glucose',
      unit: 'mg/dL',
      min: 50,
      max: 400,
      step: 5,
      icon: <Activity className="w-4 h-4" />
    },
    {
      key: 'systolicBP',
      label: 'Systolic BP',
      unit: 'mmHg',
      min: 80,
      max: 200,
      step: 5,
      icon: <Activity className="w-4 h-4" />
    },
    {
      key: 'diastolicBP',
      label: 'Diastolic BP',
      unit: 'mmHg',
      min: 40,
      max: 120,
      step: 5,
      icon: <Activity className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    setThresholds(patient.thresholds);
    setOriginalThresholds(patient.thresholds);
  }, [patient]);

  const handleThresholdChange = (key: keyof PatientData['thresholds'], field: 'min' | 'max', value: number) => {
    setThresholds(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const validateThresholds = (): boolean => {
    for (const field of thresholdFields) {
      const threshold = thresholds[field.key];
      if (threshold.min >= threshold.max) {
        setError(`${field.label}: Minimum must be less than maximum`);
        return false;
      }
      if (threshold.min < field.min || threshold.max > field.max) {
        setError(`${field.label}: Values must be within ${field.min}-${field.max} ${field.unit}`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (degraded) {
      setError('Threshold updates are unavailable while the app is in degraded mode.');
      return;
    }

    if (!validateThresholds()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update patient thresholds
      const patientRef = doc(db, 'patients', patient.id);
      await updateDoc(patientRef, {
        thresholds,
        updatedAt: new Date().toISOString()
      });

      // Log threshold change
      await logAudit({
        db,
        action: 'UPDATE_THRESHOLDS',
        actorId: auth.currentUser?.uid,
        actorRole: userData?.role,
        targetId: patient.id,
        metadata: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          oldThresholds: originalThresholds,
          newThresholds: thresholds
        }
      });

      setSuccess(true);
      onSave(thresholds);
      
      setTimeout(() => {
        setIsEditing(false);
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `patients/${patient.id}`);
      setError('Failed to save thresholds. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setThresholds(originalThresholds);
    setIsEditing(false);
    setError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalThresholds(thresholds);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="mx-auto my-4 w-full max-w-4xl rounded-xl bg-white shadow-xl sm:my-8"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Alert Thresholds
                </h2>
                <p className="text-sm text-gray-500">
                  {patient.firstName} {patient.lastName} • {patient.condition}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2"
            >
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Thresholds saved successfully!</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {thresholdFields.map((field) => (
              <motion.div
                key={field.key}
                layout
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center space-x-2 mb-3">
                  {field.icon}
                  <h3 className="font-medium text-gray-900">{field.label}</h3>
                  <span className="text-sm text-gray-500">({field.unit})</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Alert
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id={`${field.key}-min-threshold`}
                        name={`${field.key}_min_threshold`}
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={thresholds[field.key].min}
                        onChange={(e) => handleThresholdChange(field.key, 'min', parseFloat(e.target.value))}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                      <span className="text-sm text-gray-500 w-12">{field.unit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Alert
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id={`${field.key}-max-threshold`}
                        name={`${field.key}_max_threshold`}
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={thresholds[field.key].max}
                        onChange={(e) => handleThresholdChange(field.key, 'max', parseFloat(e.target.value))}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                      <span className="text-sm text-gray-500 w-12">{field.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Visual indicator */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Alert Range:</span>
                    <span className="font-medium">
                      &lt; {thresholds[field.key].min} or &gt; {thresholds[field.key].max} {field.unit}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">About Alert Thresholds</p>
                <p>
                  Alerts will be triggered when vital signs fall outside the specified ranges. 
                  These thresholds are applied to the edge device and will affect real-time monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(patient.updatedAt).toLocaleDateString()}
            </div>
            
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit Thresholds</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
