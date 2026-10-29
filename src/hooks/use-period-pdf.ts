import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { recordCoverage } from '@/domain/records';
import type { AppData, PeriodRange } from '@/domain/types';
import { buildPayrollReport, buildShiftsReport } from '@/lib/period-report';
import { formatMonth, formatPeriod } from '@/lib/format';

export type ReportKind = 'turnos' | 'liquidacion';

const BUILDERS = { turnos: buildShiftsReport, liquidacion: buildPayrollReport };
const KIND_NAME = { turnos: 'Turnos', liquidacion: 'Salario' };

/** Nombre legible: TurnosApp-Turnos-Octubre-2026-Quincena-1-Parcial.pdf */
function fileName(data: AppData, period: PeriodRange, kind: ReportKind): string {
  const [y, m, d] = period.start.split('-').map(Number);
  const month = formatMonth(y, m).split(' ')[0];
  const span = data.settings.payPeriod === 'quincenal' ? `Quincena-${d <= 15 ? '1' : '2'}` : 'Mes';
  const partial = recordCoverage(data.shifts, data.novelties, period).missingDates.length ? 'Parcial' : 'Completo';
  return `TurnosApp-${KIND_NAME[kind]}-${month}-${y}-${span}-${partial}.pdf`;
}

export function usePeriodPdf() {
  const [exporting, setExporting] = useState(false);
  const lock = useRef(false);
  const release = () => { lock.current = false; setExporting(false); };
  const requestExport = (data: AppData, period: PeriodRange, kind: ReportKind = 'turnos') => {
    if (lock.current) return;
    if (Platform.OS === 'web') { Alert.alert('Exportación móvil', 'Genera el PDF desde la app de iPhone o Android.'); return; }
    lock.current = true; setExporting(true);
    const title = kind === 'turnos' ? 'Exportar PDF de turnos' : 'Exportar PDF de liquidación';
    Alert.alert(title, `Contiene información laboral privada del periodo ${formatPeriod(period.start, period.end)}. Compártelo solo con personas de confianza.`, [
      { text: 'Cancelar', style: 'cancel', onPress: release },
      { text: 'Generar PDF', onPress: async () => {
        try {
          if (!await Sharing.isAvailableAsync()) { Alert.alert('No se puede compartir', 'Este dispositivo no tiene disponible la hoja de compartir.'); return; }
          const { uri } = await Print.printToFileAsync({ html: BUILDERS[kind](data, period) });
          const named = `${FileSystem.cacheDirectory}${fileName(data, period, kind)}`;
          await FileSystem.moveAsync({ from: uri, to: named });
          await Sharing.shareAsync(named, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
        } catch { Alert.alert('No se pudo exportar', 'Tus registros no se han modificado. Intenta de nuevo.'); }
        finally { release(); }
      } },
    ], { cancelable: false });
  };
  return { exporting, requestExport };
}
