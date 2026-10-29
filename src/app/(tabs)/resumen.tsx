import { useMemo, useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';

import { PeriodSelector } from '@/components/period-selector';
import { NumberField } from '@/components/settings-fields';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, Screen, ValueRow } from '@/components/ui';
import { isPeriodClosed, liquidationTable, payEstimate, periodFor } from '@/domain/payroll';
import { recordCoverage } from '@/domain/records';
import { computeShifts } from '@/domain/shift-calc';
import { useAppData } from '@/hooks/use-app-data';
import { usePeriodPdf } from '@/hooks/use-period-pdf';
import { useTheme } from '@/hooks/use-theme';
import { formatCOP, formatFactor, formatMinutes, todayLocal } from '@/lib/format';

export default function SummaryScreen() {
  const { data } = useAppData();
  const { exporting, requestExport } = usePeriodPdf();
  const theme = useTheme();
  const [anchor, setAnchor] = useState(todayLocal);
  const period = useMemo(() => periodFor(anchor, data.settings.payPeriod), [anchor, data.settings.payPeriod]);
  const results = useMemo(() => computeShifts(data.shifts, data.settings), [data.shifts, data.settings]);
  const table = useMemo(() => liquidationTable(results, data.settings, period), [results, data.settings, period]);
  const incomplete = recordCoverage(data.shifts, data.novelties, period).missingDates.length > 0;
  const extraIncome = data.settings.extraIncome?.[period.start] ?? 0;
  const monthExtraIncome = useMemo(() => {
    const ym = period.start.slice(0, 7);
    return (data.settings.extraIncome?.[`${ym}-01`] ?? 0) + (data.settings.extraIncome?.[`${ym}-16`] ?? 0);
  }, [data.settings.extraIncome, period.start]);
  const estimate = useMemo(() => payEstimate(results, data.novelties, data.settings, period, extraIncome, monthExtraIncome), [results, data.novelties, data.settings, period, extraIncome, monthExtraIncome]);
  const basic = estimate.basic;
  const { updateSettings } = useAppData();
  const [extraDraft, setExtraDraft] = useState<string | null>(null);
  const saveExtra = async () => {
    Keyboard.dismiss();
    const value = Number((extraDraft ?? '').replace(/\D/g, '')) || 0;
    const next = { ...(data.settings.extraIncome ?? {}) };
    if (value > 0) next[period.start] = value; else delete next[period.start];
    try { await updateSettings({ ...data.settings, extraIncome: next }); setExtraDraft(null); }
    catch { Alert.alert('No se pudo guardar', 'Intenta de nuevo.'); }
  };
  const closed = isPeriodClosed(data.settings, period.start);
  const toggleClosed = async () => {
    const list = data.settings.closedPeriods ?? [];
    const next = closed ? list.filter((key) => key !== period.start) : [...list, period.start];
    try { await updateSettings({ ...data.settings, closedPeriods: next }); }
    catch { Alert.alert('No se pudo actualizar', 'Intenta de nuevo.'); }
  };
  const activeRows = table.rows.filter((row) => row.hours > 0);
  return <Screen title="Resumen" subtitle="Acumulados del periodo">
    <PeriodSelector period={period} type={data.settings.payPeriod} onDateChange={setAnchor} />
    {closed ? <ThemedText accessibilityRole="alert" themeColor="danger">Periodo cerrado: no puedes crear, editar ni eliminar registros de estas fechas hasta reabrirlo.</ThemedText> : null}
    {!activeRows.length && !table.workedMinutes && !basic.amount ? <EmptyState title="Sin registros en este periodo" message="Registra turnos, descansos o novedades para ver tu liquidación acumulada." /> : <Card title="Detalle de liquidación">
      <View style={styles.tableHeader}>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.concepto}>Concepto</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.hours}>Horas</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.amount}>Valor</ThemedText>
      </View>
      {basic.fullDays || basic.sickDays || basic.unpaidDays ? <>
        <View style={styles.row} accessible accessibilityLabel={`Salario básico: ${basic.paidDays} días pagos a ${formatCOP(basic.daily)}, ${formatCOP(basic.fullAmount)}`}>
          <ThemedText type="smallBold" style={styles.concepto} numberOfLines={2}>Salario básico · {basic.paidDays} {basic.paidDays === 1 ? 'día' : 'días'} × {formatCOP(basic.daily)}</ThemedText>
          <ThemedText type="small" style={styles.hours} />
          <ThemedText type="money" style={styles.amount}>{formatCOP(basic.fullAmount)}</ThemedText>
        </View>
        {basic.sickDays ? <View style={styles.row} accessible accessibilityLabel={`Incapacidad: ${basic.sickDays} días al 75 %, ${formatCOP(basic.sickAmount)}`}>
          <ThemedText type="small" style={styles.concepto} numberOfLines={2}>Incapacidad · {basic.sickDays} {basic.sickDays === 1 ? 'día' : 'días'} al 75 % del promedio</ThemedText>
          <ThemedText type="small" style={styles.hours} />
          <ThemedText type="money" style={styles.amount}>{formatCOP(basic.sickAmount)}</ThemedText>
        </View> : null}
        {basic.unpaidDays ? <View style={styles.row} accessible accessibilityLabel={`Permiso no remunerado: ${basic.unpaidDays} días sin pago`}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.concepto} numberOfLines={2}>Permiso no remunerado · {basic.unpaidDays} {basic.unpaidDays === 1 ? 'día' : 'días'} sin pago</ThemedText>
          <ThemedText type="small" style={styles.hours} />
          <ThemedText type="money" themeColor="textSecondary" style={styles.amount}>—</ThemedText>
        </View> : null}
      </> : null}
      {activeRows.map((row) => <View key={row.category} style={styles.row} accessible accessibilityLabel={`${row.label}: ${row.hours.toFixed(2).replace('.', ',')} horas, ${formatCOP(row.amount)}`}>
        <ThemedText type="small" style={styles.concepto} numberOfLines={2}>{formatFactor(row.factor)} · {row.label}</ThemedText>
        <ThemedText type="small" style={styles.hours}>{row.hours.toFixed(2).replace('.', ',')}</ThemedText>
        <ThemedText type="money" style={styles.amount}>{formatCOP(row.amount)}</ThemedText>
      </View>)}
      <View style={[styles.row, styles.total, { borderTopColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.concepto}>Total del periodo</ThemedText>
        <ThemedText type="smallBold" style={styles.hours}>{table.rows.reduce((s, r) => s + r.hours, 0).toFixed(2).replace('.', ',')}</ThemedText>
        <ThemedText type="smallBold" style={styles.amount}>{formatCOP(basic.amount + table.totalAmount)}</ThemedText>
      </View>
    </Card>}
    {basic.amount || table.workedMinutes ? <Card title="Liquidación estimada">
      {estimate.extraIncome ? <ValueRow label="Ingreso adicional" value={formatCOP(estimate.extraIncome)} /> : null}
      <ValueRow label="Devengado del periodo" value={formatCOP(estimate.gross)} />
      <ValueRow label="Salud (4 %)" value={formatCOP(estimate.health)} />
      <ValueRow label="Pensión (4 %)" value={formatCOP(estimate.pension)} />
      {estimate.solidarityFund ? <ValueRow label="Fondo de solidaridad" value={formatCOP(estimate.solidarityFund)} /> : null}
      {estimate.withholding ? <ValueRow label="Retención en la fuente" value={formatCOP(estimate.withholding)} /> : null}
      <ValueRow label="Neto estimado" value={formatCOP(estimate.net)} strong />
      <ThemedText type="caption" themeColor="textSecondary">
        {data.settings.payPeriod === 'quincenal' && Number(period.start.slice(8, 10)) < 16
          ? 'Fondo de solidaridad y retención se descuentan en la segunda quincena.'
          : 'Fondo de solidaridad y retención calculados sobre el mes completo.'}
        {' '}Estimado — puede diferir de tu nómina oficial.
      </ThemedText>
      <NumberField label="Bonificación u otro ingreso del periodo" value={extraDraft ?? (extraIncome ? String(extraIncome) : '')} onChange={setExtraDraft} placeholder="Solo pesos enteros; opcional" money />
      {extraDraft !== null ? <Button label="Guardar ingreso adicional" variant="secondary" onPress={saveExtra} /> : null}
      <ThemedText type="caption" themeColor="textSecondary">Suma al devengado completo: afecta salud, pensión, fondo de solidaridad y retención.</ThemedText>
    </Card> : null}
    {table.workedMinutes ? <ThemedText type="caption" themeColor="textSecondary">{formatMinutes(table.workedMinutes)} trabajados en el periodo.</ThemedText> : null}
    {incomplete ? <ThemedText type="caption" themeColor="textSecondary">Periodo incompleto: hay días sin registrar, los acumulados son parciales.</ThemedText> : null}
    <Button label={closed ? 'Reabrir periodo' : 'Cerrar periodo'} variant="secondary" onPress={toggleClosed} />
    <Button label={exporting ? 'Generando PDF…' : 'Exportar liquidación (PDF)'} variant="secondary" disabled={exporting} onPress={() => requestExport(data, period, 'liquidacion')} />
    <ThemedText type="caption" themeColor="textSecondary">El básico se prorratea por día pago (salario ÷ 30): descansos y permisos remunerados pagan el día; la incapacidad paga el 75 % del promedio diario devengado; permiso no remunerado no paga. Salud, pensión, retención y neto llegan con la liquidación salarial.</ThemedText>
  </Screen>;
}

const styles = StyleSheet.create({
  tableHeader: { flexDirection: 'row', paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  concepto: { flex: 1 },
  hours: { width: 48, textAlign: 'right' },
  amount: { width: 96, textAlign: 'right' },
  total: { borderTopWidth: 1, marginTop: 4, paddingTop: 10 },
});
