import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PeriodSelector } from '@/components/period-selector';
import { ThemedText } from '@/components/themed-text';
import { Card, EmptyState, Screen, ValueRow } from '@/components/ui';
import { liquidationTable, payEstimate, periodFor } from '@/domain/payroll';
import { recordCoverage } from '@/domain/records';
import { computeShifts } from '@/domain/shift-calc';
import { useAppData } from '@/hooks/use-app-data';
import { useTheme } from '@/hooks/use-theme';
import { formatCOP, formatFactor, formatMinutes, todayLocal } from '@/lib/format';

export default function SummaryScreen() {
  const { data } = useAppData();
  const theme = useTheme();
  const [anchor, setAnchor] = useState(todayLocal);
  const period = useMemo(() => periodFor(anchor, data.settings.payPeriod), [anchor, data.settings.payPeriod]);
  const results = useMemo(() => computeShifts(data.shifts, data.settings), [data.shifts, data.settings]);
  const table = useMemo(() => liquidationTable(results, data.settings, period), [results, data.settings, period]);
  const incomplete = recordCoverage(data.shifts, data.novelties, period).missingDates.length > 0;
  const estimate = useMemo(() => payEstimate(results, data.novelties, data.settings, period), [results, data.novelties, data.settings, period]);
  const basic = estimate.basic;
  const activeRows = table.rows.filter((row) => row.hours > 0);
  return <Screen title="Resumen" subtitle="Acumulados del periodo">
    <PeriodSelector period={period} type={data.settings.payPeriod} onDateChange={setAnchor} />
    {!activeRows.length && !table.workedMinutes && !basic.amount ? <EmptyState title="Sin registros en este periodo" message="Registra turnos, descansos o novedades para ver tu liquidación acumulada." /> : <Card title="Detalle de liquidación">
      <View style={styles.tableHeader}>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.concepto}>Concepto</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.hours}>Horas</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.amount}>Valor</ThemedText>
      </View>
      {basic.fullDays || basic.sickDays || basic.unpaidDays ? <>
        <View style={styles.row} accessible accessibilityLabel={`Salario básico: ${basic.fullDays} días pagos a ${formatCOP(basic.daily)}, ${formatCOP(basic.fullAmount)}`}>
          <ThemedText type="smallBold" style={styles.concepto} numberOfLines={2}>Salario básico · {basic.fullDays} {basic.fullDays === 1 ? 'día' : 'días'} × {formatCOP(basic.daily)}</ThemedText>
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
    </Card> : null}
    {table.workedMinutes ? <ThemedText type="caption" themeColor="textSecondary">{formatMinutes(table.workedMinutes)} trabajados en el periodo.</ThemedText> : null}
    {incomplete ? <ThemedText type="caption" themeColor="textSecondary">Periodo incompleto: hay días sin registrar, los acumulados son parciales.</ThemedText> : null}
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
