import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { createBackup, parseBackup } from '@/domain/backup';
import { useAppData } from '@/hooks/use-app-data';
import { attachBackupToPdf, readBackupFromPdf } from '@/lib/backup-file';
import { buildBackupReport } from '@/lib/period-report';
import { formatCOP } from '@/lib/format';

/** Exporta el respaldo restaurable (PDF con JSON incrustado) y restaura desde un PDF (D-033). */
export function useBackup() {
  const { data, restore } = useAppData();
  const [busy, setBusy] = useState(false);

  const exportBackup = () => {
    if (Platform.OS === 'web') { Alert.alert('Exportación móvil', 'Genera el respaldo desde la app de iPhone o Android.'); return; }
    if (busy) return;
    Alert.alert('Exportar respaldo', 'El PDF contiene todos tus datos incrustados (turnos, novedades, plantillas y ajustes). Guárdalo en un lugar seguro y compártelo solo contigo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Exportar PDF', onPress: async () => {
        setBusy(true);
        try {
          if (!await Sharing.isAvailableAsync()) { Alert.alert('No se puede compartir', 'Este dispositivo no tiene disponible la hoja de compartir.'); return; }
          const exportedAt = new Date().toISOString();
          const { uri } = await Print.printToFileAsync({ html: buildBackupReport(data, exportedAt) });
          const out = await attachBackupToPdf(uri, createBackup(data, exportedAt));
          await Sharing.shareAsync(out, { mimeType: 'application/pdf', dialogTitle: 'Respaldo de TurnosApp' });
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
      const json = await readBackupFromPdf(picked.assets[0].uri);
      if (!json) { Alert.alert('Sin respaldo', 'Este PDF no contiene un respaldo de TurnosApp. Usa el PDF que genera "Exportar respaldo".'); return; }
      const res = parseBackup(json);
      if (!res.ok) { Alert.alert('Respaldo no válido', 'El PDF se abrió pero los datos están dañados, son de otra app o de una versión más nueva.'); return; }
      const { backup, summary } = res;
      Alert.alert('¿Restaurar este respaldo?',
        `${summary.shiftCount} turnos · ${summary.firstDate ?? '—'} a ${summary.lastDate ?? '—'} · salario ${formatCOP(summary.baseSalary)}.\n\nReemplazará TODOS los datos actuales del teléfono.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: async () => {
          try { await restore(backup.data); Alert.alert('Listo', 'Tus datos fueron restaurados.'); }
          catch { Alert.alert('No se pudo restaurar', 'Intenta de nuevo.'); }
        } },
      ]);
    } catch { Alert.alert('No se pudo leer el archivo', 'Intenta de nuevo.'); }
    finally { setBusy(false); }
  };

  return { backupBusy: busy, exportBackup, importBackup };
}
