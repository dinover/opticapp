import { Response, NextFunction } from 'express';
import { getRow } from '../config/database';
import { User } from '../types';
import { AuthRequest } from './auth';
import { getLicenseStatus } from '../utils/license';

// A diferencia de authenticateToken (que solo valida la firma del JWT),
// este middleware consulta el estado real del usuario en cada request:
// un token dura 24h, así que sin esto un usuario vencido o dado de baja
// seguiría operando hasta que expire su token.
export async function requireActiveLicense(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const user = await getRow<Pick<User, 'id' | 'is_active' | 'license_type' | 'trial_expires_at' | 'license_expires_at'>>(
    'SELECT id, is_active, license_type, trial_expires_at, license_expires_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user || !user.is_active) {
    return res.status(403).json({ error: 'Tu cuenta fue desactivada. Contactá al administrador.' });
  }

  const licenseCheck = getLicenseStatus(user);
  if (licenseCheck.blocked) {
    return res.status(403).json({ error: licenseCheck.reason, license_expired: true });
  }

  next();
}
