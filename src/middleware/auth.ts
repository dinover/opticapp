import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    optics_id: number | null;
  };
}

// La óptica del usuario ya viaja en el JWT (ver routes/auth.ts login) — resolverla
// acá evita que cada router tenga que volver a consultar la tabla users en cada
// request solo para saber en qué óptica opera.
export function getOpticsScope(user: NonNullable<AuthRequest['user']>): number | null {
  return user.role === 'admin' ? null : (user.optics_id ?? null);
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Express convierte headers a minúsculas, pero también podemos usar el original
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && (typeof authHeader === 'string' ? authHeader.split(' ')[1] : authHeader[0]?.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    // Tokens emitidos antes de incluir optics_id en el payload no lo traen.
    // No asumir null (eso significaría "sin restricción" para un usuario no-admin,
    // reabriendo el bug de fuga entre ópticas) — mejor pedir que vuelva a loguearse.
    if (user.role !== 'admin' && user.optics_id === undefined) {
      return res.status(401).json({ error: 'Tu sesión es de una versión anterior. Volvé a iniciar sesión.' });
    }

    req.user = user;
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }

  next();
}

