import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import clientRoutes from './routes/clients';
import saleRoutes from './routes/sales';
import opticRoutes from './routes/optics';

// Import database initialization
import { initializeDatabase } from './database/init';
import { migrateDatabase } from './database/migrate';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Process ID:', process.pid);
console.log('==========================');

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://opticapp-frontend.vercel.app',
    'https://opticapp-frontend-nag6pkke5-daniel-oliveras-projects.vercel.app',
    'https://opticapp-frontend-lr5sczh6z-daniel-oliveras-projects.vercel.app',
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

console.log('CORS origins:', corsOptions.origin);

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/optics', opticRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales', saleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'AppDelStream API is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('Starting database initialization...');
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    console.log('Starting database migration...');
    await migrateDatabase();
    console.log('Database migrations completed');
    
    console.log('Starting HTTP server...');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Server is ready to accept connections`);
      console.log(`🔗 External URL: https://opticapp-production.up.railway.app`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 