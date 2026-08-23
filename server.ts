import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './server/routes/authRoutes.ts';
import doctorRoutes from './server/routes/doctorRoutes.ts';
import hospitalRoutes from './server/routes/hospitalRoutes.ts';
import appointmentRoutes from './server/routes/appointmentRoutes.ts';
import paymentRoutes from './server/routes/paymentRoutes.ts';
import reviewRoutes from './server/routes/reviewRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import contactRoutes from './server/routes/contactRoutes.ts';
import aiRoutes from './server/routes/aiRoutes.ts';
import { db } from './server/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'MediCare Healthcare Management System',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Reset/Re-seed demo database route
  app.post('/api/seed/reset', (req, res) => {
    db.seedInitialData();
    res.json({ success: true, message: 'Database reset to initial demo state successfully.' });
  });

  // Mount Feature Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/hospitals', hospitalRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/ai', aiRoutes);

  // Vite Middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 MediCare Server actively running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MediCare Server:', err);
});
