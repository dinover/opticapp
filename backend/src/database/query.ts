import { pool, sqliteDb } from './init';

const isDevelopment = process.env.NODE_ENV !== 'production';

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

export async function executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
  if (isDevelopment && sqliteDb) {
    // SQLite query
    return new Promise((resolve, reject) => {
      sqliteDb!.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
      });
    });
  } else if (pool) {
    // PostgreSQL query
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } finally {
      client.release();
    }
  } else {
    throw new Error('No database connection available');
  }
}

export async function executeQuerySingle(query: string, params: any[] = []): Promise<any> {
  if (isDevelopment && sqliteDb) {
    // SQLite query
    return new Promise((resolve, reject) => {
      sqliteDb!.get(query, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  } else if (pool) {
    // PostgreSQL query
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows[0];
    } finally {
      client.release();
    }
  } else {
    throw new Error('No database connection available');
  }
}

export async function executeInsert(query: string, params: any[] = []): Promise<any> {
  if (isDevelopment && sqliteDb) {
    // SQLite insert
    return new Promise((resolve, reject) => {
      sqliteDb!.run(query, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  } else if (pool) {
    // PostgreSQL insert
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows[0];
    } finally {
      client.release();
    }
  } else {
    throw new Error('No database connection available');
  }
}

export async function insertOptic(name: string, address: string, phone: string, email: string): Promise<any> {
  if (isDevelopment && sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.run(
        'INSERT INTO optics (name, address, phone, email) VALUES (?, ?, ?, ?)',
        [name, address, phone, email],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          // Get the inserted optic
          sqliteDb!.get('SELECT * FROM optics WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(row);
          });
        }
      );
    });
  } else if (pool) {
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
  } else {
    throw new Error('No database connection available');
  }
}

export async function insertUser(username: string, email: string, password: string, optic_id: number, role: string, is_approved: boolean): Promise<any> {
  if (isDevelopment && sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.run(
        'INSERT INTO users (username, email, password, optic_id, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, password, optic_id, role, is_approved ? 1 : 0],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          // Get the inserted user
          sqliteDb!.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(row);
          });
        }
      );
    });
  } else if (pool) {
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
  } else {
    throw new Error('No database connection available');
  }
}

export async function executeUpdate(query: string, params: any[] = []): Promise<QueryResult> {
  if (isDevelopment && sqliteDb) {
    // SQLite update
    return new Promise((resolve, reject) => {
      sqliteDb!.run(query, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ rows: [], rowCount: this.changes || 0 });
      });
    });
  } else if (pool) {
    // PostgreSQL update
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } finally {
      client.release();
    }
  } else {
    throw new Error('No database connection available');
  }
}
