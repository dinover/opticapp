import { describe, it, expect } from 'vitest';
import { getLicenseStatus, addDays } from '../license';

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function pastDate(days: number): string {
  return futureDate(-days);
}

describe('getLicenseStatus', () => {
  it('no bloquea a un usuario en trial no vencido', () => {
    const result = getLicenseStatus({
      license_type: 'trial',
      trial_expires_at: futureDate(3),
      license_expires_at: null,
    });
    expect(result.blocked).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('bloquea a un usuario en trial vencido con el mensaje correcto', () => {
    const result = getLicenseStatus({
      license_type: 'trial',
      trial_expires_at: pastDate(1),
      license_expires_at: null,
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe(
      'Tu período de prueba de 7 días ha vencido. Contactá al administrador para activar tu licencia.'
    );
  });

  it('bloquea a un usuario en trial sin trial_expires_at', () => {
    const result = getLicenseStatus({
      license_type: 'trial',
      trial_expires_at: null,
      license_expires_at: null,
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe(
      'Tu período de prueba de 7 días ha vencido. Contactá al administrador para activar tu licencia.'
    );
  });

  it('no bloquea a un usuario con licencia activa no vencida', () => {
    const result = getLicenseStatus({
      license_type: 'active',
      trial_expires_at: null,
      license_expires_at: futureDate(10),
    });
    expect(result.blocked).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('bloquea a un usuario con licencia activa vencida con el mensaje correcto', () => {
    const result = getLicenseStatus({
      license_type: 'active',
      trial_expires_at: null,
      license_expires_at: pastDate(1),
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('Tu licencia ha vencido. Contactá al administrador para renovarla.');
  });

  it('bloquea a un usuario con licencia activa sin license_expires_at', () => {
    const result = getLicenseStatus({
      license_type: 'active',
      trial_expires_at: null,
      license_expires_at: null,
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('Tu licencia ha vencido. Contactá al administrador para renovarla.');
  });
});

describe('addDays', () => {
  it('suma días dentro del mismo mes', () => {
    const result = addDays(new Date(2026, 0, 1), 5); // 1 de enero
    expect(result.getDate()).toBe(6);
    expect(result.getMonth()).toBe(0);
  });

  it('suma días cruzando fin de mes', () => {
    const result = addDays(new Date(2026, 0, 30), 5); // 30 de enero
    expect(result.getMonth()).toBe(1); // febrero
    expect(result.getDate()).toBe(4);
  });

  it('no muta la fecha original', () => {
    const original = new Date(2026, 0, 1);
    const originalTime = original.getTime();
    addDays(original, 10);
    expect(original.getTime()).toBe(originalTime);
  });
});
