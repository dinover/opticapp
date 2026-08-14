import { Pool, Client, QueryResult } from 'pg';

let pool: Pool | null = null;
let client: Client | null = null;

// Interface para compatibilidad con el código existente
interface RunResult {
  lastID?: number;
  changes?: number;
}

export function getDatabase(): Pool {

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
    
    const changes = result.rowCount || 0;
    const isInsert = pgQuery.trim().toUpperCase().startsWith('INSERT');
    const insertedId: number | undefined = result.rows[0]?.id;

    // Nunca usar lastval() para resolver el ID: es por sesión de Postgres y
    // con un Pool cada query puede tomar una conexión física distinta, así que
    // podría devolver el ID de OTRO INSERT concurrente, de otra tabla u otro
    // usuario.
    //
    // Cuando el INSERT no trae RETURNING id, `lastID` no se puede conocer. El
    // error se lanza al LEER la propiedad, no al ejecutar la query: un INSERT
    // que ya se escribió correctamente no debe hacer fallar a quien nunca
    // necesitó el ID (por ejemplo, el log de eliminaciones). Y quien sí lo
    // necesita recibe un error claro que apunta al arreglo.
    if (isInsert && insertedId === undefined) {
      const unknownId: RunResult = { changes };
      // No enumerable a propósito: así un console.log o un spread del resultado
      // no dispara el getter y el error solo aparece donde de verdad se pide el ID.
      Object.defineProperty(unknownId, 'lastID', {
        enumerable: false,
        get() {
          throw new Error(
            'INSERT sin RETURNING id: no se puede determinar el ID insertado de forma ' +
            'segura con un pool de conexiones. Agregá RETURNING id a la query.'
          );
        },
      });
      return unknownId;
    }

    return {
      lastID: isInsert ? insertedId : undefined,
      changes,
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
