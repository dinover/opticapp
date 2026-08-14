import { User } from '../types';

export const TRIAL_DAYS = 7;
export const LICENSE_DAYS = 30;

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getLicenseStatus(user: Pick<User, 'license_type' | 'trial_expires_at' | 'license_expires_at'>): {
  blocked: boolean;
  reason?: string;
} {
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
