import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { addDays } from '@/domain/time';
import type { PayPeriodType, PeriodRange } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';
import { formatPeriod } from '@/lib/format';

export function PeriodSelector({ period, type, onDateChange, onTypeChange }: {
  period: PeriodRange; type: PayPeriodType; onDateChange: (date: string) => void; onTypeChange?: (type: PayPeriodType) => void;
}) {
  const theme = useTheme();
  return <View style={{ gap: 8 }}>
    {onTypeChange ? <View style={styles.row}>{(['quincenal', 'mensual'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: type === value }} accessibilityLabel={value === 'quincenal' ? 'Quincena' : 'Mes'} onPress={() => onTypeChange(value)} style={[styles.segment, { backgroundColor: type === value ? theme.backgroundSelected : theme.backgroundElement, borderColor: type === value ? theme.primary : theme.border }]}><ThemedText type="smallBold">{value === 'quincenal' ? 'Quincena' : 'Mes'}</ThemedText></Pressable>)}</View> : null}
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Periodo anterior" style={styles.arrow} onPress={() => onDateChange(addDays(period.start, -1))}><ThemedText style={styles.chevron}>‹</ThemedText></Pressable>
      <ThemedText type="smallBold" style={{ flex: 1, textAlign: 'center' }}>{formatPeriod(period.start, period.end)}</ThemedText>
      <Pressable accessibilityRole="button" accessibilityLabel="Periodo siguiente" style={styles.arrow} onPress={() => onDateChange(addDays(period.end, 1))}><ThemedText style={styles.chevron}>›</ThemedText></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, segment: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, arrow: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }, chevron: { fontSize: 30, lineHeight: 34 } });
