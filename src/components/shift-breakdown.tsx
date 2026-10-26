import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ValueRow } from '@/components/ui';
import { MINUTE_CATEGORIES, type MinuteCategory, type ShiftResult } from '@/domain/types';
import { formatCOP, formatMinutes } from '@/lib/format';

const LABELS: Record<MinuteCategory, string> = {
  ordinaryDay: 'Ordinaria diurna',
  ordinaryNight: 'Ordinaria nocturna',
  ordinaryDayHoliday: 'Ordinaria diurna dominical/festiva',
  ordinaryNightHoliday: 'Ordinaria nocturna dominical/festiva',
  extraDay: 'Extra diurna',
  extraNight: 'Extra nocturna',
  extraDayHoliday: 'Extra diurna dominical/festiva',
  extraNightHoliday: 'Extra nocturna dominical/festiva',
};

export function ShiftBreakdown({ result, initiallyExpanded = false }: { result: ShiftResult; initiallyExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  return <>
    <Button label={expanded ? 'Ocultar desglose de horas y dinero' : 'Ver desglose de horas y dinero'} variant="secondary" onPress={() => setExpanded(!expanded)} />
    {expanded ? <>
      <ValueRow label="Valor hora ordinaria" value={formatCOP(result.hourValue)} />
      {MINUTE_CATEGORIES.filter((category) => result.minutes[category] > 0).map((category) => <Card key={category} title={LABELS[category]}>
        <ValueRow label="Tiempo" value={formatMinutes(result.minutes[category])} />
        <ValueRow label="Adicional al básico" value={formatCOP(result.amounts[category])} color={category.startsWith('extra') ? 'extra' : category.endsWith('Holiday') ? 'holiday' : category.includes('Night') ? 'night' : 'day'} />
      </Card>)}
      <ThemedText type="caption">Las horas ordinarias diurnas de lunes a sábado, no festivas, no generan adicional: están incluidas en el básico. Los valores se clasifican minuto a minuto y se redondean por concepto.</ThemedText>
    </> : null}
  </>;
}
