import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, AppState, Easing, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { holidaysOf } from '@/domain/holidays';
import { computeShifts } from '@/domain/shift-calc';
import { datePart, dayOfWeek, makeDate } from '@/domain/time';
import type { LocalDate, Novelty, Shift } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { useTheme } from '@/hooks/use-theme';
import { CALENDAR_KINDS, calendarDays, calendarMarkers, type CalendarKind } from '@/lib/calendar';
import { formatCOP, formatMinutes, formatMonth, formatMonthShort, formatShortDate, formatTime, todayLocal } from '@/lib/format';
import { NOVELTY_LABELS } from '@/lib/record-form';

export default function CalendarScreen() {
  const { data, removeShift, removeNovelty } = useAppData();
  const theme = useTheme();
  const [anchor, setAnchor] = useState(todayLocal);
  const [mode, setMode] = useState<'month' | 'year' | 'years'>('month');
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [transit] = useState(() => new Animated.Value(0));
  const [transitFrom, setTransitFrom] = useState<{ x: number; y: number } | null>(null);
  const [zoom] = useState(() => new Animated.Value(1));
  useEffect(() => {
    zoom.setValue(mode === 'month' ? 0.88 : mode === 'year' ? 1.12 : 1.06);
    Animated.timing(zoom, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [mode, zoom]);
  const lastDay = useRef(todayLocal());
  useFocusEffect(useCallback(() => {
    if (transitFrom) Animated.timing(transit, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    setAnchor(todayLocal());
    const syncDay = () => {
      const next = todayLocal();
      if (lastDay.current !== next) { lastDay.current = next; setAnchor(next); }
    };
    const timer = setInterval(syncDay, 60_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') syncDay(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [transit, transitFrom]));
  const [year, month] = anchor.split('-').map(Number);
  const markers = useMemo(() => calendarMarkers(data.shifts, data.novelties), [data.shifts, data.novelties]);
  const today = todayLocal();
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7));
  const years = useMemo(() => Array.from({ length: 61 }, (_, i) => todayYear - 30 + i), [todayYear]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const monthIndex = year * 12 + month - 1;
  const todayIndex = todayYear * 12 + todayMonth - 1;
  const months = useMemo(() => Array.from({ length: 721 }, (_, i) => todayIndex - 360 + i), [todayIndex]);
  const monthWidth = Math.min(windowWidth, MaxContentWidth) - 24;
  const monthHeight = Math.max(windowHeight - 390, 320);
  const monthList = useRef<FlatList<number>>(null);
  const scrollToMonth = useCallback((index: number) => {
    const i = months.indexOf(index);
    if (i >= 0) monthList.current?.scrollToIndex({ index: i, animated: true });
  }, [months]);
  const yearItemHeight = Math.max(windowHeight - 270, 420);
  const yearList = useRef<FlatList<number>>(null);
  const viewability = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);
  const onYearsVisible = useCallback(({ viewableItems }: { viewableItems: { item: unknown }[] }) => {
    const item = viewableItems[0]?.item;
    if (typeof item === 'number') setAnchor((prev) => { const [, pm] = prev.split('-').map(Number); return makeDate(item, pm, 1); });
  }, []);
  const onMonthsVisible = useCallback(({ viewableItems }: { viewableItems: { item: unknown }[] }) => {
    const item = viewableItems[0]?.item;
    if (typeof item === 'number') setAnchor(makeDate(Math.floor(item / 12), (item % 12) + 1, 1));
    setSelected(null);
  }, []);
  const scrollToYear = useCallback((y: number) => {
    const index = years.indexOf(y);
    if (index >= 0) yearList.current?.scrollToIndex({ index, animated: true });
  }, [years]);
  const [yearBase, setYearBase] = useState(() => Math.floor(todayYear / 12) * 12);
  useEffect(() => {
    if (mode === 'month' && monthList.current) monthList.current.scrollToIndex({ index: months.indexOf(monthIndex), animated: false });
    else if (mode === 'year' && yearList.current && years.indexOf(year) >= 0) yearList.current.scrollToIndex({ index: years.indexOf(year), animated: false });
  }, [mode, months, years, monthIndex, year]);
  const clearSelection = () => { setSelected(null); setSelectedMonth(null); };
  const goPrev = () => {
    clearSelection();
    if (mode === 'month') scrollToMonth(monthIndex - 1);
    else if (mode === 'year') { setAnchor(makeDate(year - 1, month, 1)); scrollToYear(year - 1); }
    else setYearBase(yearBase - 12);
  };
  const goNext = () => {
    clearSelection();
    if (mode === 'month') scrollToMonth(monthIndex + 1);
    else if (mode === 'year') { setAnchor(makeDate(year + 1, month, 1)); scrollToYear(year + 1); }
    else setYearBase(yearBase + 12);
  };
  const tapTitle = () => {
    clearSelection();
    if (mode === 'month') setMode('year');
    else if (mode === 'year') { setYearBase(Math.floor(year / 12) * 12); setMode('years'); }
    else setMode('year');
  };
  const title = mode === 'month' ? formatMonth(year, month) : mode === 'year' ? String(year) : `${yearBase}–${yearBase + 11}`;
  const titleLabel = mode === 'month' ? `${title}, ver todos los meses` : mode === 'year' ? `${year}, elegir otro año` : `${title}, volver a los meses`;
  const openDay = (date: string) => {
    const go = () => markers.get(date)?.length
      ? router.push({ pathname: '/detalle', params: { date, source: 'calendar' } })
      : router.push({ pathname: '/registro', params: { date } });
    const origin = mode === 'month' ? dayCellCenter(date) : null;
    if (!origin) { go(); return; }
    setTransitFrom(origin);
    transit.setValue(0);
    Animated.timing(transit, { toValue: 1, duration: 230, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(go);
  };
  const anchorDays = useMemo(() => calendarDays(year, month), [year, month]);
  const resultById = useMemo(() => new Map(computeShifts(data.shifts, data.settings).map((r) => [r.shift.id, r])), [data.shifts, data.settings]);
  const dayShifts = (date: string) => data.shifts.filter((s) => datePart(s.start) === date);
  const dayNovelties = (date: string) => data.novelties.filter((n) => n.date === date);
  const [popover, setPopover] = useState<{ date: string; x: number; y: number; above: boolean } | null>(null);
  const [popAnim] = useState(() => new Animated.Value(0));
  const openPopover = (date: string) => {
    const index = anchorDays.indexOf(date);
    if (index < 0) return;
    const cellW = monthWidth / 7;
    const rows = anchorDays.length / 7;
    const cellH = monthHeight / rows;
    const row = Math.floor(index / 7);
    setPopover({ date, x: (index % 7) * cellW + cellW / 2, y: row * cellH + cellH / 2, above: row >= rows - 2 });
    popAnim.setValue(0);
    Animated.spring(popAnim, { toValue: 1, damping: 15, stiffness: 180, useNativeDriver: true }).start();
  };
  const closePopover = () => {
    Animated.timing(popAnim, { toValue: 0, duration: 140, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setPopover(null));
  };
  const confirmDeleteDay = (date: string) => {
    const shifts = dayShifts(date);
    const novelties = dayNovelties(date);
    if (!shifts.length && !novelties.length) return;
    Alert.alert('Eliminar registro', `Se eliminará lo registrado el ${formatShortDate(date)}. No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        for (const s of shifts) await removeShift(s.id);
        for (const n of novelties) await removeNovelty(n.id);
        setPopover(null);
        setSelected(null);
      } },
    ]);
  };
  const dayCellCenter = (date: string) => {
    const index = anchorDays.indexOf(date);
    if (index < 0) return null;
    const cellW = monthWidth / 7;
    const cellH = monthHeight / (anchorDays.length / 7);
    return { x: (index % 7) * cellW + cellW / 2, y: Math.floor(index / 7) * cellH + cellH / 2 };
  };
  const tapDay = (date: string) => { if (selected === date) openDay(date); else setSelected(date); };
  const tapMonth = (y: number, m: number) => {
    if (y === year && selectedMonth === m) { setAnchor(makeDate(y, m, 1)); setMode('month'); }
    else { setAnchor(makeDate(y, month, 1)); setSelectedMonth(m); }
  };
  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={styles.content}>
      <View style={styles.month}>
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'month' ? 'Mes anterior' : mode === 'year' ? 'Año anterior' : '12 años anteriores'} onPress={goPrev} style={styles.arrow}><ThemedText style={styles.chevron}>‹</ThemedText></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={titleLabel} onPress={tapTitle} style={styles.titleTap}>
          <ThemedText type="subtitle" accessibilityRole="header">{title}</ThemedText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'month' ? 'Mes siguiente' : mode === 'year' ? 'Año siguiente' : '12 años siguientes'} onPress={goNext} style={styles.arrow}><ThemedText style={styles.chevron}>›</ThemedText></Pressable>
      </View>
      <Animated.View style={[styles.zoom, { opacity: zoom, transform: [{ scale: zoom }] }]}>
      {mode === 'month' ? <Animated.View style={{ flex: 1, opacity: transit.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] }), transform: [
        { translateX: transit.interpolate({ inputRange: [0, 1], outputRange: [0, transitFrom ? monthWidth / 2 - transitFrom.x : 0] }) },
        { translateY: transit.interpolate({ inputRange: [0, 1], outputRange: [0, transitFrom ? 70 - transitFrom.y : 0] }) },
        { scale: transit.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }] }}>
        <View style={styles.week}>{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => <View key={label} style={styles.cell}><ThemedText type="smallBold" maxFontSizeMultiplier={1.2}>{label}</ThemedText></View>)}</View>
        <FlatList<number> ref={monthList} data={months} keyExtractor={(item) => String(item)} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, height: monthHeight }}
          initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3} decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: monthWidth, offset: monthWidth * index, index })}
          initialScrollIndex={months.indexOf(monthIndex) >= 0 ? months.indexOf(monthIndex) : 360}
          viewabilityConfig={viewability} onViewableItemsChanged={onMonthsVisible}
          renderItem={({ item: index }) => <MonthGrid key={index} year={Math.floor(index / 12)} month={(index % 12) + 1} markers={markers} today={today}
            selected={selected} onTapDay={tapDay} onLongDay={openPopover} width={monthWidth} height={monthHeight} />}
        />
        {popover ? <>
          <Pressable accessibilityLabel="Cerrar vista del día" style={[StyleSheet.absoluteFill, { zIndex: 4 }]} onPress={closePopover} />
          <DayPopover date={popover.date} x={popover.x} y={popover.y} above={popover.above} width={monthWidth} gridTop={30} anim={popAnim}
            shifts={dayShifts(popover.date)} novelties={dayNovelties(popover.date)} resultById={resultById}
            onOpen={() => { setPopover(null); openDay(popover.date); }} onDelete={() => { closePopover(); confirmDeleteDay(popover.date); }} />
        </> : null}
        <View style={styles.legend}>{Object.entries(CALENDAR_KINDS).map(([key, palette]) => <View key={key} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: palette.background }]} /><ThemedText type="caption" maxFontSizeMultiplier={1.2}>{palette.mark}: {palette.label}</ThemedText></View>)}</View>
        <ThemedText type="caption" themeColor="textSecondary">Desliza para cambiar de mes. Toca un día para seleccionarlo y otra vez para abrirlo.</ThemedText>
      </Animated.View> : mode === 'year' ? <FlatList<number>
        ref={yearList} data={years} keyExtractor={(item) => String(item)} showsVerticalScrollIndicator={false}
        initialNumToRender={2} maxToRenderPerBatch={2} windowSize={3}
        getItemLayout={(_, index) => ({ length: yearItemHeight, offset: yearItemHeight * index, index })}
        initialScrollIndex={years.indexOf(year) >= 0 ? years.indexOf(year) : 30}
        viewabilityConfig={viewability} onViewableItemsChanged={onYearsVisible}
        renderItem={({ item: y }) => <YearBlock year={y} height={yearItemHeight} markers={markers} today={today}
          currentMonth={y === todayYear ? todayMonth : 0} selectedMonth={y === year ? selectedMonth : null} onTapMonth={(m) => tapMonth(y, m)} />}
      /> : <View style={styles.yearGrid}>
        {Array.from({ length: 12 }, (_, index) => yearBase + index).map((y) => <Pressable key={y} accessibilityRole="button" accessibilityLabel={`${y}${y === todayYear ? ', año actual' : ''}`} accessibilityState={{ selected: y === year }} onPress={() => { setAnchor(makeDate(y, month, 1)); setMode('year'); }}
          style={[styles.yearCell, { backgroundColor: theme.backgroundElement, borderColor: y === year ? theme.primary : y === todayYear ? theme.holiday : 'transparent', borderWidth: y === year || y === todayYear ? 2 : 0 }]}>
          <ThemedText type={y === year || y === todayYear ? 'smallBold' : 'small'} style={{ color: y === year ? theme.primary : y === todayYear ? theme.holiday : theme.text }}>{y}</ThemedText>
        </Pressable>)}
      </View>}
      </Animated.View>
    </View>
  </SafeAreaView>;
}

function MonthGrid({ year, month, markers, today, selected, onTapDay, onLongDay, width, height }: {
  year: number; month: number; markers: Map<string, CalendarKind[]>; today: LocalDate;
  selected: string | null; onTapDay: (date: string) => void; onLongDay: (date: string) => void; width: number; height: number;
}) {
  const theme = useTheme();
  const days = useMemo(() => calendarDays(year, month), [year, month]);
  const holidays = useMemo(() => new Set(holidaysOf(year)), [year]);
  return <View style={[styles.grid, { width, height }]}>
    {Array.from({ length: days.length / 7 }, (_, row) => <View key={row} style={styles.weekRow}>
      {days.slice(row * 7, row * 7 + 7).map((date, column) => {
        if (!date) return <View key={`empty-${column}`} style={styles.cell} />;
        const kinds = markers.get(date) ?? [];
        const palette = kinds.length === 1 ? CALENDAR_KINDS[kinds[0]] : null;
        const festive = holidays.has(date) || dayOfWeek(date) === 0;
        return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${formatShortDate(date)}${date === today ? ', hoy' : ''}${dayOfWeek(date) === 0 ? ', domingo' : holidays.has(date) ? ', festivo' : ''}, ${kinds.length ? kinds.map((key) => CALENDAR_KINDS[key].label).join(' y ') : 'sin registro'}${selected === date ? ', seleccionado, toca de nuevo para abrir' : ', toca para seleccionar'}${kinds.length ? ', mantén presionado para vista rápida' : ''}`} accessibilityState={{ selected: selected === date }} onPress={() => onTapDay(date)} onLongPress={() => onLongDay(date)} delayLongPress={300}
          style={[styles.cell, styles.day, { backgroundColor: palette?.background ?? theme.backgroundElement, borderColor: selected === date ? theme.primary : date === today ? theme.holiday : 'transparent', borderWidth: selected === date || date === today ? 2 : 0 }]}>
          <ThemedText maxFontSizeMultiplier={1.4} style={[styles.dayNumber, { color: palette?.text ?? (festive ? theme.holiday : theme.text), textDecorationLine: festive ? 'underline' : 'none', fontWeight: date === today ? '700' : '500' }]}>{Number(date.slice(8))}</ThemedText>
          <View style={styles.marks}>{kinds.map((key) => <View key={key} style={[styles.mark, { backgroundColor: CALENDAR_KINDS[key].background }]}><ThemedText type="caption" maxFontSizeMultiplier={1.3} style={{ color: CALENDAR_KINDS[key].text, fontWeight: '600' }}>{CALENDAR_KINDS[key].mark}</ThemedText></View>)}</View>
        </Pressable>;
      })}
    </View>)}
  </View>;
}

function DayPopover({ date, x, y, above, width, gridTop, anim, shifts, novelties, resultById, onOpen, onDelete }: {
  date: string; x: number; y: number; above: boolean; width: number; gridTop: number; anim: Animated.Value;
  shifts: Shift[]; novelties: Novelty[]; resultById: Map<string, ReturnType<typeof computeShifts>[number]>;
  onOpen: () => void; onDelete: () => void;
}) {
  const theme = useTheme();
  const use12 = useAppData().data.settings.timeFormat === '12h';
  const cardW = Math.min(300, width - 24);
  const cardH = 270;
  const left = Math.min(Math.max(x - cardW / 2, 4), width - cardW - 4);
  const top = gridTop + (above ? y - cardH + 10 : y + 16);
  const tx = x - (left + cardW / 2);
  const ty = gridTop + y - (top + cardH / 2);
  return <Animated.View style={[styles.popover, { backgroundColor: theme.backgroundElement, borderColor: theme.border, width: cardW, left, top, opacity: anim, zIndex: 5,
    transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [tx, 0] }) }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [ty, 0] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }]}>
    <ThemedText type="smallBold" accessibilityRole="header">{formatShortDate(date)} · {date.slice(0, 4)}</ThemedText>
    {!shifts.length && !novelties.length ? <ThemedText type="small" themeColor="textSecondary">Sin registro este día.</ThemedText> : null}
    {shifts.map((s) => {
      const r = resultById.get(s.id);
      return <View key={s.id} style={{ gap: 2 }}>
        <ThemedText type="smallBold">{formatTime(s.start, use12)} → {formatTime(s.end, use12)} · {r ? formatMinutes(r.totalMinutes) : ''}</ThemedText>
        {r ? <ThemedText type="caption" themeColor="textSecondary">Extra {formatMinutes(r.extraMinutes)} · recargos y extras {formatCOP(r.total)}</ThemedText> : null}
        {s.note ? <ThemedText type="caption" themeColor="textSecondary">{s.note}</ThemedText> : null}
        {s.fields?.map((f, i) => <ThemedText key={i} type="caption" themeColor="textSecondary">{f.name}: {String(f.value)}</ThemedText>)}
      </View>;
    })}
    {novelties.map((n) => <ThemedText key={n.id} type="small">{NOVELTY_LABELS[n.kind] ?? n.kind}{n.note ? ` · ${n.note}` : ''}</ThemedText>)}
    <View style={styles.popActions}>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir el día" onPress={onOpen}
        style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>Abrir</ThemedText>
      </Pressable>
      {shifts.length || novelties.length ? <TrashButton onPress={onDelete} theme={theme} /> : null}
    </View>
  </Animated.View>;
}

function TrashButton({ onPress, theme }: { onPress: () => void; theme: { danger: string; border: string; backgroundElement: string } }) {
  const [wiggle] = useState(() => new Animated.Value(0));
  const press = () => {
    wiggle.setValue(0);
    Animated.timing(wiggle, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => onPress());
  };
  return <Pressable accessibilityRole="button" accessibilityLabel="Eliminar lo registrado este día" onPress={press}
    style={({ pressed }) => [styles.actionButton, styles.trashButton, { borderColor: theme.danger, opacity: pressed ? 0.6 : 1 }]}>
    <Animated.View style={{ transform: [{ rotate: wiggle.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ['0deg', '-16deg', '14deg', '-8deg', '6deg', '0deg'] }) }, { scale: wiggle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) }] }}>
      <Ionicons name="trash-outline" size={20} color={theme.danger} />
    </Animated.View>
  </Pressable>;
}

