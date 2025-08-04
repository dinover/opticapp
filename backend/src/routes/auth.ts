import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../database/init';
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
    const client = await pool.connect();
    
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create optic first
      const opticResult = await client.query(
        'INSERT INTO optics (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
        [optic_name, optic_address, optic_phone, optic_email]
      );

      const optic = opticResult.rows[0];

      // Create user
      const userResult = await client.query(
        'INSERT INTO users (username, email, password, optic_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username, email, hashedPassword, optic.id, 'admin']
      );

      const user = userResult.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const response: AuthResponse = { 
        token, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          optic_id: user.optic_id,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }, 
        optic 
      };
      
      res.status(201).json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password }: LoginRequest = req.body;

  try {
    const client = await pool.connect();
    
    try {
      // Find user
      const userResult = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Get optic info
      const opticResult = await client.query(
        'SELECT * FROM optics WHERE id = $1',
        [user.optic_id]
      );

      if (opticResult.rows.length === 0) {
        return res.status(500).json({ error: 'Optic not found' });
      }

      const optic = opticResult.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const response: AuthResponse = { 
        token, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          optic_id: user.optic_id,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }, 
        optic 
      };
      
      res.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    
    try {
      const authReq = req as any;
      
      const userResult = await client.query(
        'SELECT id, username, email, optic_id, role, created_at, updated_at FROM users WHERE id = $1',
        [authReq.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // Get optic info
      const opticResult = await client.query(
        'SELECT * FROM optics WHERE id = $1',
        [user.optic_id]
      );

      if (opticResult.rows.length === 0) {
        return res.status(500).json({ error: 'Optic not found' });
      }

      const optic = opticResult.rows[0];

      res.json({ user, optic });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router; 