import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Keyboard, Platform } from 'react-native';

import { SettingsFields } from '@/components/settings-fields';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, ValueRow } from '@/components/ui';
import { createBackup, parseBackup } from '@/domain/backup';
import { periodFor } from '@/domain/payroll';
import { effectiveRates, factorTable } from '@/domain/shift-calc';
import type { AppSettings, MinuteCategory } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { attachBackupToPdf, readBackupFromPdf } from '@/lib/backup-file';
import { formatCOP, formatFactor, todayLocal } from '@/lib/format';
import { buildPeriodReport } from '@/lib/period-report';
import { draftFromSettings, settingsFromDraft, validateSettingsDraft, type DraftErrors } from '@/lib/settings-form';

const FACTOR_LABELS: [MinuteCategory, string][] = [
  ['extraDay', 'Hora extra diurna'],
  ['ordinaryNight', 'Recargo nocturno'],
  ['extraNight', 'Hora extra nocturna'],
  ['ordinaryDayHoliday', 'Dominical/festivo'],
  ['extraDayHoliday', 'Hora extra diurna festiva'],
  ['ordinaryNightHoliday', 'Recargo nocturno festivo'],
  ['extraNightHoliday', 'Hora extra nocturna festiva'],
];

export default function SettingsScreen() {
  const { data, resetAll, restore, updateSettings } = useAppData();
  const { settings } = data;
  const today = todayLocal();
  const [draft, setDraft] = useState(() => draftFromSettings(settings, today));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const lock = useRef(false);
  const preview = settingsFromDraft(draft, settings);
  const valid = !Object.keys(validateSettingsDraft(draft)).length;
  const factors = factorTable(today, preview);
  const hourValue = preview.baseSalary / effectiveRates(today, preview).divisor;
  const changed = JSON.stringify(draft) !== JSON.stringify(draftFromSettings(settings, today));

  const save = async () => {
    if (lock.current) return;
    Keyboard.dismiss();
    const found = validateSettingsDraft(draft);
    setErrors(found);
    if (Object.keys(found).length) { Alert.alert('Revisa los campos', 'Hay valores inválidos. Corrige los campos señalados antes de guardar.'); return; }
    lock.current = true; setSaving(true);
    try {
      await updateSettings(preview);
      setDraft(draftFromSettings(preview, today));
      Alert.alert('Ajustes guardados', 'Los cálculos de todos tus turnos usan esta configuración.');
    } catch { Alert.alert('No se pudo guardar', 'Tus cambios siguen en pantalla. Intenta de nuevo.'); }
    finally { lock.current = false; setSaving(false); }
  };
  const confirmReset = () =>
    Alert.alert('Borrar todos mis datos', 'Se eliminarán tu configuración y todos tus turnos de este teléfono. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
        if (lock.current) return;
        lock.current = true; setSaving(true);
        try { await resetAll(); }
        catch { Alert.alert('No se pudo borrar', 'Intenta de nuevo.'); }
        finally { lock.current = false; setSaving(false); }
      } },
    ]);

  return (
    <Screen title="Ajustes" subtitle="Tus condiciones salariales y laborales">
      <ThemedText>Los cambios recalculan todo el historial con el salario actual. No modifican tu nómina oficial.</ThemedText>
      {(['salary', 'allowance', 'period', 'schedule', 'rates'] as const).map((section) => (
        <SettingsFields key={section} section={section} draft={draft} onChange={setDraft} errors={errors} date={today} disabled={saving} />
      ))}
      <Card title="Vista previa de factores de liquidación">
        {valid ? <>
          <ValueRow label="Valor hora ordinaria" value={formatCOP(hourValue)} />
          {FACTOR_LABELS.map(([key, label]) => <ValueRow key={key} label={label} value={formatFactor(factors[key])} />)}
        </> : <ThemedText>Completa los campos con valores válidos para ver los factores.</ThemedText>}
        <ThemedText type="caption" themeColor="textSecondary">Compáralos con tu planilla de nómina. La vista previa no se aplica hasta guardar.</ThemedText>
      </Card>
      <Button label={saving ? 'Guardando…' : 'Guardar ajustes'} onPress={save} disabled={saving || !changed} />
      {changed ? <Button label="Descartar cambios" variant="secondary" disabled={saving} onPress={() => {
        setDraft(draftFromSettings(settings, today)); setErrors({}); Keyboard.dismiss();
      }} /> : null}
      <Card title="Turnos frecuentes">
        <Button label="Gestionar plantillas" variant="secondary" onPress={() => router.push('/plantillas')} disabled={saving} />
      </Card>
      <Card title="Datos">
        <ThemedText type="caption" themeColor="textSecondary">El respaldo es un PDF que lleva todos tus datos incrustados (turnos, novedades, plantillas y ajustes). Sirve para mover tu historial a otro celular sin nube.</ThemedText>
        <Button label={backupBusy ? 'Procesando…' : 'Exportar respaldo (PDF)'} variant="secondary" disabled={saving || backupBusy} onPress={() => {
          if (Platform.OS === 'web') { Alert.alert('Exportación móvil', 'Genera el respaldo desde la app de iPhone o Android.'); return; }
          Alert.alert('Exportar respaldo', 'El PDF contiene todos tus datos incrustados. Guárdalo en un lugar seguro y compártelo solo contigo.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Exportar PDF', onPress: async () => {
              setBackupBusy(true);
              try {
                if (!await Sharing.isAvailableAsync()) { Alert.alert('No se puede compartir', 'Este dispositivo no tiene disponible la hoja de compartir.'); return; }
                const period = periodFor(today, settings.payPeriod);
                const { uri } = await Print.printToFileAsync({ html: buildPeriodReport(data, period) });
                const out = await attachBackupToPdf(uri, createBackup(data, new Date().toISOString()));
                await Sharing.shareAsync(out, { mimeType: 'application/pdf', dialogTitle: 'Respaldo de TurnosApp' });
              } catch { Alert.alert('No se pudo exportar', 'Tus datos no se modificaron. Intenta de nuevo.'); }
              finally { setBackupBusy(false); }
            } },
          ]);
        }} />
        <Button label="Restaurar desde PDF" variant="secondary" disabled={saving || backupBusy} onPress={async () => {
          setBackupBusy(true);
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
          finally { setBackupBusy(false); }
        }} />
        <Button label="Borrar todos mis datos" variant="danger" onPress={confirmReset} disabled={saving || backupBusy} />
      </Card>
    </Screen>
  );
}
