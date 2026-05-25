import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRow, getRows, runQuery } from '../config/database';
import { User, UserRequest, UserRequestCreate, LoginRequest, AuthResponse } from '../types';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  sendNewUserNotificationToAdmin,
  sendApprovalEmail,
  sendRejectionEmail,
  sendLicenseExtendedEmail,
} from '../utils/emailService';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const TRIAL_DAYS = 7;
const LICENSE_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getLicenseStatus(user: User): { blocked: boolean; reason?: string } {
  const now = new Date();
  if (user.license_type === 'trial') {
    if (!user.trial_expires_at || now > new Date(user.trial_expires_at)) {
      return { blocked: true, reason: 'Tu período de prueba de 7 días ha vencido. Contactá al administrador para activar tu licencia.' };
    }
  } else if (user.license_type === 'active') {
    if (!user.license_expires_at || now > new Date(user.license_expires_at)) {
      return { blocked: true, reason: 'Tu licencia ha vencido. Contactá al administrador para renovarla.' };
    }
  }
  return { blocked: false };
}

// Solicitar creación de usuario (crea la cuenta inmediatamente en modo trial)
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

    // Crear o buscar la óptica
    let optics = await getRow<any>('SELECT id FROM optics WHERE name = ? AND is_active = 1', [optics_name]);
    let opticsId: number;

    if (!optics) {
      const result = await runQuery(
        `INSERT INTO optics (name, is_active) VALUES (?, 1)`,
        [optics_name]
      );
      if (!result.lastID) {
        return res.status(500).json({ error: 'Error al crear la óptica' });
      }
      opticsId = result.lastID;
    } else {
      opticsId = optics.id;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calcular vencimiento del trial
    const trialExpiresAt = addDays(new Date(), TRIAL_DAYS);

    // Crear usuario en modo trial
    await runQuery(
      `INSERT INTO users (username, email, password, role, optics_id, license_type, trial_expires_at)
       VALUES (?, ?, ?, 'user', ?, 'trial', ?)`,
      [username, email, hashedPassword, opticsId, trialExpiresAt.toISOString()]
    );

    // Crear entrada en user_requests para seguimiento del admin
    await runQuery(
      `INSERT INTO user_requests (username, email, password, optics_name, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [username, email, hashedPassword, optics_name]
    );

    // Notificar al admin (no bloqueante)
    sendNewUserNotificationToAdmin({ username, email, optics_name, trial_expires_at: trialExpiresAt });

    res.status(201).json({
      message: `¡Cuenta creada! Podés ingresar ahora mismo. Tenés ${TRIAL_DAYS} días de prueba gratuita.`,
    });
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
      requested_at: request.requested_at,
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

    const user = await getRow<User>(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username.trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar estado de licencia (solo para usuarios no-admin)
    if (user.role !== 'admin') {
      const licenseCheck = getLicenseStatus(user);
      if (licenseCheck.blocked) {
        return res.status(403).json({ error: licenseCheck.reason, license_expired: true });
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        optics_id: user.optics_id || null,
        license_type: user.license_type,
        trial_expires_at: user.trial_expires_at,
        license_expires_at: user.license_expires_at,
      },
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
      'SELECT id, username, email, role, optics_id, license_type, trial_expires_at, license_expires_at, created_at FROM users WHERE id = ?',
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
      license_type: user.license_type,
      trial_expires_at: user.trial_expires_at,
      license_expires_at: user.license_expires_at,
      created_at: user.created_at,
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

// ADMIN: Aprobar solicitud (activa licencia de 1 mes)
router.post('/admin/requests/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

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

    // Buscar el usuario ya creado (se crea en modo trial al registrarse)
    const user = await getRow<User>(
      'SELECT * FROM users WHERE username = ? AND email = ?',
      [request.username, request.email]
    );

    // Calcular nueva fecha de vencimiento
    const licenseExpiresAt = addDays(new Date(), LICENSE_DAYS);

    if (user) {
      // Usuario existe: activar licencia de 1 mes
      await runQuery(
        `UPDATE users SET license_type = 'active', license_expires_at = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [licenseExpiresAt.toISOString(), user.id]
      );
    } else {
      // Fallback: crear el usuario si por alguna razón no existe
      if (!request.optics_name) {
        return res.status(400).json({ error: 'La solicitud no tiene nombre de óptica especificado' });
      }

      let optics = await getRow<any>('SELECT id FROM optics WHERE name = ? AND is_active = 1', [request.optics_name]);
      let opticsId: number;

      if (!optics) {
        const result = await runQuery(
          `INSERT INTO optics (name, is_active) VALUES (?, 1)`,
          [request.optics_name]
        );
        if (!result.lastID) return res.status(500).json({ error: 'Error al crear la óptica' });
        opticsId = result.lastID;
      } else {
        opticsId = optics.id;
      }

      await runQuery(
        `INSERT INTO users (username, email, password, role, optics_id, license_type, license_expires_at)
         VALUES (?, ?, ?, 'user', ?, 'active', ?)`,
        [request.username, request.email, request.password, opticsId, licenseExpiresAt.toISOString()]
      );
    }

    // Actualizar estado de la solicitud
    await runQuery(
      `UPDATE user_requests SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? WHERE id = ?`,
      [adminId, requestId]
    );

    // Notificar al usuario
    sendApprovalEmail({
      to: request.email,
      username: request.username,
      license_expires_at: licenseExpiresAt,
    });

    res.json({ message: 'Solicitud aprobada. El usuario tiene acceso por 1 mes.' });
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

    // Desactivar usuario si existe
    await runQuery(
      `UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE username = ? AND email = ?`,
      [request.username, request.email]
    );

    await runQuery(
      `UPDATE user_requests SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? WHERE id = ?`,
      [adminId, requestId]
    );

    sendRejectionEmail({ to: request.email, username: request.username });

    res.json({ message: 'Solicitud rechazada' });
  } catch (error: any) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ADMIN: Listar usuarios activos con info de licencia
