import { Pool, Client, QueryResult } from 'pg';

// Detectar si estamos en producción (usando PostgreSQL) o desarrollo (SQLite opcional)
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.startsWith('postgres');

let pool: Pool | null = null;
let client: Client | null = null;

// Interface para compatibilidad con el código existente
interface RunResult {
  lastID?: number;
  changes?: number;
}

export function getDatabase(): Pool {
  if (!isProduction) {
    throw new Error('PostgreSQL está configurado como única opción. Usa DATABASE_URL.');
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL no está configurada. Proporciona una URL de conexión PostgreSQL.');
    }

    // Configurar SSL para producción (especialmente necesario para Render PostgreSQL)
    const sslConfig = process.env.NODE_ENV === 'production' || connectionString.includes('render.com') || connectionString.includes('dpg-')
      ? { rejectUnauthorized: false }
      : false;

    pool = new Pool({
      connectionString,
      ssl: sslConfig,
    });

    pool.on('connect', () => {
      console.log('Conexión a PostgreSQL establecida');
    });

    pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL:', err);
    });
  }

  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Conexión a PostgreSQL cerrada');
  }
  if (client) {
    await client.end();
    client = null;
  }
}

// Helper para ejecutar queries (INSERT, UPDATE, DELETE)
export async function runQuery(query: string, params: any[] = []): Promise<RunResult> {
  const database = getDatabase();
  
  try {
    // PostgreSQL usa $1, $2, etc. en lugar de ?
    const pgQuery = convertPlaceholders(query);
    const result = await database.query(pgQuery, params);
    
    // Para INSERT, PostgreSQL devuelve el último ID insertado en result.rows[0] si usamos RETURNING id
    // Si no hay RETURNING, intentamos obtener el ID usando lastval()
    let lastID: number | undefined;
    if (pgQuery.trim().toUpperCase().startsWith('INSERT')) {
      if (result.rows.length > 0 && result.rows[0]?.id) {
        // Si usamos RETURNING id, el ID está en result.rows[0].id
        lastID = result.rows[0].id;
      } else {
        // Si no hay RETURNING, intentar obtener el último ID usando lastval()
        try {
          const idResult = await database.query('SELECT lastval() as id');
          lastID = idResult.rows[0]?.id;
        } catch {
          // Si falla (puede pasar si no hay secuencia), no hay problema
        }
      }
    }
    
    return {
      lastID,
      changes: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Error ejecutando query:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Helper para obtener una fila
export async function getRow<T>(query: string, params: any[] = []): Promise<T | undefined> {
  const database = getDatabase();
  
  try {
    const pgQuery = convertPlaceholders(query);
    const result = await database.query(pgQuery, params);
    return result.rows[0] as T | undefined;
  } catch (error) {
    console.error('Error obteniendo fila:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Helper para obtener múltiples filas
export async function getRows<T>(query: string, params: any[] = []): Promise<T[]> {
  const database = getDatabase();
  
  try {
    const pgQuery = convertPlaceholders(query);
    const result = await database.query(pgQuery, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Error obteniendo filas:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Convertir placeholders de SQLite (?) a PostgreSQL ($1, $2, etc.)
function convertPlaceholders(query: string): string {
  let paramIndex = 1;
  return query.replace(/\?/g, () => `$${paramIndex++}`);
}

// Helper para obtener el último ID insertado (útil para INSERT)
export async function getLastInsertId(tableName: string): Promise<number> {
  const result = await getRow<{ id: number }>(`SELECT id FROM ${tableName} ORDER BY id DESC LIMIT 1`);
  return result?.id || 0;
}
