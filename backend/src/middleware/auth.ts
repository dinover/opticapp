import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../database/init';
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

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      // Get user from database
      const client = await pool.connect();
      const result = await client.query(
        'SELECT id, username, email, optic_id, role, created_at, updated_at FROM users WHERE id = $1',
        [decoded.userId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Type the user object properly
      const typedUser: Omit<User, 'password'> = {
        id: user.id,
        username: user.username,
        email: user.email,
        optic_id: user.optic_id,
        role: user.role,
        is_approved: user.is_approved,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      req.user = typedUser;
      req.opticId = typedUser.optic_id;
      next();
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
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