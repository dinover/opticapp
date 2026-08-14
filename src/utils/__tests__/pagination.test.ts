import { describe, it, expect } from 'vitest';
import { buildPaginationQuery } from '../pagination';

const BASE_QUERY = 'SELECT * FROM clients';

describe('buildPaginationQuery - protección contra SQL injection', () => {
  it('cae al sortBy por defecto ("id") cuando se pasa un sortBy malicioso', () => {
    const malicious = 'id; DROP TABLE users;--';
    const { query } = buildPaginationQuery(BASE_QUERY, { sortBy: malicious });
    expect(query).not.toContain(malicious);
    expect(query).not.toContain('DROP TABLE');
    expect(query).toContain('ORDER BY id DESC');
  });

  it('cae al sortBy por defecto cuando la columna no está en la whitelist', () => {
    const { query } = buildPaginationQuery(BASE_QUERY, { sortBy: 'not_a_real_column' });
    expect(query).toContain('ORDER BY id DESC');
  });

  it('cae a DESC cuando sortOrder es inválido', () => {
    const { query } = buildPaginationQuery(BASE_QUERY, {
      sortBy: 'name',
      sortOrder: 'ASC; DROP TABLE users;--' as any,
    });
    expect(query).toContain('ORDER BY name DESC');
    expect(query).not.toContain('DROP TABLE');
  });

  it('usa sortBy y sortOrder tal cual cuando son válidos', () => {
    const { query } = buildPaginationQuery(BASE_QUERY, { sortBy: 'name', sortOrder: 'ASC' });
    expect(query).toContain('ORDER BY name ASC');
  });

  it('acepta sortOrder en minúsculas y lo normaliza a mayúsculas', () => {
    const { query } = buildPaginationQuery(BASE_QUERY, { sortBy: 'email', sortOrder: 'asc' as any });
    expect(query).toContain('ORDER BY email ASC');
  });

  it('acepta cada columna de la whitelist actual', () => {
    const allowed = [
      'id', 'name', 'created_at', 'updated_at', 'price', 'quantity',
      'total_price', 'sale_date', 'email', 'phone',
    ];
    for (const col of allowed) {
      const { query } = buildPaginationQuery(BASE_QUERY, { sortBy: col });
      expect(query).toContain(`ORDER BY ${col} DESC`);
    }
  });
});

describe('buildPaginationQuery - LIMIT/OFFSET', () => {
  it('usa page=1 y limit=10 por defecto', () => {
    const { query, params } = buildPaginationQuery(BASE_QUERY, {});
    expect(query).toContain('LIMIT ? OFFSET ?');
    expect(params).toEqual([10, 0]);
  });

  it('calcula el offset correctamente para page=2, limit=20', () => {
    const { params } = buildPaginationQuery(BASE_QUERY, { page: 2, limit: 20 });
    expect(params).toEqual([20, 20]);
  });

  it('calcula el offset correctamente para page=3, limit=5', () => {
    const { params } = buildPaginationQuery(BASE_QUERY, { page: 3, limit: 5 });
    expect(params).toEqual([5, 10]);
  });

  it('page=1 siempre da offset 0 sin importar el limit', () => {
    const { params } = buildPaginationQuery(BASE_QUERY, { page: 1, limit: 50 });
    expect(params).toEqual([50, 0]);
  });
});

describe('buildPaginationQuery - búsqueda', () => {
  it('agrega condición de búsqueda con WHERE cuando la query base no lo tiene', () => {
    const { query, params } = buildPaginationQuery(BASE_QUERY, { search: 'juan' }, ['name', 'email']);
    expect(query).toContain('WHERE (name ILIKE ? OR email ILIKE ?)');
    expect(params[0]).toBe('%juan%');
    expect(params[1]).toBe('%juan%');
  });

  it('agrega condición de búsqueda con AND cuando la query base ya tiene WHERE', () => {
    const { query } = buildPaginationQuery(
      'SELECT * FROM clients WHERE optics_id = ?',
      { search: 'juan' },
      ['name']
    );
    expect(query).toContain('AND (name ILIKE ?)');
  });

  it('no agrega condición de búsqueda si search está vacío', () => {
    const { query } = buildPaginationQuery(BASE_QUERY, { search: '   ' }, ['name']);
    expect(query).not.toContain('ILIKE');
  });
});
