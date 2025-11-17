import { PaginationParams, PaginatedResponse } from '../types';

export function buildPaginationQuery(
  baseQuery: string,
  params: PaginationParams,
  searchFields: string[] = []
): { query: string; params: any[] } {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;
  const search = params.search?.trim();
  const sortBy = params.sortBy || 'id';
  const sortOrder = params.sortOrder || 'DESC';

  let query = baseQuery;
  const queryParams: any[] = [];

  // Agregar búsqueda si existe
  if (search && searchFields.length > 0) {
    const searchConditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
    query += query.includes('WHERE') ? ` AND (${searchConditions})` : ` WHERE (${searchConditions})`;
    const searchPattern = `%${search}%`;
    queryParams.push(...searchFields.map(() => searchPattern));
  }

  // Agregar ordenamiento
  query += ` ORDER BY ${sortBy} ${sortOrder}`;

  // Agregar límite y offset
  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);

  return { query, params: queryParams };
}

export async function getPaginationMeta(
  countQuery: string,
  countParams: any[],
  page: number,
  limit: number
): Promise<{ total: number; totalPages: number }> {
  const { getRow } = await import('../config/database');
  const result = await getRow<{ count: number }>(countQuery, countParams);
  const total = result?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return { total, totalPages };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

