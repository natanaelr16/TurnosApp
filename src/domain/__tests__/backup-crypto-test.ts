import {
  changePassword,
  createProtection,
  decryptBackupJson,
  encryptBackupJson,
  generateRecoveryCode,
  isEncryptedBackup,
  resetWithRecovery,
  verifyPassword,
} from '../backup-crypto';

const NOW = '2026-10-29T10:00';

const protection = () => createProtection('clave-2026', NOW);

describe('backup-crypto', () => {
  it('genera código de recuperación legible XXXX-XXXX-XXXX sin ambiguos', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it('verifica la contraseña correcta y rechaza la incorrecta', () => {
    const p = protection().protection;
    expect(verifyPassword(p, 'clave-2026')).toBe(true);
    expect(verifyPassword(p, 'otra')).toBe(false);
    expect(verifyPassword(p, '')).toBe(false);
  });

  it('cifra el JSON y lo abre con la contraseña', () => {
    const { protection: p } = protection();
    const env = encryptBackupJson(p, '{"app":"TurnosApp","data":"secreto"}');
    expect(isEncryptedBackup(env)).toBe(true);
    const out = decryptBackupJson(JSON.parse(env), 'clave-2026');
    expect(out?.json).toContain('secreto');
  });

  it('rechaza contraseña incorrecta y acepta el código de recuperación', () => {
    const { protection: p, recoveryCode } = protection();
    const env = JSON.parse(encryptBackupJson(p, '{"x":1}'));
    expect(decryptBackupJson(env, 'mala')).toBeNull();
    expect(decryptBackupJson(env, recoveryCode)?.masterKey).toBe(p.masterKey);
    expect(decryptBackupJson(env, recoveryCode.toLowerCase())?.masterKey).toBe(p.masterKey);
  });

  it('cambiar contraseña: el PDF anterior aún abre con su contraseña; el nuevo con la nueva', () => {
    const { protection: p } = protection();
    const before = JSON.parse(encryptBackupJson(p, '{"x":2}'));
    const p2 = changePassword(p, 'nueva-2026', NOW);
    // El sobre viejo lleva el wrap viejo: se abre con la contraseña original.
    expect(decryptBackupJson(before, 'clave-2026')).not.toBeNull();
    expect(decryptBackupJson(before, 'nueva-2026')).toBeNull();
    // Los respaldos nuevos usan la contraseña nueva; la misma clave maestra.
    const after = JSON.parse(encryptBackupJson(p2, '{"x":3}'));
    expect(decryptBackupJson(after, 'nueva-2026')?.masterKey).toBe(p.masterKey);
    expect(verifyPassword(p2, 'nueva-2026')).toBe(true);
  });

  it('restablece con código de recuperación y rechaza códigos incorrectos', () => {
    const { protection: p, recoveryCode } = protection();
    expect(resetWithRecovery(p, 'XXXX-XXXX-XXXX', 'otra', NOW)).toBeNull();
    const p2 = resetWithRecovery(p, recoveryCode, 'otra', NOW);
    expect(p2).not.toBeNull();
    expect(verifyPassword(p2!, 'otra')).toBe(true);
    expect(p2!.masterKey).toBe(p.masterKey);
    // El código de recuperación sigue siendo el mismo.
    const env = JSON.parse(encryptBackupJson(p2!, '{"x":4}'));
    expect(decryptBackupJson(env, recoveryCode)).not.toBeNull();
  });

  it('alterar el contenido cifrado invalida el sobre (HMAC)', () => {
    const { protection: p } = protection();
    const env = JSON.parse(encryptBackupJson(p, '{"x":5}'));
    env.data.ct = 'ff' + env.data.ct.slice(2);
    expect(decryptBackupJson(env, 'clave-2026')).toBeNull();
  });
});
