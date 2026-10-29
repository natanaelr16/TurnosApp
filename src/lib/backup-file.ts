// Incrusta el JSON de respaldo dentro del PDF exportado, después de %%EOF (D-014/D-033).
// Los lectores de PDF ignoran los bytes posteriores al marcador de fin; la app los lee
// al restaurar. Sin dependencias nativas adicionales.
import * as FileSystem from 'expo-file-system/legacy';

import { BACKUP_KEY } from '@/domain/backup';

const OPEN = `\n%%${BACKUP_KEY}\n`;
const CLOSE = '\n%%EndBackup\n';
const toB64 = (text: string) => btoa(unescape(encodeURIComponent(text)));
const fromB64 = (b64: string) => decodeURIComponent(escape(atob(b64)));

/** Devuelve la URI de un PDF igual al original pero con el JSON de respaldo anexado. */
export async function attachBackupToPdf(pdfUri: string, backupJson: string): Promise<string> {
  const pdfB64 = await FileSystem.readAsStringAsync(pdfUri, { encoding: FileSystem.EncodingType.Base64 });
  const combined = `${atob(pdfB64)}${OPEN}${toB64(backupJson)}${CLOSE}`;
  const uri = `${FileSystem.cacheDirectory}turnosapp-respaldo.pdf`;
  await FileSystem.writeAsStringAsync(uri, btoa(combined), { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}

/** Extrae el JSON de respaldo de un PDF exportado por la app. `null` si no lo trae. */
export async function readBackupFromPdf(pdfUri: string): Promise<string | null> {
  const bytes = atob(await FileSystem.readAsStringAsync(pdfUri, { encoding: FileSystem.EncodingType.Base64 }));
  const start = bytes.indexOf(OPEN);
  if (start < 0) return null;
  const end = bytes.indexOf(CLOSE, start);
  if (end < 0) return null;
  try {
    return fromB64(bytes.slice(start + OPEN.length, end).trim());
  } catch {
    return null;
  }
}
