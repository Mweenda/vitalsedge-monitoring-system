import * as XLSX from 'xlsx';
import { VitalSigns, PatientData } from '../types';

export type ExportFormat = 'csv' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  patientName: string;
  includeMetadata?: boolean;
}

export const exportVitalsData = (
  vitalsData: VitalSigns[],
  patient: PatientData,
  options: ExportOptions
): void => {
  if (vitalsData.length === 0) {
    throw new Error('No data to export');
  }

  const { format, patientName, includeMetadata = true } = options;

  // Prepare data rows
  const rows = vitalsData.map(v => ({
    'Timestamp': new Date(v.measuredAt).toLocaleString(),
    'Heart Rate (BPM)': v.heartRate,
    'SpO2 (%)': v.spo2.toFixed(1),
    'Temperature (°C)': v.temperature.toFixed(1),
    'Glucose (mg/dL)': v.glucose,
    'Systolic BP (mmHg)': v.systolicBP || 'N/A',
    'Diastolic BP (mmHg)': v.diastolicBP || 'N/A',
  }));

  // Add metadata if requested
  const metadata = includeMetadata ? [
    { 'Timestamp': 'Patient Information', 'Heart Rate (BPM)': '', 'SpO2 (%)': '', 'Temperature (°C)': '', 'Glucose (mg/dL)': '', 'Systolic BP (mmHg)': '', 'Diastolic BP (mmHg)': '' },
    { 'Timestamp': `Name: ${patient.firstName} ${patient.lastName}`, 'Heart Rate (BPM)': '', 'SpO2 (%)': '', 'Temperature (°C)': '', 'Glucose (mg/dL)': '', 'Systolic BP (mmHg)': '', 'Diastolic BP (mmHg)': '' },
    { 'Timestamp': `MRN: ${patient.mrn}`, 'Heart Rate (BPM)': '', 'SpO2 (%)': '', 'Temperature (°C)': '', 'Glucose (mg/dL)': '', 'Systolic BP (mmHg)': '', 'Diastolic BP (mmHg)': '' },
    { 'Timestamp': `Condition: ${patient.condition}`, 'Heart Rate (BPM)': '', 'SpO2 (%)': '', 'Temperature (°C)': '', 'Glucose (mg/dL)': '', 'Systolic BP (mmHg)': '', 'Diastolic BP (mmHg)': '' },
    { 'Timestamp': `Export Date: ${new Date().toLocaleString()}`, 'Heart Rate (BPM)': '', 'SpO2 (%)': '', 'Temperature (°C)': '', 'Glucose (mg/dL)': '', 'Systolic BP (mmHg)': '', 'Diastolic BP (mmHg)': '' },
    { 'Timestamp': '', 'Heart Rate (BPM)': '', 'SpO2 (%)': '', 'Temperature (°C)': '', 'Glucose (mg/dL)': '', 'Systolic BP (mmHg)': '', 'Diastolic BP (mmHg)': '' },
    { 'Timestamp': 'Vital Signs Data', 'Heart Rate (BPM)': '', 'SpO2 (%)': '', 'Temperature (°C)': '', 'Glucose (mg/dL)': '', 'Systolic BP (mmHg)': '', 'Diastolic BP (mmHg)': '' },
  ] : [];

  const allData = [...metadata, ...rows];

  if (format === 'xlsx') {
    exportAsXLSX(allData, patientName);
  } else {
    exportAsCSV(allData, patientName);
  }
};

