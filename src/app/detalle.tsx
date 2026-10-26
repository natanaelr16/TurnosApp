import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ShiftBreakdown } from '@/components/shift-breakdown';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, Screen, ValueRow } from '@/components/ui';
import { isLocalDate } from '@/domain/records';
import { computeShifts } from '@/domain/shift-calc';
import { useAppData } from '@/hooks/use-app-data';
import { formatCOP, formatMinutes, formatShortDate } from '@/lib/format';
import { NOVELTY_LABELS } from '@/lib/record-form';

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id?: string; type?: string; date?: string; source?: string }>();
  const { data } = useAppData();
  const date = typeof params.date === 'string' && isLocalDate(params.date) ? params.date : undefined;
  const results = useMemo(() => computeShifts(data.shifts, data.settings), [data.shifts, data.settings]);
  const shifts = results.filter((r) => date ? r.shift.start.slice(0, 10) === date : params.type !== 'novelty' && r.shift.id === params.id);
  const novelties = data.novelties.filter((n) => date ? n.date === date : params.type === 'novelty' && n.id === params.id);
  const leave = () => router.canGoBack() ? router.back() : router.replace('/');
  return <Screen title={date ? formatShortDate(date) : 'Detalle del registro'} subtitle={date?.slice(0, 4)} footer={<Button label="Cerrar" variant="secondary" onPress={leave} />}>
    {shifts.map((result) => <Card key={result.shift.id} title="Turno trabajado">
      <ValueRow label="Entrada" value={`${formatShortDate(result.shift.start.slice(0, 10))} · ${result.shift.start.slice(11)}`} />
      <ValueRow label="Salida" value={`${formatShortDate(result.shift.end.slice(0, 10))} · ${result.shift.end.slice(11)}`} />
      <ValueRow label="Horas trabajadas" value={formatMinutes(result.totalMinutes)} />
      <ValueRow label="Horas extra" value={formatMinutes(result.extraMinutes)} />
      <ValueRow label="Recargos ganados" value={formatCOP(result.surchargeTotal)} color="night" />
      <ValueRow label="Valor de horas extra" value={formatCOP(result.extraTotal)} color="extra" />
      <ValueRow label="Adicional al básico" value={formatCOP(result.total)} strong />
      <ShiftBreakdown result={result} initiallyExpanded />
      {(result.shift.fields ?? []).map((field) => <ValueRow key={field.name} label={field.name} value={String(field.value)} />)}
      {result.shift.note ? <ThemedText>{result.shift.note}</ThemedText> : null}
      {result.warnings.map((warning) => <ThemedText key={warning} accessibilityRole="alert" themeColor="danger">{warning === 'EXTRA_DIARIO_EXCEDIDO' ? 'Más de 2 horas extra en la jornada.' : 'Más de 12 horas extra en la semana.'}</ThemedText>)}
      <Button label="Editar turno" variant="secondary" onPress={() => router.push({ pathname: '/registro', params: { id: result.shift.id, type: 'shift' } })} />
    </Card>)}
    {novelties.map((novelty) => <Card key={novelty.id} title={NOVELTY_LABELS[novelty.kind]}>
      <ThemedText>{formatShortDate(novelty.date)}</ThemedText>
      <ThemedText>{novelty.kind === 'rest' ? 'Incluido en el salario básico. No suma ni resta.' : 'Novedad registrada. Su ajuste salarial aún no está disponible.'}</ThemedText>
      {novelty.note ? <ThemedText>{novelty.note}</ThemedText> : null}
      <Button label="Editar novedad" variant="secondary" onPress={() => router.push({ pathname: '/registro', params: { id: novelty.id, type: 'novelty' } })} />
    </Card>)}
    {!shifts.length && !novelties.length ? <EmptyState title="Registro no disponible" message="Puede haberse eliminado." /> : null}
    {date && params.source === 'calendar' && !novelties.length ? <Button label="Añadir otro turno en este día" variant="secondary" onPress={() => router.push({ pathname: '/registro', params: { date } })} /> : null}
    <ThemedText type="caption" themeColor="textSecondary">Valores estimados del turno, adicionales al básico; no son el neto de nómina.</ThemedText>
  </Screen>;
}
