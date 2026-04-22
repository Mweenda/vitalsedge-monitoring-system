import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { registerMedicalRagRoutes } from "./src/server/medicalRag";

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;
const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.APP_URL,
  process.env.FRONTEND_URL,
  'https://vitalsedge-monitoring-system.web.app',
  'https://vitalsedge-monitoring-system.firebaseapp.com',
].filter(Boolean) as string[];

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use(express.json());
registerMedicalRagRoutes(app);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'VitalsEdge Backend API'
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    message: 'VitalsEdge Backend API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Example patient data endpoint
app.get('/api/patients', (req, res) => {
  // This would typically fetch from database
  res.json({
    patients: [],
    message: 'Patient data endpoint - implement database connection'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 VitalsEdge Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 API Status: http://localhost:${PORT}/api/status`);
  console.log(`🧠 Medical RAG: http://localhost:${PORT}/api/medical-rag/query`);
  console.log(`🧠 RAG (docs alias): http://localhost:${PORT}/api/rag/query`);
  console.log(`🌐 CORS origins: ${corsOrigins.join(', ')}`);
});

export default app;
