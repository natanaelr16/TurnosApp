import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PeriodSelector } from '@/components/period-selector';
import { ThemedText } from '@/components/themed-text';
import { Card, EmptyState, Screen } from '@/components/ui';
import { liquidationTable, periodFor } from '@/domain/payroll';
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
  const activeRows = table.rows.filter((row) => row.hours > 0);
  return <Screen title="Resumen" subtitle="Acumulados del periodo">
    <PeriodSelector period={period} type={data.settings.payPeriod} onDateChange={setAnchor} />
    {!activeRows.length && !table.workedMinutes ? <EmptyState title="Sin turnos en este periodo" message="Registra turnos para ver tus recargos y extras acumulados." /> : <Card title="Detalle de liquidación">
      <View style={styles.tableHeader}>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.concepto}>Concepto</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.hours}>Horas</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.amount}>Valor</ThemedText>
      </View>
      {activeRows.map((row) => <View key={row.category} style={styles.row} accessible accessibilityLabel={`${row.label}: ${row.hours.toFixed(2).replace('.', ',')} horas, ${formatCOP(row.amount)}`}>
        <ThemedText type="small" style={styles.concepto} numberOfLines={2}>{formatFactor(row.factor)} · {row.label}</ThemedText>
        <ThemedText type="small" style={styles.hours}>{row.hours.toFixed(2).replace('.', ',')}</ThemedText>
        <ThemedText type="money" style={styles.amount}>{formatCOP(row.amount)}</ThemedText>
      </View>)}
      <View style={[styles.row, styles.total, { borderTopColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.concepto}>Total recargos y extras</ThemedText>
        <ThemedText type="smallBold" style={styles.hours}>{table.rows.reduce((s, r) => s + r.hours, 0).toFixed(2).replace('.', ',')}</ThemedText>
        <ThemedText type="smallBold" style={styles.amount}>{formatCOP(table.totalAmount)}</ThemedText>
      </View>
    </Card>}
    {table.workedMinutes ? <ThemedText type="caption" themeColor="textSecondary">{formatMinutes(table.workedMinutes)} trabajados en el periodo.</ThemedText> : null}
    {incomplete ? <ThemedText type="caption" themeColor="textSecondary">Periodo incompleto: hay días sin registrar, los acumulados son parciales.</ThemedText> : null}
    <ThemedText type="caption" themeColor="textSecondary">Son recargos y extras adicionales al básico. La estimación de salud, pensión, retención y neto llega con la liquidación salarial.</ThemedText>
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
