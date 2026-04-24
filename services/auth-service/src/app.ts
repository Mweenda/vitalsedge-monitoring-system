import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

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
  retryStrategy: (times) => Math.min(times * 50, 2000),
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

app.get('/health', (req: res) => {
  res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
});

app.post('/api/v1/auth/register/doctor', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, specialization, hospitalId, department, licenseNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Missing required fields: email, password, firstName, lastName' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const result = await pool.query(
      `INSERT INTO users.doctors (id, email, password_hash, first_name, last_name, phone, specialization, hospital_id, department, license_number, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING_VERIFICATION', NOW())
       RETURNING id, email, first_name, last_name, status`,
      [userId, email, passwordHash, firstName, lastName, phone, specialization, hospitalId, department, licenseNumber]
    );

    await pool.query(
      `INSERT INTO audit_logs (id, action, user_id, email, status, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), 'DOCTOR_REGISTRATION', userId, email, 'SUCCESS', req.ip]
    );

    const token = jwt.sign(
      { userId, email, role: 'doctor', userName: `${firstName} ${lastName}` },
      process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-min-32-chars!',
      { expiresIn: process.env.JWT_EXPIRY || '3600' }
    );

    await redis.setex(`token:${userId}`, parseInt(process.env.JWT_EXPIRY || '3600'), token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        status: 'PENDING_VERIFICATION',
      },
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/v1/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const table = userType === 'doctor' ? 'users.doctors' : 'users.clinicians';
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, status FROM ${table} WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: userType || 'clinician', userName: `${user.first_name} ${user.last_name}` },
      process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-min-32-chars!',
      { expiresIn: process.env.JWT_EXPIRY || '3600' }
    );

    await redis.setex(`token:${user.id}`, parseInt(process.env.JWT_EXPIRY || '3600'), token);
    await pool.query(
      `INSERT INTO audit_logs (id, action, user_id, email, status, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), 'LOGIN', user.id, email, 'SUCCESS', req.ip]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/v1/auth/logout', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (userId) {
      await redis.del(`token:${userId}`);
      await pool.query(
        `INSERT INTO audit_logs (id, action, user_id, email, status, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [uuidv4(), 'LOGOUT', userId, req.user?.email, 'SUCCESS', req.ip]
      );
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/v1/auth/me', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    const table = role === 'doctor' ? 'users.doctors' : 'users.clinicians';
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, specialization, hospital_id, status FROM ${table} WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        specialization: user.specialization,
        hospitalId: user.hospital_id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.post('/api/v1/auth/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const userId = await redis.get(`refresh:${refreshToken}`);
    if (!userId) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const result = await pool.query(
      `SELECT id, email, first_name, last_name FROM users.doctors WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'doctor', userName: `${user.first_name} ${user.last_name}` },
      process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-min-32-chars!',
      { expiresIn: process.env.JWT_EXPIRY || '3600' }
    );

    await redis.setex(`token:${user.id}`, parseInt(process.env.JWT_EXPIRY || '3600'), token);

    res.json({ success: true, token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth service listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;