import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Express convierte headers a minúsculas, pero también podemos usar el original
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && (typeof authHeader === 'string' ? authHeader.split(' ')[1] : authHeader[0]?.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'default_secret_change_in_production';
  
  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
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

