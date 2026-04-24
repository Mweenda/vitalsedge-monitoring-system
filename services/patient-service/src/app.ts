import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vitalsedge',
  user: process.env.DB_USER || 'vitalsedge_user',
  password: process.env.DB_PASSWORD || 'SecurePostgresPass123!',
});

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

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

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'patient', timestamp: new Date().toISOString() });
});

app.post('/api/v1/patients', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName, lastName, dateOfBirth, gender, phone, email,
      address, emergencyContact, medicalConditions, allergies, medications,
      hospitalId, assignedClinicianId
    } = req.body;

    if (!firstName || !lastName || !dateOfBirth || !hospitalId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const patientId = uuidv4();
    const mrn = `MRN-${Date.now().toString(36).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO patients.patient_records 
       (id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, 
        emergency_contact, medical_conditions, allergies, medications, hospital_id, 
        primary_doctor_id, status, enrolled_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'ACTIVE', NOW(), NOW())
       RETURNING id, mrn, first_name, last_name, status`,
      [patientId, mrn, firstName, lastName, dateOfBirth, gender, phone, email,
       JSON.stringify(address), JSON.stringify(emergencyContact),
       medicalConditions || [], allergies || [], medications || [],
       hospitalId, assignedClinicianId || req.user?.userId]
    );

    await pool.query(
      `INSERT INTO audit_logs (id, action, user_id, patient_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), 'PATIENT_CREATED', req.user?.userId, patientId, 'SUCCESS']
    );

    res.status(201).json({
      success: true,
      patient: result.rows[0],
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

app.get('/api/v1/patients', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { hospitalId, status, limit = 50, offset = 0 } = req.query;
    let query = `SELECT id, mrn, first_name, last_name, date_of_birth, gender, status, enrolled_date FROM patients.patient_records WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (hospitalId) {
      query += ` AND hospital_id = $${paramIndex++}`;
      params.push(hospitalId);
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY enrolled_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      patients: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.get('/api/v1/patients/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM patients.patient_records WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({
      success: true,
      patient: result.rows[0],
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

app.put('/api/v1/patients/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE patients.patient_records SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    await pool.query(
      `INSERT INTO audit_logs (id, action, user_id, patient_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), 'PATIENT_UPDATED', req.user?.userId, id, 'SUCCESS']
    );

    res.json({
      success: true,
      patient: result.rows[0],
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

app.delete('/api/v1/patients/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE patients.patient_records SET status = 'DISCHARGED', discharged_date = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await pool.query(
      `INSERT INTO audit_logs (id, action, user_id, patient_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), 'PATIENT_DISCHARGED', req.user?.userId, id, 'SUCCESS']
    );

    res.json({ success: true, message: 'Patient discharged successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to discharge patient' });
  }
});

app.get('/api/v1/patients/:id/vitals', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const startTime = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT * FROM patients.vital_readings 
       WHERE patient_id = $1 AND timestamp >= $2 
       ORDER BY timestamp DESC LIMIT $3`,
      [id, startTime, limit]
    );

    res.json({
      success: true,
      vitals: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({ error: 'Failed to fetch vitals' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Patient service listening on port ${PORT}`);
});

export default app;