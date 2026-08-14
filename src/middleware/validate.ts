import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

/**
 * Valida `req.body` contra un schema y reemplaza el body por el valor ya
 * parseado (con los tipos convertidos y los campos desconocidos descartados).
 *
 * Devuelve solo el PRIMER mensaje de error, bajo la clave `error`, porque es
 * el contrato que el frontend ya consume en todos lados
 * (`err.response?.data?.error`). Los mensajes se definen en español dentro de
 * cada schema: los de zod por defecto son técnicos y en inglés, y mostrárselos
 * al usuario sería un retroceso respecto de la validación manual que había.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const first = result.error.issues[0];
      return res.status(400).json({ error: first?.message || 'Datos inválidos' });
    }

    req.body = result.data as any;
    next();
  };
}
