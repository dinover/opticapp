import { runQuery } from '../config/database';

export async function logDeletion(
  tableName: string,
  recordId: number,
  deletedBy: number | null,
  deletedData: any,
  reason?: string
): Promise<void> {
  try {
    await runQuery(
      `INSERT INTO deletion_logs (table_name, record_id, deleted_by, deleted_data, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [tableName, recordId, deletedBy, JSON.stringify(deletedData), reason || null]
    );
  } catch (error) {
    console.error('Error al registrar log de eliminación:', error);
    // No lanzamos el error para no interrumpir el flujo de eliminación
  }
}

export async function getDeletionLogs(
  tableName?: string,
  limit: number = 100
): Promise<any[]> {
  const { getRows } = await import('../config/database');
  
  let query = 'SELECT * FROM deletion_logs';
  const params: any[] = [];

  if (tableName) {
    query += ' WHERE table_name = ?';
    params.push(tableName);
  }

  query += ' ORDER BY deleted_at DESC LIMIT ?';
  params.push(limit);

  return await getRows(query, params);
}

