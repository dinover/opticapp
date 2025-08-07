import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth.js';
import opticsRoutes from './routes/optics.js';
import productsRoutes from './routes/products.js';
import clientsRoutes from './routes/clients.js';
import salesRoutes from './routes/sales.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://opticapp-frontend.vercel.app',
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*-daniel-oliveras-projects\.vercel\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/optics', opticsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/sales', salesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Inicializar base de datos y servidor
const initializeServer = async () => {
  try {
    // Importar dinámicamente para evitar problemas de ESM
    const { initializeDatabase } = await import('./database/init.js');
    await initializeDatabase();
    
    const { migrateDatabase } = await import('./database/migrate.js');
    await migrateDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Server is ready to accept connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

initializeServer(); 