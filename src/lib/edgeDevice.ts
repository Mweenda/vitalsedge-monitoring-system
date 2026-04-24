export interface DeviceInfo {
  id: string;
  name: string;
  type: 'ESP32' | 'STM32' | 'BLE_SENSOR' | 'OTHER';
  macAddress?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  status: 'DISCOVERED' | 'PAIRING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  batteryLevel?: number;
  lastSeen?: Date;
}

export interface VitalSignData {
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  respiratoryRate?: number;
  glucose?: number;
  timestamp: Date;
  quality: 'GOOD' | 'FAIR' | 'POOR';
}

export interface DeviceConfig {
  samplingRate: number;
  transmissionInterval: number;
  alertThresholds: {
    heartRate?: { min: number; max: number };
    spO2?: { min: number; max: number };
    temperature?: { min: number; max: number };
    bloodPressure?: { systolicMin: number; systolicMax: number; diastolicMin: number; diastolicMax: number };
  };
  calibration: {
    heartRateOffset: number;
    spO2Offset: number;
    temperatureOffset: number;
  };
}

type ConnectionCallback = (status: 'connected' | 'disconnected' | 'error', device?: DeviceInfo) => void;
type DataCallback = (data: VitalSignData) => void;

interface NavigatorBluetooth {
  requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
}

interface BluetoothRequestDeviceOptions {
  filters?: Array<{ services?: number[]; namePrefix?: string }>;
  optionalServices?: number[];
}

interface BluetoothDevice {
  id: string;
  name: string | null;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
}

interface BluetoothCharacteristic {
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(data: BufferSource): Promise<void>;
  startNotifications(): BluetoothCharacteristic;
  stopNotifications(): Promise<void>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

class EdgeDeviceService {
  private discoveredDevices: Map<string, DeviceInfo> = new Map();
  private connectedDevices: Map<string, DeviceInfo> = new Map();
  private config: Map<string, DeviceConfig> = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private dataCallbacks: Map<string, Set<DataCallback>> = new Map();
  private bleCharacteristic: BluetoothCharacteristic | null = null;
  private simulationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isSimulating = false;
  private isBluetoothSupported: boolean;

  private readonly HEART_RATE_UUID = '00002a37-0000-1000-8000-00805f9b34fb';
  private readonly SP02_UUID = '00002a5f-0000-1000-8000-00805f9b34fb';

  constructor() {
    this.isBluetoothSupported = 'bluetooth' in navigator;
  }

  async scanForDevices(timeout = 10000): Promise<DeviceInfo[]> {
    if (!this.isBluetoothSupported) {
      console.warn('Web Bluetooth not supported, using simulation mode');
      return this.getSimulatedDevices();
    }

    try {
      const bluetooth = (navigator as Navigator & { bluetooth: NavigatorBluetooth }).bluetooth;
      const device = await bluetooth.requestDevice({
        filters: [
          { services: [0x180d] },
          { namePrefix: 'VitalsEdge' },
          { namePrefix: 'ESP32' },
          { namePrefix: 'MAX30102' },
        ],
        optionalServices: [0x180d, 0x1822, 0x1809],
      });

      const deviceInfo: DeviceInfo = {
        id: device.id,
        name: device.name || 'Unknown Device',
        type: device.name?.includes('ESP32') ? 'ESP32' : 'BLE_SENSOR',
        macAddress: device.id,
        status: 'DISCOVERED',
        lastSeen: new Date(),
      };

      this.discoveredDevices.set(deviceInfo.id, deviceInfo);
      return Array.from(this.discoveredDevices.values());
    } catch (error) {
      console.warn('BLE scan failed, using simulation:', error);
      return this.getSimulatedDevices();
    }
  }

