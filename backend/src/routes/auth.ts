import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

const router = Router();

// Register new optic and admin user
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('optic_name').notEmpty().withMessage('Optic name is required'),
  body('optic_address').notEmpty().withMessage('Optic address is required'),
  body('optic_phone').notEmpty().withMessage('Optic phone is required'),
  body('optic_email').isEmail().withMessage('Valid optic email required')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, optic_name, optic_address, optic_phone, optic_email }: RegisterRequest = req.body;

  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (user) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // Create optic first
      db.run(
        'INSERT INTO optics (name, address, phone, email) VALUES (?, ?, ?, ?)',
        [optic_name, optic_address, optic_phone, optic_email],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create optic' });
          }

          const opticId = this.lastID;

          // Hash password and create user
          bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
              return res.status(500).json({ error: 'Password hashing failed' });
            }

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

                // Get created user and optic
                db.get(
                  'SELECT id, username, email, optic_id, role, created_at, updated_at FROM users WHERE id = ?',
                  [userId],
                  (err, user) => {
                    if (err) {
                      return res.status(500).json({ error: 'Database error' });
                    }

                    db.get('SELECT * FROM optics WHERE id = ?', [opticId], (err, optic) => {
                      if (err) {
                        return res.status(500).json({ error: 'Database error' });
                      }

                      const response: AuthResponse = {
                        token,
                        user: user!,
                        optic: optic!
                      };

                      res.status(201).json(response);
                    });
                  }
                );
              }
            );
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
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
    async (err, result) => {
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
    (err, result) => {
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