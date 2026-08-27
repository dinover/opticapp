import 'dotenv/config';
import dns from 'dns';

// Igual que en src/index.ts: preferir IPv4 evita ENETUNREACH contra
// servicios que devuelven AAAA primero (SMTP de Gmail, proxy de imágenes
// de Drive) en entornos donde la salida IPv6 no funciona.
dns.setDefaultResultOrder('ipv4first');

import { createApp } from '../src/app';
import { initializeDatabase } from '../src/database/init';

const app = createApp();

// initializeDatabase() hace CREATE TABLE IF NOT EXISTS: es idempotente pero
// no gratis. Se memoiza para correr una sola vez por contenedor "warm" de
// Vercel, no en cada invocación.
let dbReady: Promise<void> | null = null;
function ensureDatabase(): Promise<void> {
  if (!dbReady) {
    dbReady = initializeDatabase().catch((error) => {
      // Si falló, la próxima invocación tiene que poder reintentar en vez de
      // quedar con una promesa rechazada cacheada para siempre.
      dbReady = null;
      throw error;
    });
  }
  return dbReady;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    return;
  }

  app(req, res);
}
