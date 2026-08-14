import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { initializeDatabase } from '../database/init';
import { closeDatabase } from '../config/database';
import {
  hasDatabase, resetDatabase, createOptic, createClient, createProduct,
  getProductQuantity, TestOptic,
} from './helpers/db';

/**
 * El aislamiento entre ópticas es la propiedad más cara de romper de todo el
 * sistema: si falla, un cliente ve y edita los datos de otro. Estos tests
 * existen para que las regresiones de MT-01/MT-02 no puedan volver en silencio.
 */
describe.skipIf(!hasDatabase)('aislamiento entre ópticas', () => {
  const app = createApp();
  let opticaA: TestOptic;
  let opticaB: TestOptic;

  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    opticaA = await createOptic('optica-a');
    opticaB = await createOptic('optica-b');
  });

  describe('lectura', () => {
    it('no deja leer un cliente de otra óptica', async () => {
      const clienteDeB = await createClient(opticaB.opticsId, 'Cliente de B');

      const res = await request(app)
        .get(`/api/clients/${clienteDeB}`)
        .set('Authorization', `Bearer ${opticaA.token}`);

      expect(res.status).toBe(403);
    });

    it('no incluye clientes de otra óptica en el listado', async () => {
      await createClient(opticaA.opticsId, 'Cliente de A');
      await createClient(opticaB.opticsId, 'Cliente de B');

      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${opticaA.token}`);

      expect(res.status).toBe(200);
      const nombres = res.body.data.map((c: any) => c.name);
      expect(nombres).toContain('Cliente de A');
      expect(nombres).not.toContain('Cliente de B');
    });

    it('no deja leer un producto de otra óptica', async () => {
      const productoDeB = await createProduct(opticaB.opticsId, 'Armazón de B');

      const res = await request(app)
        .get(`/api/products/${productoDeB}`)
        .set('Authorization', `Bearer ${opticaA.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('escritura cruzada (MT-02)', () => {
    it('ignora optics_id del body al crear un cliente', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${opticaA.token}`)
        .send({ name: 'Intruso', optics_id: opticaB.opticsId });

      expect(res.status).toBe(201);
      // Lo importante: el cliente quedó en la óptica del token, no en la del body.
      expect(res.body.optics_id).toBe(opticaA.opticsId);
    });

    it('ignora optics_id del body al crear un producto', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${opticaA.token}`)
        .send({ name: 'Armazón intruso', optics_id: opticaB.opticsId, price: 100, quantity: 5 });

      expect(res.status).toBe(201);
      expect(res.body.optics_id).toBe(opticaA.opticsId);
    });

    it('no deja editar un cliente de otra óptica', async () => {
      const clienteDeB = await createClient(opticaB.opticsId, 'Cliente de B');

      const res = await request(app)
        .put(`/api/clients/${clienteDeB}`)
        .set('Authorization', `Bearer ${opticaA.token}`)
        .send({ name: 'Renombrado por A' });

      expect(res.status).toBe(403);
    });

    it('no deja eliminar un cliente de otra óptica', async () => {
      const clienteDeB = await createClient(opticaB.opticsId, 'Cliente de B');

      const res = await request(app)
        .delete(`/api/clients/${clienteDeB}`)
        .set('Authorization', `Bearer ${opticaA.token}`);

      expect(res.status).toBe(403);
    });

    it('no deja vender un producto de otra óptica', async () => {
      const clienteDeA = await createClient(opticaA.opticsId, 'Cliente de A');
      const productoDeB = await createProduct(opticaB.opticsId, 'Armazón de B');

      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${opticaA.token}`)
        .send({
          client_id: clienteDeA,
          products: [{ product_id: productoDeB, quantity: 1, unit_price: 100 }],
        });

      expect(res.status).toBe(404);
    });

    it('no deja registrar una venta a un cliente de otra óptica', async () => {
      const clienteDeB = await createClient(opticaB.opticsId, 'Cliente de B');
      const productoDeA = await createProduct(opticaA.opticsId, 'Armazón de A');

      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${opticaA.token}`)
        .send({
          client_id: clienteDeB,
          products: [{ product_id: productoDeA, quantity: 1, unit_price: 100 }],
        });

      expect(res.status).toBe(403);
    });
  });
});