const exportAsXLSX = (data: any[], patientName: string): void => {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Timestamp
    { wch: 15 }, // Heart Rate
    { wch: 12 }, // SpO2
    { wch: 15 }, // Temperature
    { wch: 15 }, // Glucose
    { wch: 18 }, // Systolic BP
    { wch: 18 }, // Diastolic BP
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Vitals Data');

  // Generate filename
  const filename = `VitalsEdge_${patientName}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
};

const exportAsCSV = (data: any[], patientName: string): void => {
  // Convert to CSV
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `VitalsEdge_${patientName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAnomaliesData = (
  anomalies: any[],
  patient: PatientData,
  format: ExportFormat = 'xlsx'
): void => {
  if (anomalies.length === 0) {
    throw new Error('No anomalies to export');
  }

  const rows = anomalies.map(a => ({
    'Timestamp': new Date(a.timestamp).toLocaleString(),
    'Type': a.type,
    'Severity': a.severity,
    'Value': a.value,
    'Message': a.message,
    'Acknowledged': a.acknowledged ? 'Yes' : 'No',
    'Acknowledged By': a.acknowledgedBy || 'N/A',
    'Acknowledged At': a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleString() : 'N/A',
  }));

  const metadata = [
    { 'Timestamp': 'Anomaly Report', 'Type': '', 'Severity': '', 'Value': '', 'Message': '', 'Acknowledged': '', 'Acknowledged By': '', 'Acknowledged At': '' },
    { 'Timestamp': `Patient: ${patient.firstName} ${patient.lastName}`, 'Type': '', 'Severity': '', 'Value': '', 'Message': '', 'Acknowledged': '', 'Acknowledged By': '', 'Acknowledged At': '' },
    { 'Timestamp': `MRN: ${patient.mrn}`, 'Type': '', 'Severity': '', 'Value': '', 'Message': '', 'Acknowledged': '', 'Acknowledged By': '', 'Acknowledged At': '' },
    { 'Timestamp': '', 'Type': '', 'Severity': '', 'Value': '', 'Message': '', 'Acknowledged': '', 'Acknowledged By': '', 'Acknowledged At': '' },
  ];

  const allData = [...metadata, ...rows];

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(allData);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 40 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Anomalies');
    XLSX.writeFile(wb, `VitalsEdge_Anomalies_${patient.lastName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
    const ws = XLSX.utils.json_to_sheet(allData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `VitalsEdge_Anomalies_${patient.lastName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportMultiPatientData = (
  patients: PatientData[],
  allVitals: VitalSigns[],
  allAnomalies: any[],
  format: ExportFormat = 'xlsx'
): void => {
  if (patients.length === 0) {
    throw new Error('No patients to export');
  }

  const wb = XLSX.utils.book_new();

  const patientsSheet = XLSX.utils.json_to_sheet(patients.map(p => ({
    'Patient ID': p.id,
    'First Name': p.firstName,
    'Last Name': p.lastName,
    'MRN': p.mrn,
    'Date of Birth': new Date(p.dateOfBirth).toLocaleDateString(),
    'Condition': p.condition,
    'Status': p.status,
    'Created At': p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A',
  })));
  
  patientsSheet['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, patientsSheet, 'Patients');

  if (allVitals.length > 0) {
    const vitalsSheet = XLSX.utils.json_to_sheet(allVitals.map(v => {
      const patient = patients.find(p => p.id === v.patientId);
      return {
        'Patient ID': v.patientId,
        'Patient Name': patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        'Timestamp': new Date(v.measuredAt).toLocaleString(),
        'Heart Rate (BPM)': v.heartRate,
        'SpO2 (%)': v.spo2.toFixed(1),
        'Temperature (°C)': v.temperature.toFixed(1),
        'Glucose (mg/dL)': v.glucose,
        'Systolic BP (mmHg)': v.systolicBP || 'N/A',
        'Diastolic BP (mmHg)': v.diastolicBP || 'N/A',
      };
    }));
    
    vitalsSheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, vitalsSheet, 'Vitals');
  }

  if (allAnomalies.length > 0) {
    const anomaliesSheet = XLSX.utils.json_to_sheet(allAnomalies.map(a => {
      const patient = patients.find(p => p.id === a.patientId);
      return {
        'Patient ID': a.patientId,
        'Patient Name': patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        'Timestamp': new Date(a.timestamp).toLocaleString(),
        'Type': a.type,
        'Severity': a.severity,
        'Value': a.value,
        'Message': a.message,
        'Acknowledged': a.acknowledged ? 'Yes' : 'No',
        'Acknowledged By': a.acknowledgedBy || 'N/A',
        'Acknowledged At': a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleString() : 'N/A',
      };
    }));
    
    anomaliesSheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, anomaliesSheet, 'Anomalies');
  }

  const metadataSheet = XLSX.utils.json_to_sheet([
    { 'Report Type': 'Multi-Patient Export' },
    { 'Export Date': new Date().toLocaleString() },
    { 'Total Patients': patients.length },
    { 'Total Vitals Records': allVitals.length },
    { 'Total Anomalies': allAnomalies.length },
    { 'Export Format': format.toUpperCase() },
  ]);
  
  XLSX.utils.book_append_sheet(wb, metadataSheet, 'Summary');

  const filename = `VitalsEdge_MultiPatient_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};
