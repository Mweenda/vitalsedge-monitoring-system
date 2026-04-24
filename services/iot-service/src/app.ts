import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import amqp from 'amqplib';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3004');

let db: Db | null = null;
let channel: amqp.Channel | null = null;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

app.use(express.json());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

interface VitalData {
  patientId: string;
  deviceId: string;
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  respiratoryRate?: number;
  glucose?: number;
  timestamp: Date;
  isAnomalous: boolean;
  anomalyType?: string[];
}

const NORMAL_RANGES = {
  heartRate: { min: 60, max: 100 },
  spO2: { min: 95, max: 100 },
  temperature: { min: 36.5, max: 37.5 },
  bloodPressure: { systolicMin: 90, systolicMax: 140, diastolicMin: 60, diastolicMax: 90 },
  respiratoryRate: { min: 12, max: 20 },
  glucose: { min: 70, max: 140 },
};

function detectAnomalies(vital: Partial<VitalData>): { isAnomalous: boolean; anomalyType: string[] } {
  const anomalies: string[] = [];

  if (vital.heartRate !== undefined) {
    if (vital.heartRate < NORMAL_RANGES.heartRate.min) anomalies.push('BRADYCARDIA');
    if (vital.heartRate > NORMAL_RANGES.heartRate.max) anomalies.push('TACHYCARDIA');
  }

  if (vital.spO2 !== undefined && vital.spO2 < NORMAL_RANGES.spO2.min) {
    anomalies.push('HYPOXEMIA');
  }

  if (vital.temperature !== undefined) {
    if (vital.temperature < NORMAL_RANGES.temperature.min) anomalies.push('HYPOTHERMIA');
    if (vital.temperature > NORMAL_RANGES.temperature.max) anomalies.push('FEVER');
  }

  if (vital.bloodPressure !== undefined) {
    if (vital.bloodPressure.systolic > NORMAL_RANGES.bloodPressure.systolicMax) anomalies.push('HYPERTENSION');
    if (vital.bloodPressure.systolic < NORMAL_RANGES.bloodPressure.systolicMin) anomalies.push('HYPOTENSION');
  }

  if (vital.glucose !== undefined) {
    if (vital.glucose < NORMAL_RANGES.glucose.min) anomalies.push('HYPOGLYCEMIA');
    if (vital.glucose > NORMAL_RANGES.glucose.max) anomalies.push('HYPERGLYCEMIA');
  }

  return {
    isAnomalous: anomalies.length > 0,
    anomalyType: anomalies,
  };
}

async function initMongoDB(): Promise<void> {
  try {
    const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE || 'vitalsedge_iot');

    const vitalsCollection = db.collection('vitals');
    await vitalsCollection.createIndex({ patientId: 1, timestamp: -1 });
    await vitalsCollection.createIndex({ deviceId: 1 });
    await vitalsCollection.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

    console.log('MongoDB connected');
  } catch (error) {
    console.warn('MongoDB not available:', error);
  }
}

async function initRabbitMQ(): Promise<void> {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertExchange('alerts', 'topic', { durable: true });
    await channel.assertQueue('vital-alerts-queue', { durable: true });
    console.log('RabbitMQ connected');
  } catch (error) {
    console.warn('RabbitMQ not available, running without message queue');
  }
}

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'iot', timestamp: new Date().toISOString() });
});

app.post('/api/v1/iot/vitals', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, deviceId, heartRate, spO2, temperature, bloodPressure, respiratoryRate, glucose } = req.body;

    if (!patientId || !deviceId) {
      res.status(400).json({ error: 'Missing patientId or deviceId' });
      return;
    }

    const vitalData: Partial<VitalData> = {
      patientId,
      deviceId,
      heartRate,
      spO2,
      temperature,
      bloodPressure,
      respiratoryRate,
      glucose,
      timestamp: new Date(),
    };

    const { isAnomalous, anomalyType } = detectAnomalies(vitalData);
    vitalData.isAnomalous = isAnomalous;
    vitalData.anomalyType = anomalyType;

    if (db) {
      const vitalsCollection = db.collection('vitals');
      await vitalsCollection.insertOne(vitalData);
    }

    await redis.setex(`latest-vitals:${patientId}`, 300, JSON.stringify(vitalData));

    if (isAnomalous && channel) {
      channel.publish('alerts', `${patientId}.critical`, Buffer.from(JSON.stringify({
        patientId,
        type: 'VITAL_ANOMALY',
        anomalies: anomalyType,
        vitalData,
        timestamp: new Date(),
      })));
    }

    res.status(201).json({
      success: true,
      isAnomalous,
      anomalyType: anomalyType.length > 0 ? anomalyType : undefined,
    });
  } catch (error) {
    console.error('Vital ingestion error:', error);
    res.status(500).json({ error: 'Failed to ingest vital data' });
  }
});

app.get('/api/v1/iot/vitals/:patientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    if (db) {
      const vitalsCollection = db.collection('vitals');
      const startTime = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

      const vitals = await vitalsCollection
        .find({ patientId, timestamp: { $gte: startTime } })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .toArray();

      res.json({
        success: true,
        vitals,
        count: vitals.length,
      });
    } else {
      res.json({
        success: true,
        vitals: [],
        count: 0,
        message: 'MongoDB not connected',
      });
    }
  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({ error: 'Failed to fetch vital data' });
  }
});

app.get('/api/v1/iot/vitals/:patientId/latest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const cached = await redis.get(`latest-vitals:${patientId}`);
    if (cached) {
      res.json({
        success: true,
        vital: JSON.parse(cached),
        source: 'cache',
      });
      return;
    }

    if (db) {
      const vitalsCollection = db.collection('vitals');
      const latest = await vitalsCollection.findOne(
        { patientId },
        { sort: { timestamp: -1 } }
      );

      res.json({
        success: true,
        vital: latest,
        source: 'database',
      });
    } else {
      res.status(503).json({ error: 'No data source available' });
    }
  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({ error: 'Failed to fetch latest vitals' });
  }
});

app.get('/api/v1/iot/anomalies/:patientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { hours = 24, limit = 50 } = req.query;

    if (db) {
      const vitalsCollection = db.collection('vitals');
      const startTime = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

      const anomalies = await vitalsCollection
        .find({ patientId, isAnomalous: true, timestamp: { $gte: startTime } })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .toArray();

      res.json({
        success: true,
        anomalies,
        count: anomalies.length,
      });
    } else {
      res.json({
        success: true,
        anomalies: [],
        count: 0,
      });
    }
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

initMongoDB().then(() => initRabbitMQ()).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IoT service listening on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize services:', error);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IoT service listening on port ${PORT} (degraded mode)`);
  });
});

export default app;