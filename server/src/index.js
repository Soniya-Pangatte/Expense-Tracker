import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import bankImportRoutes from './routes/bankImportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const serverStartTime = Date.now();

// Configurable CORS for production deployment and local development
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    status: 'ok',
    service: 'SpendWise AI Financial Assistant Server',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here'),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder')),
  });
});

// AI Assistant Routes
app.use('/api/ai', aiRoutes);

// Smart Receipt Scanning & OCR Routes
app.use('/api/receipts', receiptRoutes);

// Smart Bank Statement Import Routes
app.use('/api/bank-imports', bankImportRoutes);

// Admin Dashboard & RBAC Routes
app.use('/api/admin', adminRoutes);

// Generic 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 SpendWise AI Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Gemini API Key configured: ${Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here')}`);
});

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  server.close(() => {
    console.log('SpendWise Server closed gracefully.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