describe.skipIf(!hasDatabase)('stock en ventas (UI-10)', () => {
  const app = createApp();
  let optica: TestOptic;

  beforeAll(async () => { await initializeDatabase(); });
  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => {
    await resetDatabase();
    optica = await createOptic('optica-stock');
  });

  it('descuenta el stock al registrar la venta', async () => {
    const cliente = await createClient(optica.opticsId, 'Paciente');
    const producto = await createProduct(optica.opticsId, 'Armazón', 10);

    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${optica.token}`)
      .send({ client_id: cliente, products: [{ product_id: producto, quantity: 3, unit_price: 100 }] });

    expect(res.status).toBe(201);
    expect(await getProductQuantity(producto)).toBe(7);
  });

  it('rechaza la venta si no hay stock suficiente y no deja el stock negativo', async () => {
    const cliente = await createClient(optica.opticsId, 'Paciente');
    const producto = await createProduct(optica.opticsId, 'Armazón', 2);

    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${optica.token}`)
      .send({ client_id: cliente, products: [{ product_id: producto, quantity: 5, unit_price: 100 }] });

    expect(res.status).toBe(400);
    // La transacción tiene que haber revertido: el stock queda intacto.
    expect(await getProductQuantity(producto)).toBe(2);
  });

  it('devuelve el stock al eliminar la venta', async () => {
    const cliente = await createClient(optica.opticsId, 'Paciente');
    const producto = await createProduct(optica.opticsId, 'Armazón', 10);

    const venta = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${optica.token}`)
      .send({ client_id: cliente, products: [{ product_id: producto, quantity: 4, unit_price: 100 }] });

    expect(await getProductQuantity(producto)).toBe(6);

    await request(app)
      .delete(`/api/sales/${venta.body.id}`)
      .set('Authorization', `Bearer ${optica.token}`);

    expect(await getProductQuantity(producto)).toBe(10);
  });
});

/**
 * Estos casos existen por un incidente concreto: el guard que exige RETURNING id
 * en los INSERT rompió el registro y el arranque en base nueva, y ninguna prueba
 * lo detectó porque la suite creaba usuarios y ópticas por atajo, sin pasar nunca
 * por los endpoints reales ni por un borrado exitoso.
 */
describe.skipIf(!hasDatabase)('altas y bajas end-to-end', () => {
  const app = createApp();

  beforeAll(async () => { await initializeDatabase(); });
  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => { await resetDatabase(); });

  it('registra una óptica nueva con su usuario owner', async () => {
    const res = await request(app)
      .post('/api/auth/request-user')
      .send({
        username: 'nuevaoptica',
        email: 'nueva@optica.test',
        password: 'secreto123',
        optics_name: 'Óptica Nueva',
      });

    expect(res.status).toBe(201);

    // El usuario tiene que quedar realmente creado y como owner de su óptica.
    const { getRow } = await import('../config/database');
    const user = await getRow<any>(
      'SELECT username, role, optics_id, license_type FROM users WHERE username = ?',
      ['nuevaoptica']
    );
    expect(user).toBeDefined();
    expect(user.role).toBe('owner');
    expect(user.license_type).toBe('trial');
    expect(user.optics_id).toBeGreaterThan(0);
  });

  it('no deja ópticas huérfanas si el registro falla por username repetido', async () => {
    const payload = {
      username: 'repetido',
      email: 'uno@optica.test',
      password: 'secreto123',
      optics_name: 'Óptica Repetida',
    };
    await request(app).post('/api/auth/request-user').send(payload);

    const segundo = await request(app)
      .post('/api/auth/request-user')
      .send({ ...payload, email: 'dos@optica.test' });

    expect(segundo.status).toBe(400);

    const { getRows } = await import('../config/database');
    const opticas = await getRows<any>('SELECT id FROM optics WHERE name = ?', ['Óptica Repetida']);
    expect(opticas).toHaveLength(1);
  });

  it('elimina un cliente y deja registro en el log de eliminaciones', async () => {
    const optica = await createOptic('optica-borrado');
    const cliente = await createClient(optica.opticsId, 'Cliente a borrar');

    const res = await request(app)
      .delete(`/api/clients/${cliente}`)
      .set('Authorization', `Bearer ${optica.token}`);

    expect(res.status).toBe(200);

    const { getRow } = await import('../config/database');
    const log = await getRow<any>(
      'SELECT table_name, record_id FROM deletion_logs WHERE table_name = ? AND record_id = ?',
      ['clients', cliente]
    );
    expect(log).toBeDefined();
  });

  it('inicializa una base vacía dos veces seguidas sin romperse', async () => {
    // initializeDatabase corre en cada arranque: tiene que ser idempotente,
    // incluida la creación del usuario admin inicial.
    process.env.ADMIN_PASSWORD = 'admin-de-prueba';
    await initializeDatabase();
    await expect(initializeDatabase()).resolves.not.toThrow();

    const { getRows } = await import('../config/database');
    const admins = await getRows<any>('SELECT id FROM users WHERE username = ?', ['admin']);
    expect(admins).toHaveLength(1);
    delete process.env.ADMIN_PASSWORD;
  });
});

describe.skipIf(!hasDatabase)('licencia y validación', () => {
  const app = createApp();

  beforeAll(async () => { await initializeDatabase(); });
  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => { await resetDatabase(); });

  it('bloquea a un usuario con la licencia vencida (EST-03)', async () => {
    const vencida = await createOptic('optica-vencida', { licenseType: 'active', expiresInDays: -1 });

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${vencida.token}`);

    expect(res.status).toBe(403);
    expect(res.body.license_expired).toBe(true);
  });

  it('bloquea a un usuario cuya cuenta fue desactivada', async () => {
    const optica = await createOptic('optica-baja');
    const { runQuery } = await import('../config/database');
    await runQuery('UPDATE users SET is_active = 0 WHERE id = ?', [optica.userId]);

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${optica.token}`);

    expect(res.status).toBe(403);
  });

  it('neutraliza la inyección SQL por sortBy (SEC-01)', async () => {
    const optica = await createOptic('optica-sqli');
    await createClient(optica.opticsId, 'Cliente');

    const res = await request(app)
      .get('/api/clients')
      .query({ sortBy: 'name; DROP TABLE clients;--', sortOrder: 'ASC' })
      .set('Authorization', `Bearer ${optica.token}`);

    // Cae al orden por defecto en vez de romper (o peor, ejecutar).
    expect(res.status).toBe(200);
    // La tabla sigue existiendo.
    const check = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${optica.token}`);
    expect(check.status).toBe(200);
    expect(check.body.data).toHaveLength(1);
  });

  it('devuelve 404 JSON en rutas /api inexistentes (EST-04)', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error).toBeDefined();
  });

  it('rechaza un cliente sin nombre con mensaje en español (POST-02)', async () => {
    const optica = await createOptic('optica-validacion');

    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${optica.token}`)
      .send({ document_id: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El nombre del cliente es requerido');
  });
});
