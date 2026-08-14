import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { runQuery, getRow, getDatabase } from '../../config/database';
import { addDays } from '../../utils/license';

/**
 * Estos tests corren contra una Postgres real (en CI la levanta el service del
 * workflow). Sin DATABASE_URL se saltean en vez de fallar, para que quien
 * clone el repo pueda correr `npm test` sin instalar nada.
 */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

export interface TestOptic {
  opticsId: number;
  userId: number;
  token: string;
}

/** Vacía las tablas respetando las FKs. Se llama entre tests. */
export async function resetDatabase() {
  const pool = getDatabase();
  await pool.query(`
    TRUNCATE sale_products, sales, products, clients, suppliers,
             dashboard_config, deletion_logs, user_requests, users, optics
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Crea una óptica con un usuario propio y devuelve un token ya firmado.
 * Se firma directo en vez de pasar por /login para no consumir el rate limit
 * de autenticación (20 requests cada 15 minutos), que haría fallar la suite.
 */
export async function createOptic(name: string, opts: {
  role?: 'user' | 'owner' | 'admin';
  licenseType?: 'trial' | 'active';
  expiresInDays?: number;
} = {}): Promise<TestOptic> {
  const { role = 'owner', licenseType = 'active', expiresInDays = 30 } = opts;

  const opticsResult = await runQuery(
    'INSERT INTO optics (name, is_active) VALUES (?, 1) RETURNING id',
    [name]
  );
  const opticsId = opticsResult.lastID!;

  const expiry = addDays(new Date(), expiresInDays).toISOString();
  const password = await bcrypt.hash('secreto123', 10);

  const userResult = await runQuery(
    `INSERT INTO users (username, email, password, role, optics_id, license_type, trial_expires_at, license_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      `user_${name}`,
      `${name}@test.local`,
      password,
      role,
      opticsId,
      licenseType,
      licenseType === 'trial' ? expiry : null,
      licenseType === 'active' ? expiry : null,
    ]
  );
  const userId = userResult.lastID!;

  const token = jwt.sign(
    { id: userId, username: `user_${name}`, email: `${name}@test.local`, role, optics_id: opticsId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  return { opticsId, userId, token };
}

export async function createClient(opticsId: number, name: string): Promise<number> {
  const result = await runQuery(
    'INSERT INTO clients (optics_id, name) VALUES (?, ?) RETURNING id',
    [opticsId, name]
  );
  return result.lastID!;
}

export async function createProduct(opticsId: number, name: string, quantity = 10, price = 100): Promise<number> {
  const result = await runQuery(
    'INSERT INTO products (optics_id, name, quantity, price) VALUES (?, ?, ?, ?) RETURNING id',
    [opticsId, name, quantity, price]
  );
  return result.lastID!;
}

export async function getProductQuantity(id: number): Promise<number> {
  const row = await getRow<{ quantity: number }>('SELECT quantity FROM products WHERE id = ?', [id]);
  return Number(row?.quantity);
}