function YearBlock({ year, height, markers, today, currentMonth, selectedMonth, onTapMonth }: {
  year: number; height: number; markers: Map<string, CalendarKind[]>; today: LocalDate;
  currentMonth: number; selectedMonth: number | null; onTapMonth: (month: number) => void;
}) {
  const theme = useTheme();
  const holidays = useMemo(() => new Set(holidaysOf(year)), [year]);
  return <View style={{ height, gap: 4 }}>
    <ThemedText type="smallBold" style={{ color: year === Number(today.slice(0, 4)) ? theme.holiday : theme.text }}>{year}</ThemedText>
    <View style={styles.yearGrid}>
      {Array.from({ length: 12 }, (_, index) => index + 1).map((m) => <MiniMonth key={m} year={year} month={m} markers={markers} holidays={holidays} today={today}
        isCurrent={m === currentMonth} isSelected={selectedMonth === m} onSelect={() => onTapMonth(m)} />)}
    </View>
  </View>;
}

function MiniMonth({ year, month, markers, holidays, today, isCurrent, isSelected, onSelect }: {
  year: number; month: number; markers: Map<string, CalendarKind[]>; holidays: Set<string>; today: LocalDate; isCurrent: boolean; isSelected: boolean; onSelect: () => void;
}) {
  const theme = useTheme();
  const days = useMemo(() => calendarDays(year, month), [year, month]);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${formatMonthShort(month)}, ${days.filter((d) => d && markers.get(d)?.length).length} días con registro${isSelected ? ', seleccionado, toca de nuevo para abrir' : ''}`} accessibilityState={{ selected: isSelected }} onPress={onSelect}
    style={[styles.mini, { backgroundColor: theme.backgroundElement, borderColor: isSelected ? theme.primary : isCurrent ? theme.holiday : 'transparent', borderWidth: isSelected || isCurrent ? 2 : 0 }]}>
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
  zoom: { flex: 1, gap: 6 },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }, arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, chevron: { fontSize: 30, lineHeight: 34 },
  titleTap: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  week: { flexDirection: 'row', minHeight: 24 }, grid: { flex: 1, maxHeight: 560, gap: 4 }, weekRow: { flex: 1, flexDirection: 'row', minHeight: 52, gap: 4 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' }, day: { minHeight: 52, borderRadius: 10 }, dayNumber: { fontSize: 17, lineHeight: 22 }, marks: { position: 'absolute', top: 3, right: 3, flexDirection: 'row', gap: 2 }, mark: { paddingHorizontal: 3, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, dot: { width: 12, height: 12, borderRadius: 3 },
  yearGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' },
  yearCell: { width: '31%', flexGrow: 1, minHeight: 64, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  popover: { position: 'absolute', borderRadius: 16, borderWidth: 1, padding: 14, gap: 8, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  popActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionButton: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, flex: 1 },
  trashButton: { flex: 0, borderWidth: 1.5, minWidth: 52 },
  mini: { width: '31%', flexGrow: 1, borderRadius: 10, padding: 4, gap: 2 },
  miniName: { fontWeight: '600' },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  miniCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 3 },
  miniDay: { fontSize: 8, lineHeight: 10 },
  miniDot: { position: 'absolute', bottom: 1, right: 1, width: 4, height: 4, borderRadius: 2 },
});
