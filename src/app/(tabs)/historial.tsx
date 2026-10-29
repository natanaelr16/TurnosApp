import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { PeriodSelector } from '@/components/period-selector';
import { RecordCard, recordDate, type RecordItem } from '@/components/record-card';
import { TextField } from '@/components/record-fields';
import { ThemedText } from '@/components/themed-text';
import { Button, EmptyState, Screen } from '@/components/ui';
import { periodFor } from '@/domain/payroll';
import { computeShifts } from '@/domain/shift-calc';
import type { PayPeriodType } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { usePeriodPdf } from '@/hooks/use-period-pdf';
import { TabSlide } from '@/components/tab-slide';
import { todayLocal } from '@/lib/format';

export default function HistoryScreen() {
  const { data } = useAppData();
  const { exporting, requestExport } = usePeriodPdf();
  const [anchor, setAnchor] = useState(todayLocal);
  const [type, setType] = useState<PayPeriodType>(data.settings.payPeriod);
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const period = periodFor(anchor, type);
  const all: RecordItem[] = useMemo(() => [...data.shifts.map((value) => ({ type: 'shift' as const, value })), ...data.novelties.map((value) => ({ type: 'novelty' as const, value }))], [data.shifts, data.novelties]);
  const periodItems = useMemo(() => all.filter((item) => recordDate(item) >= period.start && recordDate(item) <= period.end)
    .sort((a, b) => recordDate(b).localeCompare(recordDate(a)) || b.value.id.localeCompare(a.value.id)), [all, period.start, period.end]);
  const items = useMemo(() => periodItems.filter((item) => recordDate(item).includes(search.trim())), [periodItems, search]);
  const resultById = useMemo(() => new Map(computeShifts(data.shifts, data.settings).map((result) => [result.shift.id, result])), [data.shifts, data.settings]);
  return <TabSlide route="historial"><Screen title="Historial" subtitle="Tus turnos y novedades por periodo" scroll={false}>
    <FlatList initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} data={items} keyExtractor={(item) => `${item.type}-${item.value.id}`} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        <PeriodSelector period={period} type={type} onDateChange={(date) => { setAnchor(date); setSearch(''); }} onTypeChange={setType} />
        <Button label={exporting ? 'Generando PDF…' : 'Exportar turnos (PDF)'} onPress={() => requestExport(data, period, 'turnos')} disabled={exporting || !periodItems.length} />
        <ThemedText type="caption" themeColor="textSecondary">PDF de acumulados del periodo completo seleccionado, no solo de la búsqueda. La liquidación neta mensual aún está pendiente.</ThemedText>
        <Button label={searchVisible ? 'Cerrar búsqueda' : 'Buscar fecha'} variant="secondary" onPress={() => { setSearchVisible(!searchVisible); setSearch(''); }} />
        {searchVisible ? <TextField label="Filtrar por fecha (AAAA-MM-DD)" value={search} onChange={setSearch} maxLength={10} /> : null}
        {searchVisible && search ? <Button label="Limpiar búsqueda" variant="secondary" onPress={() => setSearch('')} /> : null}
      </View>}
      renderItem={({ item }) => <RecordCard item={item} result={item.type === 'shift' ? resultById.get(item.value.id) : undefined} />}
      ListEmptyComponent={<EmptyState title="Sin registros en este periodo" message="Prueba otro periodo o ajusta la búsqueda." />} />
  </Screen></TabSlide>;
}
