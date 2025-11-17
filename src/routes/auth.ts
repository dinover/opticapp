import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRow, getRows, runQuery } from '../config/database';
import { User, UserRequest, UserRequestCreate, LoginRequest, AuthResponse } from '../types';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';

// Solicitar creación de usuario
router.post('/request-user', async (req: Request, res: Response) => {
  try {
    const { username, email, password, optics_name }: UserRequestCreate = req.body;

    if (!username || !email || !password || !optics_name) {
      return res.status(400).json({ error: 'Username, email, password y nombre de la óptica son requeridos' });
    }

    // Verificar si el username ya existe
    const existingUser = await getRow<User>('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'El username ya está en uso' });
    }

    // Verificar si el email ya existe
    const existingEmail = await getRow<User>('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    // Verificar si ya hay una solicitud pendiente
    const existingRequest = await getRow<UserRequest>(
      'SELECT id FROM user_requests WHERE (username = ? OR email = ?) AND status = ?',
      [username, email, 'pending']
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'Ya existe una solicitud pendiente con este username o email' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear solicitud
    await runQuery(
      `INSERT INTO user_requests (username, email, password, optics_name, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [username, email, hashedPassword, optics_name]
    );

    res.status(201).json({ message: 'Solicitud de usuario creada exitosamente. Esperando aprobación de un administrador.' });
  } catch (error: any) {
    console.error('Error al crear solicitud de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar estado de solicitud
router.get('/request-status/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const request = await getRow<UserRequest>(
      'SELECT id, username, email, status, requested_at FROM user_requests WHERE username = ? ORDER BY requested_at DESC LIMIT 1',
      [username]
    );

    if (!request) {
      return res.status(404).json({ error: 'No se encontró ninguna solicitud para este usuario' });
    }

    res.json({
      username: request.username,
      email: request.email,
      status: request.status,
      requested_at: request.requested_at
    });
  } catch (error: any) {
    console.error('Error al verificar estado de solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    // Buscar usuario activo
    const user = await getRow<User>(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Obtener información de la óptica si existe
    const userWithOptics = await getRow<{ optics_id: number | null }>(
      'SELECT optics_id FROM users WHERE id = ?',
      [user.id]
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        optics_id: userWithOptics?.optics_id || null
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error al hacer login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil del usuario autenticado
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const user = await getRow<User>(
      'SELECT id, username, email, role, optics_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      optics_id: user.optics_id || null,
      created_at: user.created_at
    });
  } catch (error: any) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ADMIN: Listar todas las solicitudes
router.get('/admin/requests', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await getRows<UserRequest>(
      `SELECT 
        ur.id, 
        ur.username, 
        ur.email, 
        ur.optics_name,
        ur.status, 
        ur.requested_at, 
        ur.reviewed_at,
        ur.reviewed_by,
        u.username as reviewer_username
      FROM user_requests ur
      LEFT JOIN users u ON ur.reviewed_by = u.id
      ORDER BY ur.requested_at DESC`
    );

    res.json(requests);
  } catch (error: any) {
    console.error('Error al listar solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ADMIN: Aprobar solicitud
router.post('/admin/requests/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener la solicitud
    const request = await getRow<UserRequest>(
      'SELECT * FROM user_requests WHERE id = ?',
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'La solicitud ya fue procesada' });
    }

    if (!request.optics_name) {
      return res.status(400).json({ error: 'La solicitud no tiene nombre de óptica especificado' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await getRow<User>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [request.username, request.email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario con este username o email' });
    }

    // Verificar si ya existe una óptica con ese nombre
    let optics = await getRow<any>(
      'SELECT id FROM optics WHERE name = ? AND is_active = 1',
      [request.optics_name]
    );

    let opticsId: number;

    if (!optics) {
      // Crear la óptica si no existe
      const result = await runQuery(
        `INSERT INTO optics (name, is_active)
         VALUES (?, 1)`,
        [request.optics_name]
      );
      opticsId = result.lastID;
    } else {
      opticsId = optics.id;
    }

    // Crear el usuario con la óptica asignada
    await runQuery(
      `INSERT INTO users (username, email, password, role, optics_id)
       VALUES (?, ?, ?, 'user', ?)`,
      [request.username, request.email, request.password, opticsId]
    );

    // Actualizar el estado de la solicitud
    await runQuery(
      `UPDATE user_requests 
       SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
       WHERE id = ?`,
      [adminId, requestId]
    );

    res.json({ message: 'Solicitud aprobada y usuario creado exitosamente' });
  } catch (error: any) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ADMIN: Rechazar solicitud
router.post('/admin/requests/:id/reject', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener la solicitud
    const request = await getRow<UserRequest>(
      'SELECT * FROM user_requests WHERE id = ?',
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'La solicitud ya fue procesada' });
    }

    // Actualizar el estado de la solicitud
    await runQuery(
      `UPDATE user_requests 
       SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
       WHERE id = ?`,
      [adminId, requestId]
    );

    res.json({ message: 'Solicitud rechazada exitosamente' });
  } catch (error: any) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

