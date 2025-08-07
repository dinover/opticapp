import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { executeQuerySingle } from '../database/query';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await executeQuerySingle(`
      SELECT * FROM users WHERE id = $1
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const typedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      optic_id: user.optic_id,
      is_approved: user.is_approved
    };

    req.user = typedUser;
    next();
  } catch (err: any) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

export const validateOpticAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const opticId = parseInt(req.params.opticId || req.body.optic_id);
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.optic_id !== opticId) {
    return res.status(403).json({ error: 'Access denied to this optic' });
  }
  
  next();
}; 