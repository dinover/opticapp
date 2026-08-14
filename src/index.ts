import 'dotenv/config';
import type { Server } from 'http';
import { createApp } from './app';
import { initializeDatabase } from './database/init';
import { closeDatabase } from './config/database';

const PORT = process.env.PORT || 3001;

// Si el cierre se cuelga (una query eterna, un socket que no libera), no
// queremos bloquear el deploy: pasado este plazo se sale por la fuerza.
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | null = null;
let shuttingDown = false;

async function shutdown(reason: string, exitCode: number) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Cerrando el servidor (${reason})…`);

  const forceExit = setTimeout(() => {
    console.error('El cierre ordenado tardó demasiado, saliendo por la fuerza.');
    process.exit(exitCode || 1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    // Dejar de aceptar conexiones nuevas y esperar a que terminen las en vuelo.
    // Sin esto, un deploy corta transacciones de venta por la mitad.
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close(err => (err ? reject(err) : resolve()));
      });
    }
    await closeDatabase();
    console.log('Cierre completado.');
  } catch (error) {
    console.error('Error durante el cierre:', error);
    exitCode = exitCode || 1;
  } finally {
    clearTimeout(forceExit);
    process.exit(exitCode);
  }
}

// Render (y cualquier orquestador) manda SIGTERM en cada deploy o reinicio.
process.on('SIGTERM', () => { void shutdown('SIGTERM', 0); });
process.on('SIGINT', () => { void shutdown('SIGINT', 0); });

process.on('unhandledRejection', (reason) => {
  console.error('Promesa rechazada sin manejar:', reason);
});

// Tras una excepción no capturada el proceso queda en un estado que no es
// confiable: se cierra ordenadamente y se sale con error para que el
// orquestador levante una instancia nueva.
process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
  void shutdown('uncaughtException', 1);
});

async function startServer() {
  try {
    await initializeDatabase();

    const app = createApp();

    server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log('   Rutas: /health y /api/{auth,optics,clients,products,sales,dashboard,images,suppliers,import,reports}');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
