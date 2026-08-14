import { z } from 'zod';

/**
 * Schemas de validación de bodies.
 *
 * Replican EXACTAMENTE las reglas que ya aplicaban los handlers a mano, con
 * los mismos mensajes en español. El objetivo de esta capa no es endurecer las
 * reglas (eso rompería clientes existentes) sino centralizarlas, convertir los
 * tipos de forma consistente y descartar campos que el cliente no debería poder
 * mandar. Los chequeos redundantes que quedan dentro de los handlers actúan
 * como defensa en profundidad.
 */

/** Campo de texto opcional: '' se normaliza a null, igual que hacía `valor || null`. */
const optionalText = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform(v => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
  });

/** Number que acepta string (los formularios mandan todo como texto). */
const numberFrom = (message: string) =>
  z.coerce.number({ message }).refine(n => !Number.isNaN(n), { message });

// ── Auth ──────────────────────────────────────────────

export const requestUserSchema = z.object({
  username: z.string({ message: 'Username, email, password y nombre de la óptica son requeridos' })
    .trim().min(1, 'Username, email, password y nombre de la óptica son requeridos'),
  email: z.string({ message: 'Username, email, password y nombre de la óptica son requeridos' })
    .trim().min(1, 'Username, email, password y nombre de la óptica son requeridos'),
  password: z.string({ message: 'Username, email, password y nombre de la óptica son requeridos' })
    .min(1, 'Username, email, password y nombre de la óptica son requeridos'),
  optics_name: z.string({ message: 'Username, email, password y nombre de la óptica son requeridos' })
    .trim().min(1, 'Username, email, password y nombre de la óptica son requeridos'),
});

export const loginSchema = z.object({
  username: z.string({ message: 'Username y password son requeridos' })
    .min(1, 'Username y password son requeridos'),
  password: z.string({ message: 'Username y password son requeridos' })
    .min(1, 'Username y password son requeridos'),
});

export const changePasswordSchema = z.object({
  current_password: z.string({ message: 'La contraseña actual y la nueva son requeridas' })
    .min(1, 'La contraseña actual y la nueva son requeridas'),
  new_password: z.string({ message: 'La contraseña actual y la nueva son requeridas' })
    .min(6, 'La contraseña nueva debe tener al menos 6 caracteres'),
});

export const adminUpdateUserSchema = z.object({
  username: z.string().trim().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
});

export const createTeamUserSchema = z.object({
  username: z.string({ message: 'Username, email y password son requeridos' })
    .trim().min(1, 'Username, email y password son requeridos'),
  email: z.string({ message: 'Username, email y password son requeridos' })
    .trim().min(1, 'Username, email y password son requeridos'),
  password: z.string({ message: 'Username, email y password son requeridos' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ── Clientes ──────────────────────────────────────────

const clientFields = {
  name: z.string({ message: 'El nombre del cliente es requerido' })
    .trim().min(1, 'El nombre del cliente es requerido'),
  document_id: optionalText,
  email: optionalText,
  phone: optionalText,
  address: optionalText,
  birth_date: optionalText,
  notes: optionalText,
};

export const createClientSchema = z.object({
  ...clientFields,
  // Solo lo usa un admin operando sobre otra óptica; el handler vuelve a
  // verificar el rol antes de hacerle caso.
  optics_id: z.coerce.number().int().positive().optional(),
});

export const updateClientSchema = z.object(clientFields);

// ── Productos ─────────────────────────────────────────

const productFields = {
  name: z.string({ message: 'El nombre del producto es requerido' })
    .trim().min(1, 'El nombre del producto es requerido'),
  price: numberFrom('El precio debe ser un número válido mayor o igual a 0')
    .min(0, 'El precio debe ser un número válido mayor o igual a 0')
    .optional(),
  quantity: numberFrom('La cantidad debe ser un número válido mayor o igual a 0')
    .int('La cantidad debe ser un número válido mayor o igual a 0')
    .min(0, 'La cantidad debe ser un número válido mayor o igual a 0')
    .optional(),
  description: optionalText,
  image_url: optionalText,
};

export const createProductSchema = z.object({
  ...productFields,
  optics_id: z.coerce.number().int().positive().optional(),
});

export const updateProductSchema = z.object(productFields);

// ── Proveedores ───────────────────────────────────────

const supplierFields = {
  name: z.string({ message: 'El nombre del proveedor es requerido' })
    .trim().min(1, 'El nombre del proveedor es requerido'),
  contact_name: optionalText,
  phone: optionalText,
  email: optionalText,
  notes: optionalText,
};

export const createSupplierSchema = z.object({
  ...supplierFields,
  optics_id: z.coerce.number().int().positive().optional(),
});

export const updateSupplierSchema = z.object(supplierFields);

// ── Ópticas ───────────────────────────────────────────

export const opticsSchema = z.object({
  name: z.string({ message: 'El nombre de la óptica es requerido' })
    .trim().min(1, 'El nombre de la óptica es requerido'),
  address: optionalText,
  phone: optionalText,
  email: optionalText,
});

// ── Ventas ────────────────────────────────────────────

const saleProductSchema = z.object({
  product_id: z.coerce.number({ message: 'Producto inválido en la venta' }).int().positive('Producto inválido en la venta'),
  quantity: numberFrom('La cantidad debe ser mayor a 0').positive('La cantidad debe ser mayor a 0'),
  unit_price: numberFrom('El precio unitario debe ser un número válido mayor o igual a 0')
    .min(0, 'El precio unitario debe ser un número válido mayor o igual a 0'),
});

/** Graduación óptica: puede venir vacía, en null, o como número con signo. */
const opticValue = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform(v => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  });

const saleFields = {
  sale_date: optionalText,
  od_esf: opticValue, od_cil: opticValue, od_eje: opticValue, od_add: opticValue,
  oi_esf: opticValue, oi_cil: opticValue, oi_eje: opticValue, oi_add: opticValue,
  notes: optionalText,
};

export const createSaleSchema = z.object({
  ...saleFields,
  client_id: z.coerce.number({ message: 'El cliente es requerido' })
    .int('El cliente es requerido').positive('El cliente es requerido'),
  products: z.array(saleProductSchema, { message: 'Debe agregar al menos un producto a la venta' })
    .min(1, 'Debe agregar al menos un producto a la venta'),
  optics_id: z.coerce.number().int().positive().optional(),
});

export const updateSaleSchema = z.object({
  ...saleFields,
  // En edición los productos son opcionales: si no vienen, la venta conserva
  // los que ya tenía.
  products: z.array(saleProductSchema).optional(),
});

// ── Dashboard ─────────────────────────────────────────

export const dashboardConfigSchema = z.object({
  // El handler acepta tanto un objeto como un string ya serializado.
  sections_visible: z.union([z.string(), z.record(z.string(), z.boolean())], {
    message: 'La configuración de secciones es requerida',
  }),
});
