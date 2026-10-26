import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import type { AppData, PeriodRange } from '@/domain/types';
import { buildPeriodReport } from '@/lib/period-report';

export function usePeriodPdf() {
  const [exporting, setExporting] = useState(false);
  const lock = useRef(false);
  const release = () => { lock.current = false; setExporting(false); };
  const requestExport = (data: AppData, period: PeriodRange) => {
    if (lock.current) return;
    if (Platform.OS === 'web') { Alert.alert('Exportación móvil', 'Genera el PDF desde la app de iPhone o Android.'); return; }
    lock.current = true; setExporting(true);
    Alert.alert('Exportar PDF del periodo', 'Contiene información laboral privada, incluidas notas y campos opcionales del periodo seleccionado. Compártelo solo con personas de confianza. Es un informe de acumulados; todavía no incluye neto ni respaldo restaurable.', [
      { text: 'Cancelar', style: 'cancel', onPress: release },
      { text: 'Generar PDF', onPress: async () => {
        try {
          if (!await Sharing.isAvailableAsync()) { Alert.alert('No se puede compartir', 'Este dispositivo no tiene disponible la hoja de compartir.'); return; }
          const { uri } = await Print.printToFileAsync({ html: buildPeriodReport(data, period) });
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Informe de turnos' });
        } catch { Alert.alert('No se pudo exportar', 'Tus registros no se han modificado. Intenta de nuevo.'); }
        finally { release(); }
      } },
    ], { cancelable: false });
  };
  return { exporting, requestExport };
}
