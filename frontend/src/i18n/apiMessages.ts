import type { Lang } from '../utils/lang';

/*
 * El backend responde siempre en español. Con la interfaz en inglés, el
 * interceptor de services/api.ts pasa cada `error` / `message` por acá.
 * Un mensaje que no está en la lista se muestra tal cual.
 *
 * Al agregar un mensaje nuevo en el backend (src/routes, src/middleware,
 * src/schemas, src/utils/license.ts), sumarlo también acá.
 */
const EXACT: Record<string, string> = {
  // Autenticación y acceso
  'Credenciales inválidas': 'Invalid credentials',
  'Username y password son requeridos': 'Username and password are required',
  'Username, email y password son requeridos': 'Username, email and password are required',
  'Username, email, password y nombre de la óptica son requeridos': 'Username, email, password and store name are required',
  'Demasiados intentos. Esperá unos minutos y volvé a intentar.': 'Too many attempts. Please wait a few minutes and try again.',
  'El username ya está en uso': 'That username is already taken',
  'Ese nombre de usuario ya está en uso': 'That username is already taken',
  'El email ya está en uso': 'That email is already in use',
  'Ya existe una solicitud pendiente con este username o email': 'There is already a pending request with this username or email',
  'El nombre de usuario debe tener al menos 3 caracteres': 'Username must be at least 3 characters',
  'La contraseña debe tener al menos 6 caracteres': 'Password must be at least 6 characters',
  'La contraseña actual no es correcta': 'Your current password is incorrect',
  'La contraseña actual y la nueva son requeridas': 'Current and new passwords are required',
  'La contraseña nueva debe ser distinta de la actual': 'The new password must be different from the current one',
  'La contraseña nueva debe tener al menos 6 caracteres': 'The new password must be at least 6 characters',
  'Contraseña actualizada correctamente': 'Password updated successfully',
  'Token de autenticación requerido': 'Authentication token required',
  'Token inválido o expirado': 'Invalid or expired token',
  'Tu sesión es de una versión anterior. Volvé a iniciar sesión.': 'Your session is from a previous version. Please log in again.',
  'Autenticación requerida': 'Authentication required',
  'Usuario no autenticado': 'User not authenticated',
  'Acceso denegado': 'Access denied',
  'Acceso denegado. Se requiere rol de administrador': 'Access denied. Administrator role required',
  'Acceso denegado. Se requiere rol de dueño de óptica': 'Access denied. Store owner role required',
  'Tu cuenta fue desactivada. Contactá al administrador.': 'Your account was deactivated. Contact the administrator.',
  'Tu período de prueba de 7 días ha vencido. Contactá al administrador para activar tu licencia.':
    'Your 7-day trial has ended. Contact the administrator to activate your license.',
  'Tu licencia ha vencido. Contactá al administrador para renovarla.':
    'Your license has expired. Contact the administrator to renew it.',

  // Usuarios, equipo y solicitudes
  'Usuario no encontrado': 'User not found',
  'Usuario desactivado correctamente': 'User deactivated successfully',
  'No podés desactivar tu propio usuario': 'You can’t deactivate your own user',
  'No podés eliminar tu propio usuario': 'You can’t delete your own user',
  'Solo se pueden desactivar empleados de tu equipo': 'You can only deactivate employees on your team',
  'No se puede modificar la licencia del admin': 'The admin license can’t be modified',
  'Solicitud no encontrada': 'Request not found',
  'Solicitud aprobada. El usuario tiene acceso por 1 mes.': 'Request approved. The user has access for 1 month.',
  'Solicitud rechazada': 'Request rejected',
  'La solicitud ya fue procesada': 'The request was already processed',
  'La solicitud no tiene nombre de óptica especificado': 'The request has no store name',
  'No se encontró ninguna solicitud para este usuario': 'No request was found for this user',

  // Ópticas
  'El nombre de la óptica es requerido': 'Store name is required',
  'Error al crear la óptica': 'Could not create the store',
  'Óptica no encontrada': 'Store not found',
  'Óptica eliminada correctamente': 'Store deleted successfully',
  'No se pudo determinar la óptica': 'Could not determine the store',
  'No se pudo determinar la óptica. Se requiere optics_id.': 'Could not determine the store. optics_id is required.',
  'No tienes acceso a esta óptica': 'You don’t have access to this store',

  // Clientes
  'El nombre del cliente es requerido': 'Client name is required',
  'El cliente es requerido': 'Client is required',
  'Cliente no encontrado': 'Client not found',
  'Cliente eliminado correctamente': 'Client deleted successfully',
  'El cliente no pertenece a esta óptica': 'The client doesn’t belong to this store',
  'No tienes acceso a este cliente': 'You don’t have access to this client',

  // Productos y proveedores
  'El nombre del producto es requerido': 'Product name is required',
  'El precio debe ser un número válido mayor o igual a 0': 'Price must be a valid number greater than or equal to 0',
  'La cantidad debe ser un número válido mayor o igual a 0': 'Quantity must be a valid number greater than or equal to 0',
  'Producto no encontrado': 'Product not found',
  'Producto eliminado correctamente': 'Product deleted successfully',
  'No tienes acceso a este producto': 'You don’t have access to this product',
  'El nombre del proveedor es requerido': 'Supplier name is required',
  'Proveedor no encontrado': 'Supplier not found',
  'Proveedor eliminado correctamente': 'Supplier deleted successfully',
  'No tienes acceso a este proveedor': 'You don’t have access to this supplier',

  // Ventas
  'Debe agregar al menos un producto a la venta': 'Add at least one product to the sale',
  'El precio unitario debe ser un número válido mayor o igual a 0': 'Unit price must be a valid number greater than or equal to 0',
  'La cantidad debe ser mayor a 0': 'Quantity must be greater than 0',
  'Producto inválido en la venta': 'Invalid product in the sale',
  'Error al calcular el total de la venta': 'Could not calculate the sale total',
  'Venta no encontrada': 'Sale not found',
  'Venta eliminada correctamente': 'Sale deleted successfully',
  'No tienes acceso a esta venta': 'You don’t have access to this sale',

  // Importación y reportes
  'No se recibió ningún archivo': 'No file was received',
  'El archivo está vacío o no tiene datos': 'The file is empty or has no data',
  'El archivo debe tener una columna "articulo" (o "artículo", "nombre" o "name")':
    'The file must have a "name" column (or "articulo", "artículo" or "nombre")',
  'El archivo Excel está protegido con contraseña': 'The Excel file is password-protected',
  'Error al procesar el archivo. Verifica que sea un archivo Excel válido (.xlsx o .xls)':
    'Could not process the file. Make sure it’s a valid Excel file (.xlsx or .xls)',
  'Error al generar el reporte': 'Could not generate the report',

  // Varios
  'La configuración de secciones es requerida': 'Section settings are required',
  'Error al obtener la imagen de Google Drive': 'Could not get the image from Google Drive',
  'Redirección a un host no permitido': 'Redirect to a host that isn’t allowed',
  'Demasiadas redirecciones': 'Too many redirects',
  'Ruta no encontrada': 'Route not found',
  'Datos inválidos': 'Invalid data',
  'Error interno del servidor': 'Internal server error',
};

