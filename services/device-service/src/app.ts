import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import amqp from 'amqplib';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3003');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vitalsedge',
  user: process.env.DB_USER || 'vitalsedge_user',
  password: process.env.DB_PASSWORD || 'SecurePostgresPass123!',
});

let channel: amqp.Channel | null = null;

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  userName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

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

const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-min-32-chars!') as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

async function initRabbitMQ(): Promise<void> {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertExchange('device-events', 'topic', { durable: true });
    await channel.assertQueue('device-sync-queue', { durable: true });
    console.log('RabbitMQ connected');
  } catch (error) {
    console.warn('RabbitMQ not available, running without message queue');
  }
}

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'device', timestamp: new Date().toISOString() });
});

app.post('/api/v1/devices/register', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode, patientId, deviceType, deviceName, manufacturer } = req.body;

    if (!barcode || !patientId) {
      res.status(400).json({ error: 'Missing barcode or patientId' });
      return;
    }

    const deviceId = uuidv4();
    const result = await pool.query(
      `INSERT INTO devices.device_registry 
       (id, device_id, device_type, device_name, manufacturer, patient_id, status, paired_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', NOW())
       RETURNING id, device_id, device_type, status`,
      [deviceId, barcode, deviceType || 'smartwatch', deviceName, manufacturer, patientId]
    );

    if (channel) {
      channel.publish('device-events', `${patientId}.registered`, Buffer.from(JSON.stringify({
        deviceId: barcode,
        patientId,
        doctorId: req.user?.userId,
        timestamp: new Date(),
      })));
    }

    await pool.query(
      `INSERT INTO audit_logs (id, action, user_id, patient_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), 'DEVICE_REGISTERED', req.user?.userId, patientId, 'SUCCESS']
    );

    res.status(201).json({
      success: true,
      device: result.rows[0],
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Device registration failed' });
  }
});

app.get('/api/v1/patients/:patientId/devices', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const result = await pool.query(
      `SELECT id, device_id, device_type, device_name, manufacturer, status, paired_at, last_sync
       FROM devices.device_registry
       WHERE patient_id = $1 AND status = 'ACTIVE'
       ORDER BY paired_at DESC`,
      [patientId]
    );

    res.json({
      success: true,
      devices: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

app.post('/api/v1/devices/:deviceId/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const { vitalData } = req.body;

    await pool.query(
      `UPDATE devices.device_registry SET last_sync = NOW() WHERE device_id = $1`,
      [deviceId]
    );

    if (channel) {
      channel.publish('device-events', `${deviceId}.sync`, Buffer.from(JSON.stringify({
        deviceId,
        vitalData,
        timestamp: new Date(),
      })));
    }

    res.json({
      success: true,
      message: 'Device synced successfully',
    });
  } catch (error) {
    console.error('Device sync error:', error);
    res.status(500).json({ error: 'Device sync failed' });
  }
});

app.delete('/api/v1/devices/:deviceId', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;

    await pool.query(
      `UPDATE devices.device_registry SET status = 'INACTIVE', updated_at = NOW() WHERE device_id = $1`,
      [deviceId]
    );

    res.json({ success: true, message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Device unregister error:', error);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

initRabbitMQ().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Device service listening on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize:', error);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Device service listening on port ${PORT} (without RabbitMQ)`);
  });
});

export default app;