router.get('/admin/users', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await getRows<User>(
      `SELECT id, username, email, role, optics_id, license_type, trial_expires_at, license_expires_at, created_at
       FROM users WHERE is_active = 1 ORDER BY username ASC`
    );
    res.json(users);
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ADMIN: Extender licencia de un usuario (+30 días)
router.post('/admin/users/:id/extend', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await getRow<User>(
      'SELECT id, username, email, license_type, license_expires_at FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.role === 'admin') return res.status(400).json({ error: 'No se puede modificar la licencia del admin' });

    // Extender desde hoy o desde la fecha actual de vencimiento (la que sea mayor)
    const base = user.license_expires_at && new Date(user.license_expires_at) > new Date()
      ? new Date(user.license_expires_at)
      : new Date();

    const newExpiry = addDays(base, LICENSE_DAYS);

    await runQuery(
      `UPDATE users SET license_type = 'active', license_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newExpiry.toISOString(), userId]
    );

    sendLicenseExtendedEmail({ to: user.email, username: user.username, license_expires_at: newExpiry });

    res.json({
      message: `Licencia extendida hasta el ${newExpiry.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      license_expires_at: newExpiry.toISOString(),
    });
  } catch (error: any) {
    console.error('Error al extender licencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ADMIN: Editar usuario (username y/o contraseña)
router.put('/admin/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, password } = req.body;

    const user = await getRow<User>('SELECT id, username FROM users WHERE id = ? AND is_active = 1', [userId]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const newUsername = username ? username.trim().replace(/\s+/g, '') : null;

    if (newUsername) {
      if (newUsername.length < 3) return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
      const exists = await getRow<User>('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, userId]);
      if (exists) return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (newUsername) {
      await runQuery('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newUsername, userId]);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await runQuery('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, userId]);
    }

    res.json({ message: `Usuario "${newUsername || user.username}" actualizado correctamente` });
  } catch (error: any) {
    console.error('Error al editar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ADMIN: Eliminar usuario (soft delete)
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const adminId = req.user?.id;

    if (userId === adminId) return res.status(400).json({ error: 'No podés eliminar tu propio usuario' });

    const user = await getRow<User>('SELECT id, username FROM users WHERE id = ? AND is_active = 1', [userId]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await runQuery('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
    res.json({ message: `Usuario "${user.username}" eliminado correctamente` });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
