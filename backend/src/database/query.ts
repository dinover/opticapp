import { pool } from './init';

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

export async function executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    client.release();
  }
}

export async function executeQuerySingle(query: string, params: any[] = []): Promise<any> {
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function executeInsert(query: string, params: any[] = []): Promise<any> {
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('No rows returned from INSERT query');
    }
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function insertOptic(name: string, address: string, phone: string, email: string): Promise<any> {
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO optics (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, address, phone, email]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function insertUser(username: string, email: string, password: string, optic_id: number, role: string, is_approved: boolean): Promise<any> {
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, email, password, optic_id, role, is_approved]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function executeUpdate(query: string, params: any[] = []): Promise<QueryResult> {
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    client.release();
  }
}
