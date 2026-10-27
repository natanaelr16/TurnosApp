import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert } from 'react-native';

import { ShiftBreakdown } from '@/components/shift-breakdown';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, Screen, ValueRow } from '@/components/ui';
import { isLocalDate } from '@/domain/records';
import { computeShifts } from '@/domain/shift-calc';
import { useAppData } from '@/hooks/use-app-data';
import { formatCOP, formatMinutes, formatShortDate, formatTime } from '@/lib/format';
import { NOVELTY_LABELS, WARNING_LABELS } from '@/lib/record-form';

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id?: string; type?: string; date?: string; source?: string }>();
  const { data, removeShift, removeNovelty } = useAppData();
  const use12 = data.settings.timeFormat === '12h';
  const date = typeof params.date === 'string' && isLocalDate(params.date) ? params.date : undefined;
  const results = useMemo(() => computeShifts(data.shifts, data.settings), [data.shifts, data.settings]);
  const shifts = results.filter((r) => date ? r.shift.start.slice(0, 10) === date : params.type !== 'novelty' && r.shift.id === params.id);
  const novelties = data.novelties.filter((n) => date ? n.date === date : params.type === 'novelty' && n.id === params.id);
  const leave = () => router.canGoBack() ? router.back() : router.replace('/');
  const confirmDelete = (id: string, type: 'shift' | 'novelty') => Alert.alert('Eliminar registro', 'Este registro se eliminará del teléfono. No se puede deshacer.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      if (type === 'shift') await removeShift(id); else await removeNovelty(id);
      if (shifts.length + novelties.length <= 1) leave();
    } },
  ]);
  return <Screen title={date ? formatShortDate(date) : 'Detalle del registro'} subtitle={date?.slice(0, 4)} footer={<Button label="Cerrar" variant="secondary" onPress={leave} />}>
    {shifts.map((result) => <Card key={result.shift.id} title="Turno trabajado">
      <ValueRow label="Entrada" value={`${formatShortDate(result.shift.start.slice(0, 10))} · ${formatTime(result.shift.start, use12)}`} />
      <ValueRow label="Salida" value={`${formatShortDate(result.shift.end.slice(0, 10))} · ${formatTime(result.shift.end, use12)}`} />
      <ValueRow label="Horas trabajadas" value={formatMinutes(result.totalMinutes)} />
      <ValueRow label="Horas extra" value={formatMinutes(result.extraMinutes)} />
      <ValueRow label="Recargos ganados" value={formatCOP(result.surchargeTotal)} color="night" />
      <ValueRow label="Valor de horas extra" value={formatCOP(result.extraTotal)} color="extra" />
      <ValueRow label="Adicional al básico" value={formatCOP(result.total)} strong />
      <ShiftBreakdown result={result} initiallyExpanded />
      {(result.shift.fields ?? []).map((field) => <ValueRow key={field.name} label={field.name} value={String(field.value)} />)}
      {result.shift.note ? <ThemedText>{result.shift.note}</ThemedText> : null}
      {result.warnings.map((warning) => <ThemedText key={warning} accessibilityRole="alert" themeColor="danger">{WARNING_LABELS[warning] ?? warning}</ThemedText>)}
      <Button label="Editar turno" variant="secondary" onPress={() => router.push({ pathname: '/registro', params: { id: result.shift.id, type: 'shift' } })} />
      <Button label="Eliminar turno" variant="danger" onPress={() => confirmDelete(result.shift.id, 'shift')} />
    </Card>)}
    {novelties.map((novelty) => <Card key={novelty.id} title={NOVELTY_LABELS[novelty.kind]}>
      <ThemedText>{formatShortDate(novelty.date)}</ThemedText>
      <ThemedText>{novelty.kind === 'rest' ? 'Incluido en el salario básico. No suma ni resta.' : 'Novedad registrada. Su ajuste salarial aún no está disponible.'}</ThemedText>
      {novelty.note ? <ThemedText>{novelty.note}</ThemedText> : null}
      <Button label="Editar novedad" variant="secondary" onPress={() => router.push({ pathname: '/registro', params: { id: novelty.id, type: 'novelty' } })} />
      <Button label="Eliminar novedad" variant="danger" onPress={() => confirmDelete(novelty.id, 'novelty')} />
    </Card>)}
    {!shifts.length && !novelties.length ? <EmptyState title="Registro no disponible" message="Puede haberse eliminado." /> : null}
    {date && params.source === 'calendar' && !novelties.length ? <Button label="Añadir otro turno en este día" variant="secondary" onPress={() => router.push({ pathname: '/registro', params: { date } })} /> : null}
    <ThemedText type="caption" themeColor="textSecondary">Valores estimados del turno, adicionales al básico; no son el neto de nómina.</ThemedText>
  </Screen>;
}
