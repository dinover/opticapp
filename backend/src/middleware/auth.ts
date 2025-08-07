import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { executeQuerySingle } from '../database/query';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
  opticId?: number;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('=== AUTHENTICATION DEBUG ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Original URL:', req.originalUrl);
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token:', token ? 'Present' : 'Missing');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err: any, decoded: any) => {
    if (err) {
      console.log('JWT verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('JWT decoded:', decoded);
    try {
      console.log('Fetching user from database with ID:', decoded.userId);
      const user = await executeQuerySingle(
        'SELECT id, username, email, optic_id, role, is_approved, created_at, updated_at FROM users WHERE id = $1',
        [decoded.userId]
      );
      console.log('User from DB:', user);
      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ error: 'User not found' });
      }
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
      console.log('Typed user:', typedUser);
      console.log('Optic ID:', typedUser.optic_id);
      req.user = typedUser;
      req.opticId = typedUser.optic_id;
      console.log('=== AUTHENTICATION SUCCESS ===');
      next();
    } catch (error) {
      console.error('Database error in auth:', error);
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