  private getSimulatedDevices(): DeviceInfo[] {
    return [
      {
        id: 'sim-esp32-001',
        name: 'VitalsEdge ESP32 Sensor',
        type: 'ESP32',
        serialNumber: 'VE-2024-001',
        firmwareVersion: '1.2.0',
        status: 'DISCOVERED',
        batteryLevel: 85,
        lastSeen: new Date(),
      },
      {
        id: 'sim-ble-001',
        name: 'MAX30102 Pulse Oximeter',
        type: 'BLE_SENSOR',
        serialNumber: 'MX-2024-001',
        firmwareVersion: '2.0.1',
        status: 'DISCOVERED',
        batteryLevel: 92,
        lastSeen: new Date(),
      },
    ];
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    const device = this.discoveredDevices.get(deviceId) || this.getSimulatedDevice(deviceId);
    
    if (!device) {
      this.notifyConnectionCallbacks('error');
      return false;
    }

    try {
      device.status = 'PAIRING';
      this.notifyConnectionCallbacks('connected', device);

      if (deviceId.startsWith('sim-')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        device.status = 'CONNECTED';
        this.connectedDevices.set(deviceId, device);
        this.config.set(deviceId, this.getDefaultConfig());
        this.notifyConnectionCallbacks('connected', device);
        this.startSimulation(deviceId);
        return true;
      }

      const gattServer = await (device as any).gatt?.connect();
      if (gattServer) {
        device.status = 'CONNECTED';
        this.connectedDevices.set(deviceId, device);
        this.config.set(deviceId, this.getDefaultConfig());
        this.notifyConnectionCallbacks('connected', device);
        return true;
      }

      return false;
    } catch (error) {
      device.status = 'ERROR';
      this.notifyConnectionCallbacks('error', device);
      return false;
    }
  }

  private getSimulatedDevice(deviceId: string): DeviceInfo | undefined {
    return this.discoveredDevices.get(deviceId);
  }

  private getDefaultConfig(): DeviceConfig {
    return {
      samplingRate: 1000,
      transmissionInterval: 5000,
      alertThresholds: {
        heartRate: { min: 50, max: 120 },
        spO2: { min: 90, max: 100 },
        temperature: { min: 35, max: 39 },
        bloodPressure: { systolicMin: 90, systolicMax: 180, diastolicMin: 60, diastolicMax: 120 },
      },
      calibration: {
        heartRateOffset: 0,
        spO2Offset: 0,
        temperatureOffset: 0,
      },
    };
  }

  private startSimulation(deviceId: string) {
    const interval = setInterval(() => {
      const data = this.generateSimulatedData();
      const callbacks = this.dataCallbacks.get(deviceId);
      if (callbacks) {
        callbacks.forEach(cb => cb(data));
      }
    }, 5000);

    this.simulationIntervals.set(deviceId, interval);
  }

  private generateSimulatedData(): VitalSignData {
    return {
      heartRate: Math.floor(Math.random() * 30) + 60,
      spO2: Math.floor(Math.random() * 5) + 95,
      temperature: (Math.random() * 2 + 36).toFixed(1) as unknown as number,
      bloodPressure: {
        systolic: Math.floor(Math.random() * 40) + 100,
        diastolic: Math.floor(Math.random() * 20) + 60,
      },
      timestamp: new Date(),
      quality: Math.random() > 0.1 ? 'GOOD' : 'FAIR',
    };
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    
    if (device) {
      device.status = 'DISCONNECTED';
      this.connectedDevices.delete(deviceId);
      this.notifyConnectionCallbacks('disconnected', device);
    }

    const interval = this.simulationIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.simulationIntervals.delete(deviceId);
    }

    const callbacks = this.dataCallbacks.get(deviceId);
    if (callbacks) {
      this.dataCallbacks.delete(deviceId);
    }
  }

  updateDeviceConfig(deviceId: string, newConfig: Partial<DeviceConfig>): void {
    const current = this.config.get(deviceId);
    if (current) {
      this.config.set(deviceId, { ...current, ...newConfig });
    }
  }

  getDeviceConfig(deviceId: string): DeviceConfig | undefined {
    return this.config.get(deviceId);
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onDataReceived(deviceId: string, callback: DataCallback): () => void {
    if (!this.dataCallbacks.has(deviceId)) {
      this.dataCallbacks.set(deviceId, new Set());
    }
    this.dataCallbacks.get(deviceId)!.add(callback);
    return () => {
      this.dataCallbacks.get(deviceId)?.delete(callback);
    };
  }

  private notifyConnectionCallbacks(status: 'connected' | 'disconnected' | 'error', device?: DeviceInfo) {
    this.connectionCallbacks.forEach(cb => cb(status, device));
  }

  getConnectedDevices(): DeviceInfo[] {
    return Array.from(this.connectedDevices.values());
  }

  getDiscoveredDevices(): DeviceInfo[] {
    return Array.from(this.discoveredDevices.values());
  }

  cleanup() {
    this.simulationIntervals.forEach(interval => clearInterval(interval));
    this.simulationIntervals.clear();
    this.connectedDevices.clear();
    this.discoveredDevices.clear();
    this.connectionCallbacks.clear();
    this.dataCallbacks.clear();
  }
}

export const edgeDeviceService = new EdgeDeviceService();
export default edgeDeviceService;