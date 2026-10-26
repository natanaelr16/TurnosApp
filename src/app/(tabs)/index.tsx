import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { holidaysOf } from '@/domain/holidays';
import { addDays, dayOfWeek, daysInMonth, makeDate } from '@/domain/time';
import { useAppData } from '@/hooks/use-app-data';
import { useTheme } from '@/hooks/use-theme';
import { CALENDAR_KINDS, calendarDays, calendarMarkers } from '@/lib/calendar';
import { formatMonth, formatShortDate, todayLocal } from '@/lib/format';

export default function CalendarScreen() {
  const { data } = useAppData();
  const theme = useTheme();
  const [anchor, setAnchor] = useState(todayLocal);
  const lastDay = useRef(todayLocal());
  useFocusEffect(useCallback(() => {
    setAnchor(todayLocal());
    const syncDay = () => {
      const next = todayLocal();
      if (lastDay.current !== next) { lastDay.current = next; setAnchor(next); }
    };
    const timer = setInterval(syncDay, 60_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') syncDay(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []));
  const [year, month] = anchor.split('-').map(Number);
  const first = makeDate(year, month, 1);
  const days = useMemo(() => calendarDays(year, month), [year, month]);
  const markers = useMemo(() => calendarMarkers(data.shifts, data.novelties), [data.shifts, data.novelties]);
  const holidays = useMemo(() => new Set(holidaysOf(year)), [year]);
  const today = todayLocal();
  const openDay = (date: string) => {
    if (markers.get(date)?.length) router.push({ pathname: '/detalle', params: { date, source: 'calendar' } });
    else router.push({ pathname: '/registro', params: { date } });
  };
  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={styles.content}>
      <ThemedText type="title" style={styles.title} accessibilityRole="header">Calendario</ThemedText>
      <View style={styles.month}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={() => setAnchor(addDays(first, -1))} style={styles.arrow}><ThemedText style={styles.chevron}>‹</ThemedText></Pressable>
        <ThemedText type="smallBold" accessibilityRole="header">{formatMonth(year, month)}</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" onPress={() => setAnchor(addDays(makeDate(year, month, daysInMonth(year, month)), 1))} style={styles.arrow}><ThemedText style={styles.chevron}>›</ThemedText></Pressable>
      </View>
      <View style={styles.week}>{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => <View key={label} style={styles.cell}><ThemedText type="caption" maxFontSizeMultiplier={1.2}>{label}</ThemedText></View>)}</View>
      <View style={styles.grid}>
        {Array.from({ length: days.length / 7 }, (_, row) => <View key={row} style={styles.weekRow}>
          {days.slice(row * 7, row * 7 + 7).map((date, column) => {
            if (!date) return <View key={`empty-${column}`} style={styles.cell} />;
            const kinds = markers.get(date) ?? [];
            const palette = kinds.length === 1 ? CALENDAR_KINDS[kinds[0]] : null;
            const festive = holidays.has(date) || dayOfWeek(date) === 0;
            return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${formatShortDate(date)}${date === today ? ', hoy' : ''}${dayOfWeek(date) === 0 ? ', domingo' : holidays.has(date) ? ', festivo' : ''}, ${kinds.length ? kinds.map((key) => CALENDAR_KINDS[key].label).join(' y ') + ', consultar' : 'sin registro, registrar'}`} accessibilityState={{ selected: date === today }} onPress={() => openDay(date)}
              style={[styles.cell, styles.day, { backgroundColor: palette?.background ?? theme.backgroundElement, borderColor: date === today ? theme.primary : 'transparent', borderWidth: date === today ? 2 : 0 }]}>
              <ThemedText type={date === today ? 'smallBold' : 'small'} maxFontSizeMultiplier={1.4} style={{ color: palette?.text ?? (festive ? theme.holiday : theme.text), textDecorationLine: festive ? 'underline' : 'none' }}>{Number(date.slice(8))}</ThemedText>
              <View style={styles.marks}>{kinds.map((key) => <View key={key} style={[styles.mark, { backgroundColor: CALENDAR_KINDS[key].background }]}><ThemedText type="caption" maxFontSizeMultiplier={1.1} style={{ color: CALENDAR_KINDS[key].text }}>{CALENDAR_KINDS[key].mark}</ThemedText></View>)}</View>
            </Pressable>;
          })}
        </View>)}
      </View>
      <View style={styles.legend}>{Object.entries(CALENDAR_KINDS).map(([key, palette]) => <View key={key} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: palette.background }]} /><ThemedText type="caption" maxFontSizeMultiplier={1.2}>{palette.mark}: {palette.label}</ThemedText></View>)}</View>
      <ThemedText type="caption" themeColor="textSecondary">Toca un día. Subrayado: domingo o festivo.</ThemedText>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: BottomTabInset + 8, gap: 6 },
  title: { fontSize: 26, lineHeight: 32 }, month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }, arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, chevron: { fontSize: 30, lineHeight: 34 },
  week: { flexDirection: 'row', minHeight: 24 }, grid: { flex: 1, maxHeight: 420, gap: 3 }, weekRow: { flex: 1, flexDirection: 'row', minHeight: 44, gap: 3 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' }, day: { minHeight: 44, borderRadius: 10 }, marks: { flexDirection: 'row', gap: 2 }, mark: { paddingHorizontal: 3, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 6 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, dot: { width: 12, height: 12, borderRadius: 3 },
});
