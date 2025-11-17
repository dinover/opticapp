import sqlite3 from 'sqlite3';
import path from 'path';

const DATABASE_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../database.sqlite');

let db: sqlite3.Database | null = null;

export function getDatabase(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(DATABASE_PATH, (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos:', err);
      } else {
        console.log('Conexión a la base de datos establecida');
      }
    });
  }
  return db;
}

export function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Helper para ejecutar queries
export function runQuery(query: string, params: any[] = []): Promise<sqlite3.RunResult> {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    database.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

// Helper para obtener una fila
export function getRow<T>(query: string, params: any[] = []): Promise<T | undefined> {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    database.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

// Helper para obtener múltiples filas
export function getRows<T>(query: string, params: any[] = []): Promise<T[]> {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    database.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

