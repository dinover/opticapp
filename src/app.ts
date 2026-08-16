import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth';
import opticsRoutes from './routes/optics';
import clientsRoutes from './routes/clients';
import productsRoutes from './routes/products';
import salesRoutes from './routes/sales';
import dashboardRoutes from './routes/dashboard';
import imagesRoutes from './routes/images';
import suppliersRoutes from './routes/suppliers';
import importRoutes from './routes/import';
import reportsRoutes from './routes/reports';
import { authenticateToken } from './middleware/auth';
import { requireActiveLicense } from './middleware/license';

/**
 * Construcción de la app, separada del arranque del servidor (ver index.ts).
 * Los tests de integración importan `app` y lo pasan a supertest sin levantar
 * un puerto ni depender de que el proceso arranque.
 */
export function createApp() {
  const app = express();

  // Render (y cualquier PaaS) sirve detrás de un balanceador, así que la IP
  // real del cliente llega en X-Forwarded-For. Sin esto, Express reporta la IP
  // del proxy para todas las requests y el rate limiting agrupa a TODOS los
  // usuarios en un mismo cupo: 20 intentos cada 15 minutos entre todos.
  //
  // Se confía en un solo salto (el balanceador de Render), no en `true`: con
  // `true` se confiaría en toda la cadena y un cliente podría falsear su IP
  // mandando su propio X-Forwarded-For para esquivar el límite.
  app.set('trust proxy', 1);

  // Content-Security-Policy: el valor real está en script-src, que impide que
  // un script inyectado se ejecute. style-src necesita 'unsafe-inline' porque
  // la app usa estilos inline de React en casi todas las pantallas; sacarlo
  // requeriría reescribir esos estilos a clases.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        // Las imágenes de Google Drive entran por el proxy propio (mismo origen),
        // pero image_url acepta cualquier URL que el usuario pegue, así que
        // hay que permitir https genérico para no romper catálogos existentes.
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // El proxy de imágenes sirve contenido de Drive; con la política estricta
    // por defecto (same-origin) el navegador bloquea embeberlas desde el SPA.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors({ origin: process.env.APP_URL || 'http://localhost:5173' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/images', imagesRoutes);

  // A partir de acá, todas las rutas requieren token válido + licencia activa.
  // Las rutas individuales siguen llamando authenticateToken por su cuenta
  // (verificación redundante pero inofensiva); esto es lo que garantiza que
  // un usuario vencido o desactivado no pueda seguir operando hasta que
  // expire su token de 24h.
  app.use(
    ['/api/optics', '/api/clients', '/api/products', '/api/sales', '/api/dashboard', '/api/suppliers', '/api/import', '/api/reports'],
    authenticateToken,
    requireActiveLicense
  );

  app.use('/api/optics', opticsRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/suppliers', suppliersRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/reports', reportsRoutes);

  // 404 para rutas /api/* que no existen. Sin esto, el catch-all del SPA de abajo
  // las atrapa y devuelve index.html — el frontend recibe HTML donde esperaba JSON
  // y el error que muestra no dice nada útil.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Servir el frontend estático en producción
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));

  // Catch-all: cualquier ruta no-API devuelve el index.html del SPA
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  // Manejador de errores centralizado. Sin esto, cualquier excepción que escape
  // de un handler async sin su propio try/catch puede tumbar el proceso.
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error no manejado:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

export default createApp;
