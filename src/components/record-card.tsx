import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, ValueRow } from '@/components/ui';
import type { Novelty, Shift, ShiftResult } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { formatCOP, formatMinutes, formatShortDate, formatTime } from '@/lib/format';
import { NOVELTY_LABELS } from '@/lib/record-form';

export type RecordItem = { type: 'shift'; value: Shift } | { type: 'novelty'; value: Novelty };
export const recordDate = (item: RecordItem) => item.type === 'shift' ? item.value.start.slice(0, 10) : item.value.date;

export const RecordCard = memo(function RecordCard({ item, result }: { item: RecordItem; result?: ShiftResult }) {
  const date = recordDate(item);
  const use12 = useAppData().data.settings.timeFormat === '12h';
  const title = item.type === 'shift' ? `${formatTime(item.value.start, use12)}–${formatTime(item.value.end, use12)}${item.value.end.slice(0, 10) !== date ? ' · día siguiente' : ''}` : NOVELTY_LABELS[item.value.kind];
  return <Pressable accessibilityRole="button" accessibilityLabel={`${formatShortDate(date)}, ${title}${result ? `, ${formatMinutes(result.extraMinutes)} extra, recargos ${formatCOP(result.surchargeTotal)}` : ''}, consultar detalle`} onPress={() => router.push({ pathname: '/detalle', params: { id: item.value.id, type: item.type } })}>
    <Card title={`${formatShortDate(date)} · ${date.slice(0, 4)}`}>
      <ThemedText type="smallBold">{title} ›</ThemedText>
      {result ? <>
        <ValueRow label="Horas extra" value={formatMinutes(result.extraMinutes)} />
        <ValueRow label="Recargos" value={formatCOP(result.surchargeTotal)} color="night" />
        <ValueRow label="Extras" value={formatCOP(result.extraTotal)} color="extra" />
      </> : null}
    </Card>
  </Pressable>;
});
