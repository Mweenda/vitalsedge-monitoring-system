export interface BarcodeScanResult {
  format: string;
  rawValue: string;
  timestamp: Date;
}

export interface PatientBarcode {
  type: 'MRN' | 'WRISTBAND' | 'MEDICATION' | 'DEVICE' | 'LAB';
  value: string;
  patientId?: string;
  patientName?: string;
  metadata?: Record<string, string>;
}

export interface MedicationBarcode {
  type: 'MEDICATION';
  ndc?: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  patientId?: string;
}

type ScanCallback = (result: BarcodeScanResult) => void;
type PatientMatchCallback = (patient: PatientBarcode | null) => void;
type MedicationMatchCallback = (medication: MedicationBarcode | null) => void;

class BarcodeService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private scanning = false;
  private scanCallbacks: Set<ScanCallback> = new Set();
  private patientCallbacks: Set<PatientMatchCallback> = new Set();
  private medicationCallbacks: Set<MedicationMatchCallback> = new Set();
  private lastScannedValue = '';
  private lastScanTime = 0;
  private scanDebounceMs = 2000;

  private readonly ZBAR_FORMATS = ['QR_CODE', 'EAN_13', 'EAN_8', 'CODE_128', 'CODE_39', 'UPC_A', 'UPC_E'];

  async requestCameraPermission(): Promise<boolean> {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (permission.state === 'granted') return true;
      if (permission.state === 'prompt') {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true;
      }
      return false;
    } catch {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    }
  }

  async startScanning(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<boolean> {
    if (this.scanning) return true;

    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      console.error('Camera permission denied');
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.videoElement = videoElement;
      this.canvasElement = canvasElement;
      
      videoElement.srcObject = this.stream;
      await videoElement.play();

      this.scanning = true;
      this.scanFrame();
      
      return true;
    } catch (error) {
      console.error('Failed to start barcode scanning:', error);
      return false;
    }
  }

  stopScanning(): void {
    this.scanning = false;
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvasElement = null;
  }

  private scanFrame(): void {
    if (!this.scanning || !this.videoElement || !this.canvasElement) return;

    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) {
      requestAnimationFrame(() => this.scanFrame());
      return;
    }

    const video = this.videoElement;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      this.canvasElement.width = video.videoWidth;
      this.canvasElement.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      this.processImageData(ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height));
    }

    requestAnimationFrame(() => this.scanFrame());
  }

  private processImageData(imageData: ImageData): void {
    const now = Date.now();
    const mockBarcode = this.detectMockBarcode(imageData);
    
    if (mockBarcode && mockBarcode !== this.lastScannedValue && now - this.lastScanTime > this.scanDebounceMs) {
      this.lastScannedValue = mockBarcode;
      this.lastScanTime = now;

      const result: BarcodeScanResult = {
        format: 'QR_CODE',
        rawValue: mockBarcode,
        timestamp: new Date(),
      };

      this.notifyScanCallbacks(result);
      this.processBarcode(result.rawValue);
    }
  }

  private detectMockBarcode(_imageData: ImageData): string | null {
    return null;
  }

  private processBarcode(rawValue: string): void {
    try {
      if (rawValue.startsWith('MRN:')) {
        const mrn = rawValue.substring(4);
        const patient: PatientBarcode = {
          type: 'MRN',
          value: mrn,
          metadata: { source: 'patient_wristband' },
        };
        this.notifyPatientCallbacks(patient);
      } else if (rawValue.startsWith('PAT:')) {
        const parts = rawValue.substring(4).split('|');
        const patient: PatientBarcode = {
          type: 'WRISTBAND',
          value: parts[0],
          patientId: parts[1],
          patientName: parts[2],
          metadata: { department: parts[3], room: parts[4] },
        };
        this.notifyPatientCallbacks(patient);
      } else if (rawValue.startsWith('MED:')) {
        const parts = rawValue.substring(4).split('|');
        const medication: MedicationBarcode = {
          type: 'MEDICATION',
          ndc: parts[0],
          name: parts[1],
          dosage: parts[2],
          frequency: parts[3],
          route: parts[4] || 'PO',
        };
        this.notifyMedicationCallbacks(medication);
      } else if (rawValue.startsWith('DEV:')) {
        const device: PatientBarcode = {
          type: 'DEVICE',
          value: rawValue.substring(4),
          metadata: { type: 'vital_signs_monitor' },
        };
        this.notifyPatientCallbacks(device);
      } else {
        const generic: PatientBarcode = {
          type: 'LAB',
          value: rawValue,
          metadata: { source: 'unknown' },
        };
        this.notifyPatientCallbacks(generic);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      this.notifyPatientCallbacks(null);
    }
  }

  onScan(callback: ScanCallback): () => void {
    this.scanCallbacks.add(callback);
    return () => this.scanCallbacks.delete(callback);
  }

  onPatientMatch(callback: PatientMatchCallback): () => void {
    this.patientCallbacks.add(callback);
    return () => this.patientCallbacks.delete(callback);
  }

  onMedicationMatch(callback: MedicationMatchCallback): () => void {
    this.medicationCallbacks.add(callback);
    return () => this.medicationCallbacks.delete(callback);
  }

  private notifyScanCallbacks(result: BarcodeScanResult): void {
    this.scanCallbacks.forEach(cb => cb(result));
  }

  private notifyPatientCallbacks(patient: PatientBarcode | null): void {
    this.patientCallbacks.forEach(cb => cb(patient));
  }

  private notifyMedicationCallbacks(medication: MedicationBarcode | null): void {
    this.medicationCallbacks.forEach(cb => cb(medication));
  }

  simulateScan(value: string, format = 'QR_CODE'): void {
    const result: BarcodeScanResult = {
      format,
      rawValue: value,
      timestamp: new Date(),
    };

    this.notifyScanCallbacks(result);
    this.processBarcode(result.rawValue);
  }

  generatePatientQRCode(patientId: string, patientName: string, mrn: string): string {
    return `PAT:${mrn}|${patientId}|${patientName}`;
  }

  generateMedicationBarcode(ndc: string, name: string, dosage: string, frequency: string): string {
    return `MED:${ndc}|${name}|${dosage}|${frequency}`;
  }

  generateDeviceBarcode(deviceId: string): string {
    return `DEV:${deviceId}`;
  }

  isScanning(): boolean {
    return this.scanning;
  }

  cleanup(): void {
    this.stopScanning();
    this.scanCallbacks.clear();
    this.patientCallbacks.clear();
    this.medicationCallbacks.clear();
  }
}

export const barcodeService = new BarcodeService();
export default barcodeService;