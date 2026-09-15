import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import bukaTokoRouter from './routes/bukaToko';
import posRouter from './routes/pos';
import checkoutRouter from './routes/checkout';
import operasionalRouter from './routes/operasional';

import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Support base64 photos upload)
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'kebab-yasmin-backend',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api', authRouter);
app.use('/api', bukaTokoRouter);
app.use('/api', posRouter);
app.use('/api', checkoutRouter);
app.use('/api', operasionalRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Kebab Yasmin Backend API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/login`);
  });
}

export default app;
