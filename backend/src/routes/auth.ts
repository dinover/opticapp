import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate, insertOptic, insertUser } from '../database/query';

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
    // Check if username already exists
    const existingUser = await executeQuerySingle(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username already exists. Please choose a different username.' 
      });
    }

    // Check if email already exists
    const existingEmail = await executeQuerySingle(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingEmail) {
      return res.status(400).json({ 
        error: 'Email already exists. Please use a different email address.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create optic first
    const optic = await insertOptic(optic_name, optic_address, optic_phone, optic_email);

    // Create user with is_approved = false and role = 'user'
    const user = await insertUser(username, email, hashedPassword, optic.id, 'user', false);

    // Create registration request
    await executeInsert(
      'INSERT INTO registration_requests (user_id, optic_id, status) VALUES ($1, $2, $3)',
      [user.id, optic.id, 'pending']
    );

    res.status(201).json({ 
      message: 'Registration submitted successfully. Your account will be reviewed by an administrator before you can log in.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        optic_id: user.optic_id,
        role: user.role,
        is_approved: user.is_approved,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      optic 
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle database constraint violations
    if (error.code === '23505') { // PostgreSQL unique violation error code
      if (error.constraint?.includes('username')) {
        return res.status(400).json({ 
          error: 'Username already exists. Please choose a different username.' 
        });
      }
      if (error.constraint?.includes('email')) {
        return res.status(400).json({ 
          error: 'Email already exists. Please use a different email address.' 
        });
      }
    }
    
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
    // Find user
    const userResult = await executeQuerySingle(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (!userResult) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult;

    // Check if user is approved
    if (!user.is_approved) {
      return res.status(403).json({ 
        error: 'Account not approved yet. Please wait for administrator approval.' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get optic info
    const opticResult = await executeQuerySingle(
      'SELECT * FROM optics WHERE id = $1',
      [user.optic_id]
    );

    if (!opticResult) {
      return res.status(500).json({ error: 'Optic not found' });
    }

    const optic = opticResult;

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
        is_approved: user.is_approved,
        created_at: user.created_at,
        updated_at: user.updated_at
      }, 
      optic 
    };
    
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    
    const userResult = await executeQuerySingle(
      'SELECT id, username, email, optic_id, role, created_at, updated_at FROM users WHERE id = $1',
      [authReq.user.id]
    );

    if (!userResult) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult;

    // Get optic info
    const opticResult = await executeQuerySingle(
      'SELECT * FROM optics WHERE id = $1',
      [user.optic_id]
    );

    if (!opticResult) {
      return res.status(500).json({ error: 'Optic not found' });
    }

    const optic = opticResult;

    res.json({ user, optic });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get registration requests (admin only)
router.get('/registration-requests', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    
    // Check if user is admin
    if (authReq.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await executeQuery(`
      SELECT 
        rr.*,
        u.username,
        u.email,
        o.name as optic_name,
        o.address as optic_address,
        o.phone as optic_phone,
        o.email as optic_email
      FROM registration_requests rr
      JOIN users u ON rr.user_id = u.id
      JOIN optics o ON rr.optic_id = o.id
      ORDER BY rr.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Approve/reject registration request (admin only)
router.put('/registration-requests/:id', authenticateToken, [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('admin_notes').optional().isString().withMessage('Admin notes must be a string')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const authReq = req as any;
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    // Check if user is admin
    if (authReq.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get the registration request
    const requestResult = await executeQuerySingle(
      'SELECT * FROM registration_requests WHERE id = $1',
      [id]
    );
    
    if (!requestResult) {
      return res.status(404).json({ error: 'Registration request not found' });
    }
    
    const request = requestResult;
    
    // Update registration request
    await executeUpdate(
      'UPDATE registration_requests SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP WHERE id = $4',
      [status, admin_notes, authReq.user.id, id]
    );
    
    if (status === 'approved') {
      // Approve the user
      await executeUpdate(
        'UPDATE users SET is_approved = $1 WHERE id = $2',
        [true, request.user_id]
      );
    }
    
    res.json({ message: `Registration request ${status} successfully` });
  } catch (error) {
    console.error('Error updating registration request:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Promote user to admin (admin only)
router.post('/promote-to-admin', authenticateToken, [
  body('username').notEmpty().withMessage('Username is required'),
  body('admin_secret').notEmpty().withMessage('Admin secret is required')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, admin_secret } = req.body;
  const authReq = req as any;

  // Check if current user is admin
  if (authReq.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Check admin secret (you should set this in environment variables)
  const expectedSecret = process.env.ADMIN_SECRET || 'admin2995';
  if (admin_secret !== expectedSecret) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }

  try {
    // Find user
    const userResult = await executeQuerySingle(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (!userResult) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult;

    // Update user to admin and approve
    await executeUpdate(
      'UPDATE users SET role = $1, is_approved = $2 WHERE id = $3',
      ['admin', true, user.id]
    );

    res.json({ 
      message: `User ${username} promoted to admin successfully`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'admin',
        is_approved: true
      }
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Check if user exists
    const user = await executeQuerySingle(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await executeUpdate(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, resetTokenExpiry, email]
    );

    // TODO: Send email with reset link
    // For now, we'll return the token (in production, send via email)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ 
      message: 'If the email exists, a reset link has been sent',
      // Remove this in production - only for development/testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token, password } = req.body;

  try {
    // Find user with valid reset token
    const user = await executeQuerySingle(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await executeUpdate(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

export default router; 