/** Mensajes con datos variables (nombres, cantidades, fechas). */
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [
    /^Stock insuficiente de "(.+)": (?:queda 1 unidad|quedan (\d+) unidades) y estás vendiendo (\d+)$/,
    m => `Not enough stock of "${m[1]}": ${m[2] ? `${m[2]} units` : '1 unit'} left and you’re selling ${m[3]}`,
  ],
  [/^Producto con ID (\d+) no encontrado$/, m => `Product with ID ${m[1]} not found`],
  [/^Usuario "(.+)" actualizado correctamente$/, m => `User "${m[1]}" updated successfully`],
  [/^Usuario "(.+)" eliminado correctamente$/, m => `User "${m[1]}" deleted successfully`],
  [/^Licencia extendida hasta el (.+)$/, m => `License extended until ${m[1]}`],
  [/^Fila (\d+): (.+) — error al insertar$/, m => `Row ${m[1]}: ${m[2]} — could not be saved`],
  [
    /^¡Cuenta creada! Podés ingresar ahora mismo\. Tenés (\d+) días de prueba gratuita\.$/,
    m => `Account created! You can log in right away. You have a ${m[1]}-day free trial.`,
  ],
];

export function translateApiMessage(message: string, lang: Lang): string {
  if (lang !== 'en') return message;
  if (EXACT[message]) return EXACT[message];
  for (const [re, fn] of PATTERNS) {
    const m = message.match(re);
    if (m) return fn(m);
  }
  return message;
}
