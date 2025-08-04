import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

const router = Router();

// Register new user and optic
router.post('/register', [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('optic_name').notEmpty().withMessage('Optic name is required'),
  body('optic_address').notEmpty().withMessage('Optic address is required'),
  body('optic_phone').notEmpty().withMessage('Optic phone is required'),
  body('optic_email').isEmail().withMessage('Valid optic email is required')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, optic_name, optic_address, optic_phone, optic_email }: RegisterRequest = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    db.serialize(() => {
      // Create optic first
      db.run(
        'INSERT INTO optics (name, address, phone, email) VALUES (?, ?, ?, ?)',
        [optic_name, optic_address, optic_phone, optic_email],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create optic' });
          }

          const opticId = this.lastID;

          // Create user
          db.run(
            'INSERT INTO users (username, email, password, optic_id, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, opticId, 'admin'],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create user' });
              }

              const userId = this.lastID;

              // Generate JWT token
              const token = jwt.sign(
                { userId },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
              );

              const user = {
                id: userId,
                username,
                email,
                optic_id: opticId,
                role: 'admin' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const optic = {
                id: opticId,
                name: optic_name,
                address: optic_address,
                phone: optic_phone,
                email: optic_email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const response: AuthResponse = { token, user, optic };
              res.status(201).json(response);
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password }: LoginRequest = req.body;

  db.get(
    'SELECT u.*, o.* FROM users u JOIN optics o ON u.optic_id = o.id WHERE u.username = ?',
    [username],
    async (err, result: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, result.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const user = {
        id: result.id,
        username: result.username,
        email: result.email,
        optic_id: result.optic_id,
        role: result.role,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      const optic = {
        id: result.optic_id,
        name: result.name,
        address: result.address,
        phone: result.phone,
        email: result.email,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      const response: AuthResponse = { token, user, optic };
      res.json(response);
    }
  );
});

// Get current user profile
router.get('/profile', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.get(
    'SELECT u.*, o.* FROM users u JOIN optics o ON u.optic_id = o.id WHERE u.id = ?',
    [authReq.user.id],
    (err, result: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!result) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = {
        id: result.id,
        username: result.username,
        email: result.email,
        optic_id: result.optic_id,
        role: result.role,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      const optic = {
        id: result.optic_id,
        name: result.name,
        address: result.address,
        phone: result.phone,
        email: result.email,
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      res.json({ user, optic });
    }
  );
});

export default router; 