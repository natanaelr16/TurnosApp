import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { createBackup, parseBackup } from '@/domain/backup';
import { decryptBackupJson, encryptBackupJson, isEncryptedBackup, type EncryptedEnvelope } from '@/domain/backup-crypto';
import type { AppData } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { attachBackupToPdf, readBackupFromPdf } from '@/lib/backup-file';
import { buildBackupReport } from '@/lib/period-report';
import { formatCOP } from '@/lib/format';

export type AskSecret = (title: string, message: string) => Promise<string | null>;

/** Datos listos para el respaldo: la clave maestra local nunca viaja dentro del PDF (D-038). */
function exportableData(data: AppData): AppData {
  if (!data.settings.backupProtection) return data;
  const { backupProtection: _omit, ...rest } = data.settings;
  return { ...data, settings: rest };
}

/** Exporta el respaldo restaurable (PDF con JSON incrustado, opcionalmente cifrado) y restaura desde un PDF (D-033/D-038). */
export function useBackup(opts?: { askSecret?: AskSecret }) {
  const { data, restore } = useAppData();
  const [busy, setBusy] = useState(false);
  const protectedExport = !!data.settings.backupProtection;

  const exportBackup = () => {
    if (Platform.OS === 'web') { Alert.alert('Exportación móvil', 'Genera el respaldo desde la app de iPhone o Android.'); return; }
    if (busy) return;
    Alert.alert('Exportar respaldo',
      protectedExport
        ? 'El PDF lleva tus datos CIFRADOS: solo se abre con tu contraseña o código de recuperación. Guárdalo en un lugar seguro.'
        : 'El PDF contiene todos tus datos incrustados (turnos, novedades, plantillas y ajustes). Guárdalo en un lugar seguro y compártelo solo contigo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Exportar PDF', onPress: async () => {
        setBusy(true);
        try {
          if (!await Sharing.isAvailableAsync()) { Alert.alert('No se puede compartir', 'Este dispositivo no tiene disponible la hoja de compartir.'); return; }
          const exportedAt = new Date().toISOString();
          const { uri } = await Print.printToFileAsync({ html: buildBackupReport(data, exportedAt) });
          const json = createBackup(exportableData(data), exportedAt);
          const payload = data.settings.backupProtection ? encryptBackupJson(data.settings.backupProtection, json) : json;
          const out = await attachBackupToPdf(uri, payload);
          const named = `${FileSystem.cacheDirectory}TurnosApp-Respaldo-${exportedAt.slice(0, 10)}.pdf`;
          await FileSystem.moveAsync({ from: out, to: named });
          await Sharing.shareAsync(named, { mimeType: 'application/pdf', dialogTitle: 'Respaldo de TurnosApp' });
        } catch { Alert.alert('No se pudo exportar', 'Tus datos no se modificaron. Intenta de nuevo.'); }
        finally { setBusy(false); }
      } },
    ]);
  };

  const importBackup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const raw = await readBackupFromPdf(picked.assets[0].uri);
      if (!raw) { Alert.alert('Sin respaldo', 'Este PDF no contiene un respaldo de TurnosApp. Usa el PDF que genera "Exportar respaldo".'); return; }
      let json = raw;
      let adoptProtection: AppData['settings']['backupProtection'];
      if (isEncryptedBackup(raw)) {
        if (!opts?.askSecret) { Alert.alert('Respaldo protegido', 'Este PDF está cifrado. Ábrelo desde la app donde puedas escribir la contraseña.'); return; }
        const secret = await opts.askSecret('Respaldo protegido', 'Escribe la contraseña o el código de recuperación con el que se creó este PDF.');
        if (secret == null) return;
        const env = JSON.parse(raw) as EncryptedEnvelope;
        const dec = decryptBackupJson(env, secret);
        if (!dec) { Alert.alert('No se pudo abrir', 'La contraseña o el código no corresponden a este respaldo, o el archivo está dañado.'); return; }
        json = dec.json;
        // Si este teléfono no tiene protección propia, adopta la del respaldo para seguir protegido.
        if (!data.settings.backupProtection) {
          adoptProtection = { masterKey: dec.masterKey, pwdWrap: env.pwd, recWrap: env.rec, updatedAt: new Date().toISOString() };
        }
      }
      const res = parseBackup(json);
      if (!res.ok) { Alert.alert('Respaldo no válido', 'El PDF se abrió pero los datos están dañados, son de otra app o de una versión más nueva.'); return; }
      const { backup, summary } = res;
      Alert.alert('¿Restaurar este respaldo?',
        `${summary.shiftCount} turnos · ${summary.firstDate ?? '—'} a ${summary.lastDate ?? '—'} · salario ${formatCOP(summary.baseSalary)}.\n\nReemplazará TODOS los datos actuales del teléfono.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: async () => {
          try {
            await restore({ ...backup.data, settings: { ...backup.data.settings, backupProtection: adoptProtection ?? data.settings.backupProtection } });
            Alert.alert('Listo', 'Tus datos fueron restaurados.');
          }
          catch { Alert.alert('No se pudo restaurar', 'Intenta de nuevo.'); }
        } },
      ]);
    } catch { Alert.alert('No se pudo leer el archivo', 'Intenta de nuevo.'); }
    finally { setBusy(false); }
  };

  return { backupBusy: busy, exportBackup, importBackup };
}
