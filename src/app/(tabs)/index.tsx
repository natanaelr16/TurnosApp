import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { holidaysOf } from '@/domain/holidays';
import { addDays, dayOfWeek, daysInMonth, makeDate } from '@/domain/time';
import type { LocalDate } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { useTheme } from '@/hooks/use-theme';
import { CALENDAR_KINDS, calendarDays, calendarMarkers, type CalendarKind } from '@/lib/calendar';
import { formatMonth, formatMonthShort, formatShortDate, todayLocal } from '@/lib/format';

export default function CalendarScreen() {
  const { data } = useAppData();
  const theme = useTheme();
  const [anchor, setAnchor] = useState(todayLocal);
  const [mode, setMode] = useState<'month' | 'year'>('month');
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
      <View style={styles.month}>
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'month' ? 'Mes anterior' : 'Año anterior'} onPress={() => setAnchor(mode === 'month' ? addDays(first, -1) : makeDate(year - 1, month, 1))} style={styles.arrow}><ThemedText style={styles.chevron}>‹</ThemedText></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'month' ? `${formatMonth(year, month)}, ver todos los meses` : `${year}, ver el mes`} onPress={() => setMode(mode === 'month' ? 'year' : 'month')} style={styles.titleTap}>
          <ThemedText type="smallBold" accessibilityRole="header">{mode === 'month' ? formatMonth(year, month) : String(year)}</ThemedText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'month' ? 'Mes siguiente' : 'Año siguiente'} onPress={() => setAnchor(mode === 'month' ? addDays(makeDate(year, month, daysInMonth(year, month)), 1) : makeDate(year + 1, month, 1))} style={styles.arrow}><ThemedText style={styles.chevron}>›</ThemedText></Pressable>
      </View>
      {mode === 'month' ? <>
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
                <View style={styles.marks}>{kinds.map((key) => <View key={key} style={[styles.mark, { backgroundColor: CALENDAR_KINDS[key].background }]}><ThemedText type="caption" maxFontSizeMultiplier={1.3} style={{ color: CALENDAR_KINDS[key].text, fontWeight: '600' }}>{CALENDAR_KINDS[key].mark}</ThemedText></View>)}</View>
              </Pressable>;
            })}
          </View>)}
        </View>
        <View style={styles.legend}>{Object.entries(CALENDAR_KINDS).map(([key, palette]) => <View key={key} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: palette.background }]} /><ThemedText type="caption" maxFontSizeMultiplier={1.2}>{palette.mark}: {palette.label}</ThemedText></View>)}</View>
        <ThemedText type="caption" themeColor="textSecondary">Toca un día para registrar o consultar. Toca el nombre del mes para ver el año.</ThemedText>
      </> : <View style={styles.yearGrid}>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((m) => <MiniMonth key={m} year={year} month={m} markers={markers} holidays={holidays} today={today} isCurrent={m === month} onSelect={() => { setAnchor(makeDate(year, m, 1)); setMode('month'); }} />)}
      </View>}
    </View>
  </SafeAreaView>;
}

function MiniMonth({ year, month, markers, holidays, today, isCurrent, onSelect }: {
  year: number; month: number; markers: Map<string, CalendarKind[]>; holidays: Set<string>; today: LocalDate; isCurrent: boolean; onSelect: () => void;
}) {
  const theme = useTheme();
  const days = useMemo(() => calendarDays(year, month), [year, month]);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${formatMonthShort(month)}, ${days.filter((d) => d && markers.get(d)?.length).length} días con registro`} onPress={onSelect}
    style={[styles.mini, { backgroundColor: theme.backgroundElement, borderColor: isCurrent ? theme.primary : 'transparent', borderWidth: isCurrent ? 2 : 0 }]}>
    <ThemedText type="caption" style={styles.miniName}>{formatMonthShort(month)}</ThemedText>
    <View style={styles.miniGrid}>
      {days.map((date, index) => {
        if (!date) return <View key={`e-${index}`} style={styles.miniCell} />;
        const kinds = markers.get(date) ?? [];
        const festive = holidays.has(date) || dayOfWeek(date) === 0;
        return <View key={date} style={[styles.miniCell, { backgroundColor: kinds.length ? CALENDAR_KINDS[kinds[0]].background : 'transparent' }]}>
          <ThemedText maxFontSizeMultiplier={1.1} style={[styles.miniDay, { color: kinds.length ? CALENDAR_KINDS[kinds[0]].text : festive ? theme.holiday : theme.text, fontWeight: date === today ? '700' : '400' }]}>{Number(date.slice(8))}</ThemedText>
          {kinds.length > 1 ? <View style={[styles.miniDot, { backgroundColor: CALENDAR_KINDS[kinds[1]].background }]} /> : null}
        </View>;
      })}
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: BottomTabInset + 8, gap: 6 },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }, arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, chevron: { fontSize: 30, lineHeight: 34 },
  titleTap: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  week: { flexDirection: 'row', minHeight: 24 }, grid: { flex: 1, maxHeight: 420, gap: 3 }, weekRow: { flex: 1, flexDirection: 'row', minHeight: 44, gap: 3 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' }, day: { minHeight: 44, borderRadius: 10 }, marks: { flexDirection: 'row', gap: 2 }, mark: { paddingHorizontal: 3, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 6 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, dot: { width: 12, height: 12, borderRadius: 3 },
  yearGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignContent: 'space-between' },
  mini: { width: '31%', flexGrow: 1, borderRadius: 10, padding: 4, gap: 2 },
  miniName: { fontWeight: '600' },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  miniCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 3 },
  miniDay: { fontSize: 8, lineHeight: 10 },
  miniDot: { position: 'absolute', bottom: 1, right: 1, width: 4, height: 4, borderRadius: 2 },
});
