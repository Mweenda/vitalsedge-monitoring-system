import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3005');

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

interface DoctorData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hospitalId: string;
  department?: string;
  ward?: string;
  specialization: string;
  licenseNumber: string;
  licenseIssuingBody?: string;
  yearsOfExperience?: number;
  qualifications?: string;
  servicesOffered?: string[];
  consultationFee?: number;
  serviceHours?: string;
  biography?: string;
  profileImageUrl?: string;
  languages?: string[];
  availabilityStatus: 'AVAILABLE' | 'ON_LEAVE' | 'PART_TIME';
}

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
  max: 50,
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
  res.json({ status: 'ok', service: 'doctor', timestamp: new Date().toISOString() });
});

app.get('/api/v1/hospitals', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, address, phone, email, status FROM users.hospitals WHERE status = 'ACTIVE' ORDER BY name`
    );
    res.json({ success: true, hospitals: result.rows });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

app.get('/api/v1/specializations', (req: Request, res: Response) => {
  const specializations = [
    'Cardiology',
    'Emergency Medicine',
    'Family Medicine',
    'General Practice',
    'Internal Medicine',
    'Neurology',
    'Obstetrics & Gynecology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Surgery',
    'Other',
  ];
  res.json({ success: true, specializations });
});

app.post('/api/v1/doctor/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data: DoctorData = req.body;

    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      res.status(400).json({ error: 'Missing required fields: email, password, firstName, lastName' });
      return;
    }

    if (!data.hospitalId) {
      res.status(400).json({ error: 'Hospital selection is required' });
      return;
    }

    if (!data.specialization) {
      res.status(400).json({ error: 'Specialization is required' });
      return;
    }

    if (data.password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await pool.query(
      `SELECT id FROM users.doctors WHERE email = $1`,
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hospitalCheck = await pool.query(
      `SELECT id FROM users.hospitals WHERE id = $1 AND status = 'ACTIVE'`,
      [data.hospitalId]
    );

    if (hospitalCheck.rows.length === 0) {
      res.status(400).json({ error: 'Invalid hospital selection' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const doctorId = uuidv4();

    const result = await pool.query(
      `INSERT INTO users.doctors 
       (id, email, password_hash, first_name, last_name, phone, hospital_id, department, ward, 
        specialization, license_number, license_issuing_body, years_of_experience, qualifications,
        services_offered, consultation_fee, service_hours, biography, profile_image_url, languages,
        availability_status, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'PENDING_VERIFICATION', NOW())
       RETURNING id, email, first_name, last_name, specialization, hospital_id, status`,
      [
        doctorId, data.email, passwordHash, data.firstName, data.lastName, data.phone,
        data.hospitalId, data.department, data.ward, data.specialization, data.licenseNumber,
        data.licenseIssuingBody, data.yearsOfExperience || 0, data.qualifications,
        data.servicesOffered || [], data.consultationFee, data.serviceHours, data.biography,
        data.profileImageUrl, data.languages || [], data.availabilityStatus
      ]
    );

    await pool.query(
      `INSERT INTO audit.audit_logs (id, action, user_id, email, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), 'DOCTOR_REGISTRATION', doctorId, data.email, 'SUCCESS']
    );

    const token = jwt.sign(
      { userId: doctorId, email: data.email, role: 'doctor', userName: `${data.firstName} ${data.lastName}` },
      process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-min-32-chars!',
      { expiresIn: '1h' }
    );

    await redis.setex(`token:${doctorId}`, 3600, token);

    res.status(201).json({
      success: true,
      message: 'Registration submitted for verification',
      token,
      doctor: {
        id: doctorId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        hospitalId: data.hospitalId,
        specialization: data.specialization,
        status: 'PENDING_VERIFICATION',
      },
    });
  } catch (error: any) {
    console.error('Doctor registration error:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/v1/doctor/profile', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.email, d.first_name, d.last_name, d.phone, d.specialization,
              d.hospital_id, d.department, d.ward, d.license_number, d.years_of_experience,
              d.qualifications, d.biography, d.profile_image_url, d.languages,
              d.services_offered, d.consultation_fee, d.service_hours, d.availability_status,
              d.status, d.created_at, d.verified_at,
              h.name as hospital_name, h.address as hospital_address
       FROM users.doctors d
       LEFT JOIN users.hospitals h ON d.hospital_id = h.id
       WHERE d.id = $1`,
      [req.user?.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Doctor profile not found' });
      return;
    }

    const doctor = result.rows[0];
    res.json({
      success: true,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        phone: doctor.phone,
        specialization: doctor.specialization,
        hospital: {
          id: doctor.hospital_id,
          name: doctor.hospital_name,
          address: doctor.hospital_address,
        },
        department: doctor.department,
        ward: doctor.ward,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        qualifications: doctor.qualifications,
        biography: doctor.biography,
        profileImageUrl: doctor.profile_image_url,
        languages: doctor.languages,
        servicesOffered: doctor.services_offered,
        consultationFee: doctor.consultation_fee,
        serviceHours: doctor.service_hours,
        availabilityStatus: doctor.availability_status,
        status: doctor.status,
        createdAt: doctor.created_at,
        verifiedAt: doctor.verified_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/v1/doctor/profile', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    const allowedFields = [
      'phone', 'department', 'ward', 'qualifications', 'biography',
      'profile_image_url', 'languages', 'services_offered', 'consultation_fee',
      'service_hours', 'availability_status'
    ];

    const setClause = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    if (!setClause) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const result = await pool.query(
      `UPDATE users.doctors SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.user?.userId, ...Object.values(updates)]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    res.json({ success: true, doctor: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/api/v1/doctor/patients', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.id, p.mrn, p.first_name, p.last_name, p.date_of_birth, p.gender,
             p.phone, p.email, p.status, p.enrolled_date,
             COUNT(*) OVER() as total_count
      FROM patients.patient_records p
      WHERE p.primary_doctor_id = $1
    `;
    const params: any[] = [req.user?.userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY p.enrolled_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const total = result.rows[0]?.total_count || 0;

    res.json({
      success: true,
      patients: result.rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.post('/api/v1/doctor/patients', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName, lastName, dateOfBirth, gender, phone, email,
      address, emergencyContact, medicalConditions, allergies, medications,
      assignedBed, assignedWard
    } = req.body;

    if (!firstName || !lastName || !dateOfBirth) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const doctorResult = await pool.query(
      `SELECT hospital_id FROM users.doctors WHERE id = $1`,
      [req.user?.userId]
    );

    if (doctorResult.rows.length === 0) {
      res.status(403).json({ error: 'Doctor not found' });
      return;
    }

    const hospitalId = doctorResult.rows[0].hospital_id;
    const patientId = uuidv4();
    const mrn = `MRN-${Date.now().toString(36).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO patients.patient_records 
       (id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address,
        emergency_contact, medical_conditions, allergies, medications, hospital_id,
        primary_doctor_id, assigned_bed, assigned_ward, status, enrolled_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'ACTIVE', NOW(), NOW())
       RETURNING id, mrn, first_name, last_name, status`,
      [
        patientId, mrn, firstName, lastName, dateOfBirth, gender, phone, email,
        JSON.stringify(address || {}), JSON.stringify(emergencyContact || {}),
        medicalConditions || [], allergies || [], medications || [],
        hospitalId, req.user?.userId, assignedBed, assignedWard
      ]
    );

    await pool.query(
      `INSERT INTO audit.audit_logs (id, action, user_id, patient_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), 'PATIENT_ENROLLED', req.user?.userId, patientId, 'SUCCESS']
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

app.get('/api/v1/doctor/patients/:patientId', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const patientResult = await pool.query(
      `SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization
       FROM patients.patient_records p
       LEFT JOIN users.doctors d ON p.primary_doctor_id = d.id
       WHERE p.id = $1 AND p.primary_doctor_id = $2`,
      [patientId, req.user?.userId]
    );

    if (patientResult.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found or access denied' });
      return;
    }

    const vitalsResult = await pool.query(
      `SELECT * FROM patients.vital_readings 
       WHERE patient_id = $1 
       ORDER BY timestamp DESC LIMIT 10`,
      [patientId]
    );

    const alertsResult = await pool.query(
      `SELECT * FROM patients.alerts 
       WHERE patient_id = $1 AND status = 'ACTIVE'
       ORDER BY triggered_at DESC LIMIT 5`,
      [patientId]
    );

    const patient = patientResult.rows[0];
    res.json({
      success: true,
      patient: {
        ...patient,
        doctor: {
          firstName: patient.doctor_first_name,
          lastName: patient.doctor_last_name,
          specialization: patient.specialization,
        },
      },
      recentVitals: vitalsResult.rows,
      activeAlerts: alertsResult.rows,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

app.put('/api/v1/doctor/patients/:patientId', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const updates = req.body;

    const checkResult = await pool.query(
      `SELECT id FROM patients.patient_records WHERE id = $1 AND primary_doctor_id = $2`,
      [patientId, req.user?.userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found or access denied' });
      return;
    }

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE patients.patient_records SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [patientId, ...Object.values(updates)]
    );

    await pool.query(
      `INSERT INTO audit.audit_logs (id, action, user_id, patient_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), 'PATIENT_UPDATED', req.user?.userId, patientId, 'SUCCESS']
    );

    res.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

app.get('/api/v1/doctor/patients/:patientId/vitals', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const checkResult = await pool.query(
      `SELECT id FROM patients.patient_records WHERE id = $1 AND primary_doctor_id = $2`,
      [patientId, req.user?.userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found or access denied' });
      return;
    }

    const startTime = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT * FROM patients.vital_readings 
       WHERE patient_id = $1 AND timestamp >= $2 
       ORDER BY timestamp DESC LIMIT $3`,
      [patientId, startTime, limit]
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

app.get('/api/v1/doctor/patients/:patientId/alerts', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { status, limit = 50 } = req.query;

    const checkResult = await pool.query(
      `SELECT id FROM patients.patient_records WHERE id = $1 AND primary_doctor_id = $2`,
      [patientId, req.user?.userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found or access denied' });
      return;
    }

    let query = `SELECT * FROM patients.alerts WHERE patient_id = $1`;
    const params: any[] = [patientId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY triggered_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      alerts: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.put('/api/v1/doctor/alerts/:alertId/acknowledge', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE patients.alerts 
       SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), acknowledged_by = $1, notes = $2
       WHERE id = $3 AND status = 'ACTIVE'
       RETURNING *`,
      [req.user?.userId, notes, alertId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found or already processed' });
      return;
    }

    await pool.query(
      `INSERT INTO audit.audit_logs (id, action, user_id, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [uuidv4(), 'ALERT_ACKNOWLEDGED', req.user?.userId, 'SUCCESS']
    );

    res.json({ success: true, alert: result.rows[0] });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

app.get('/api/v1/doctor/dashboard', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.userId;

    const patientCountResult = await pool.query(
      `SELECT status, COUNT(*) as count FROM patients.patient_records WHERE primary_doctor_id = $1 GROUP BY status`,
      [doctorId]
    );

    const activeAlertsResult = await pool.query(
      `SELECT COUNT(*) as count FROM patients.alerts a
       JOIN patients.patient_records p ON a.patient_id = p.id
       WHERE p.primary_doctor_id = $1 AND a.status = 'ACTIVE'`,
      [doctorId]
    );

    const recentAdmissionsResult = await pool.query(
      `SELECT COUNT(*) as count FROM patients.patient_records 
       WHERE primary_doctor_id = $1 AND enrolled_date > NOW() - INTERVAL '7 days'`,
      [doctorId]
    );

    const criticalPatientsResult = await pool.query(
      `SELECT p.id, p.mrn, p.first_name, p.last_name, a.vital_type, a.value, a.triggered_at
       FROM patients.alerts a
       JOIN patients.patient_records p ON a.patient_id = p.id
       WHERE p.primary_doctor_id = $1 AND a.status = 'ACTIVE' AND a.severity = 'HIGH'
       ORDER BY a.triggered_at DESC LIMIT 5`,
      [doctorId]
    );

    const patientCounts = { active: 0, discharged: 0, transferred: 0 };
    patientCountResult.rows.forEach(row => {
      patientCounts[row.status.toLowerCase() as keyof typeof patientCounts] = parseInt(row.count);
    });

    res.json({
      success: true,
      dashboard: {
        patients: patientCounts,
        activeAlerts: parseInt(activeAlertsResult.rows[0]?.count || '0'),
        recentAdmissions: parseInt(recentAdmissionsResult.rows[0]?.count || '0'),
        criticalPatients: criticalPatientsResult.rows,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Doctor service listening on port ${PORT}`);
});

export default app;