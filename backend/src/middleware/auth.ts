import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/init';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
  opticId?: number;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Get user from database
    db.get(
      'SELECT id, username, email, optic_id, role, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId],
      (err, user: any) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Type the user object properly
        const typedUser: Omit<User, 'password'> = {
          id: user.id,
          username: user.username,
          email: user.email,
          optic_id: user.optic_id,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        };

        req.user = typedUser;
        req.opticId = typedUser.optic_id;
        next();
      }
    );
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export const validateOpticAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const opticId = parseInt(req.params.opticId || req.body.optic_id);
  
  if (!req.user || req.user.optic_id !== opticId) {
    return res.status(403).json({ error: 'Access denied to this optic' });
  }

  next();
}; 