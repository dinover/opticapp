// config/env.ts lanza una excepción si falta JWT_SECRET, y eso ocurre al
// importar la app: antes de que vitest pueda evaluar un `skipIf`. Se le da un
// valor de prueba para que los archivos de test puedan importarse aunque no
// haya un entorno configurado (los que necesitan base de datos igual se
// saltean solos si no hay DATABASE_URL).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-tests';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
