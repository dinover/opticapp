import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init';
import authRoutes from './routes/auth';
import opticsRoutes from './routes/optics';
import clientsRoutes from './routes/clients';
import productsRoutes from './routes/products';
import salesRoutes from './routes/sales';
import dashboardRoutes from './routes/dashboard';
import imagesRoutes from './routes/images';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/optics', opticsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/images', imagesRoutes);

// Inicializar base de datos y servidor
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📝 Endpoints disponibles:`);
      console.log(`   AUTH:`);
      console.log(`   POST /api/auth/request-user - Solicitar creación de usuario`);
      console.log(`   GET  /api/auth/request-status/:username - Verificar estado de solicitud`);
      console.log(`   POST /api/auth/login - Login`);
      console.log(`   GET  /api/auth/me - Obtener perfil (requiere autenticación)`);
      console.log(`   GET  /api/auth/admin/requests - Listar solicitudes (admin)`);
      console.log(`   POST /api/auth/admin/requests/:id/approve - Aprobar solicitud (admin)`);
      console.log(`   POST /api/auth/admin/requests/:id/reject - Rechazar solicitud (admin)`);
      console.log(`   OPTICS:`);
      console.log(`   GET  /api/optics - Listar ópticas (admin)`);
      console.log(`   POST /api/optics - Crear óptica (admin)`);
      console.log(`   GET  /api/optics/:id - Obtener óptica`);
      console.log(`   PUT  /api/optics/:id - Actualizar óptica (admin)`);
      console.log(`   DELETE /api/optics/:id - Eliminar óptica (admin)`);
      console.log(`   CLIENTS:`);
      console.log(`   GET  /api/clients - Listar clientes (con paginación y búsqueda)`);
      console.log(`   POST /api/clients - Crear cliente`);
      console.log(`   GET  /api/clients/:id - Obtener cliente`);
      console.log(`   PUT  /api/clients/:id - Actualizar cliente`);
      console.log(`   DELETE /api/clients/:id - Eliminar cliente`);
      console.log(`   PRODUCTS:`);
      console.log(`   GET  /api/products - Listar productos (con paginación y búsqueda)`);
      console.log(`   POST /api/products - Crear producto`);
      console.log(`   GET  /api/products/:id - Obtener producto`);
      console.log(`   PUT  /api/products/:id - Actualizar producto`);
      console.log(`   DELETE /api/products/:id - Eliminar producto`);
      console.log(`   SALES:`);
      console.log(`   GET  /api/sales - Listar ventas (con paginación y búsqueda)`);
      console.log(`   POST /api/sales - Crear venta con productos y ficha técnica`);
      console.log(`   GET  /api/sales/:id - Obtener venta con productos`);
      console.log(`   PUT  /api/sales/:id - Actualizar venta`);
      console.log(`   DELETE /api/sales/:id - Eliminar venta`);
      console.log(`   DASHBOARD:`);
      console.log(`   GET  /api/dashboard/stats - Obtener estadísticas`);
      console.log(`   GET  /api/dashboard/config - Obtener configuración del dashboard`);
      console.log(`   PUT  /api/dashboard/config - Actualizar configuración del dashboard`);
      console.log(`   IMAGES:`);
      console.log(`   GET  /api/images/drive - Proxy para imágenes de Google Drive (resuelve CORS)`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

