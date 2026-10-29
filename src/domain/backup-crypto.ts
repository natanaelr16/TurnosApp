// Cifrado opcional del respaldo (D-038). Clave maestra aleatoria guardada localmente;
// el PDF lleva el JSON cifrado + la clave envuelta por la contraseña y por el código
// de recuperación. Así el PDF es autocontenido: basta la contraseña O el código para
// abrirlo en cualquier teléfono, y cambiar la contraseña solo reenvuelve la clave local.
import { AES, CipherParams, Hex, HmacSHA256, PBKDF2, SHA256, Utf8, WordArray } from 'crypto-es';

const KDF_ITER = 50_000;
const KEY_WORDS = 8; // 256 bits

export interface WrapBlob {
  iter: number;
  salt: string;
  iv: string;
  ct: string;
  tag: string;
}

/** Lo que se guarda en el teléfono (NUNCA viaja dentro del respaldo). */
export interface BackupProtection {
  masterKey: string;
  /** Clave envuelta con la contraseña actual: verifica la contraseña y la usa al exportar. */
  pwdWrap: WrapBlob;
  /** Clave envuelta con el código de recuperación mostrado una sola vez. */
  recWrap: WrapBlob;
  updatedAt: string;
}

const hex = (w: WordArray) => w.toString();
const hmacKey = (master: WordArray) => SHA256(master.clone().concat(WordArray.create([0x6d61632d])));

function deriveKey(secret: string, salt: WordArray, iter: number): WordArray {
  return PBKDF2(secret.normalize('NFKC'), salt, { keySize: KEY_WORDS, iterations: iter });
}

function aesEncrypt(key: WordArray, iv: WordArray, msg: WordArray): string {
  const ct = AES.encrypt(msg, key, { iv }).ciphertext;
  if (!ct) throw new Error('AES falló');
  return Hex.stringify(ct);
}
function aesDecrypt(key: WordArray, iv: WordArray, ctHex: string): WordArray | null {
  try {
    const out = AES.decrypt(CipherParams.create({ ciphertext: Hex.parse(ctHex) }), key, { iv });
    return out.sigBytes >= 0 ? out : null;
  } catch {
    return null;
  }
}
const tag = (key: WordArray, iv: WordArray, ctHex: string) =>
  Hex.stringify(HmacSHA256(Hex.parse(ctHex).concat(iv), key));

function wrapSecret(master: WordArray, secret: string): WrapBlob {
  const salt = WordArray.random(16);
  const iv = WordArray.random(16);
  const key = deriveKey(secret, salt, KDF_ITER);
  const ct = aesEncrypt(key, iv, master);
  return { iter: KDF_ITER, salt: hex(salt), iv: hex(iv), ct, tag: tag(key, iv, ct) };
}

/** Devuelve la clave maestra si `secret` abre el wrap; `null` si no. */
function unwrapSecret(w: WrapBlob, secret: string): WordArray | null {
  const key = deriveKey(secret, Hex.parse(w.salt), w.iter);
  if (tag(key, Hex.parse(w.iv), w.ct) !== w.tag) return null;
  const out = aesDecrypt(key, Hex.parse(w.iv), w.ct);
  return out && out.sigBytes === KEY_WORDS * 4 ? out : null;
}

/** Código de recuperación legible sin caracteres ambiguos: XXXX-XXXX-XXXX. */
export function generateRecoveryCode(): string {
  const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = WordArray.random(12).toString();
  let s = '';
  for (let i = 0; i < 12; i++) s += ABC[parseInt(bytes.slice(i * 2, i * 2 + 2), 16) % ABC.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/** Activa la protección: genera clave maestra + wraps. Devuelve el código para mostrarlo una vez. */
export function createProtection(password: string, updatedAt: string): { protection: BackupProtection; recoveryCode: string } {
  const masterKey = WordArray.random(KEY_WORDS * 4);
  const recoveryCode = generateRecoveryCode();
  return {
    recoveryCode,
    protection: {
      masterKey: hex(masterKey),
      pwdWrap: wrapSecret(masterKey, password),
      recWrap: wrapSecret(masterKey, recoveryCode),
      updatedAt,
    },
  };
}

/** true si la contraseña coincide con la guardada (descifrando la clave maestra). */
export function verifyPassword(p: BackupProtection, password: string): boolean {
  return unwrapSecret(p.pwdWrap, password)?.toString() === p.masterKey;
}

/** Reenvuelve la clave maestra con una contraseña nueva (mismo código de recuperación). */
export function changePassword(p: BackupProtection, newPassword: string, updatedAt: string): BackupProtection {
  return { ...p, pwdWrap: wrapSecret(Hex.parse(p.masterKey), newPassword), updatedAt };
}

/** Restablece la contraseña usando el código de recuperación. `null` si el código es incorrecto. */
export function resetWithRecovery(p: BackupProtection, code: string, newPassword: string, updatedAt: string): BackupProtection | null {
  if (unwrapSecret(p.recWrap, code.trim().toUpperCase())?.toString() !== p.masterKey) return null;
  return { ...p, pwdWrap: wrapSecret(Hex.parse(p.masterKey), newPassword), updatedAt };
}

// ---- Sobre cifrado que va dentro del PDF ----

export interface EncryptedEnvelope {
  app: 'TurnosApp';
  enc: 1;
  pwd: WrapBlob;
  rec: WrapBlob;
  data: { iv: string; ct: string; tag: string };
}

export function isEncryptedBackup(text: string): boolean {
  try {
    const v = JSON.parse(text);
    return typeof v === 'object' && v !== null && v.app === 'TurnosApp' && v.enc === 1;
  } catch {
    return false;
  }
}

/** Cifra `json` con la clave maestra y adjunta los wraps actuales (contraseña + recuperación). */
export function encryptBackupJson(p: BackupProtection, json: string): string {
  const master = Hex.parse(p.masterKey);
  const iv = WordArray.random(16);
  const ct = aesEncrypt(master, iv, Utf8.parse(json));
  const env: EncryptedEnvelope = {
    app: 'TurnosApp',
    enc: 1,
    pwd: p.pwdWrap,
    rec: p.recWrap,
    data: { iv: hex(iv), ct, tag: tag(hmacKey(master), iv, ct) },
  };
  return JSON.stringify(env);
}

/** Abre el sobre con contraseña o código de recuperación. Devuelve el JSON y la
 *  clave maestra para adoptarla al restaurar en otro teléfono; `null` si no abre. */
export function decryptBackupJson(env: EncryptedEnvelope, secret: string): { json: string; masterKey: string } | null {
  if (!env || env.enc !== 1 || !env.data || !env.pwd || !env.rec) return null;
  const master = unwrapSecret(env.pwd, secret) ?? unwrapSecret(env.rec, secret.trim().toUpperCase());
  if (!master) return null;
  const d = env.data;
  if (tag(hmacKey(master), Hex.parse(d.iv), d.ct) !== d.tag) return null;
  const plain = aesDecrypt(master, Hex.parse(d.iv), d.ct);
  return plain ? { json: Utf8.stringify(plain), masterKey: master.toString() } : null;
}
