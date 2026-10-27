import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { DateTimeField, TextField } from '@/components/record-fields';
import { Choice } from '@/components/settings-fields';
import { ShiftBreakdown } from '@/components/shift-breakdown';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, Screen, ValueRow } from '@/components/ui';
import { newId } from '@/data/repository';
import { DEFAULT_TEMPLATES } from '@/domain/defaults';
import { applyTemplate, isLocalDate, validateRecords } from '@/domain/records';
import { computeShifts } from '@/domain/shift-calc';
import type { Novelty, Shift } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { useTheme } from '@/hooks/use-theme';
import { formatCOP, formatMinutes, formatShortDate, formatTime, todayLocal } from '@/lib/format';
import { fieldsFromDraft, NOVELTY_LABELS, WARNING_LABELS, type FieldDraft } from '@/lib/record-form';

/** Turnos programados frecuentes de 8 h (D-025); la hora de fin puede cruzar medianoche. */
const QUICK_SHIFTS = [
  { start: '06:00', end: '14:00' }, { start: '14:00', end: '21:00' },
  { start: '14:00', end: '22:00' }, { start: '21:00', end: '06:00' }, { start: '22:00', end: '06:00' },
];

export default function RecordScreen() {
  const params = useLocalSearchParams<{ id?: string; type?: string; date?: string }>();
  const { data, saveShift, removeShift, saveNovelty, removeNovelty } = useAppData();
  const originalShift = params.type !== 'novelty' ? data.shifts.find((s) => s.id === params.id) : undefined;
  const originalNovelty = params.type === 'novelty' ? data.novelties.find((n) => n.id === params.id) : undefined;
  const [id] = useState(() => params.id ?? newId());
  const initialDate = typeof params.date === 'string' && isLocalDate(params.date) ? params.date : todayLocal();
  const [type, setType] = useState<'shift' | 'novelty'>(originalNovelty || params.type === 'novelty' ? 'novelty' : 'shift');
  const [start, setStart] = useState(originalShift?.start ?? `${originalNovelty?.date ?? initialDate}T06:00`);
  const [end, setEnd] = useState(originalShift?.end ?? `${initialDate}T18:00`);
  const [kind, setKind] = useState<Novelty['kind']>(originalNovelty?.kind ?? 'rest');
  const [note, setNote] = useState(originalShift?.note ?? originalNovelty?.note ?? '');
  const [fields, setFields] = useState<FieldDraft[]>(() => (originalShift?.fields ?? []).map((f) => ({ id: newId(), name: f.name, value: String(f.value), type: typeof f.value === 'number' ? 'number' : 'text' })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flying, setFlying] = useState(false);
  const use12 = data.settings.timeFormat === '12h';
  const theme = useTheme();
  const [fly] = useState(() => new Animated.Value(0));
  const lock = useRef(false);
  const leave = useCallback(() => router.canGoBack() ? router.back() : router.replace('/'), []);
  const snapshot = useMemo(() => JSON.stringify({ type, start, end, kind, note, fields: fields.map((field) => ({ name: field.name, value: field.value, type: field.type })) }), [type, start, end, kind, note, fields]);
  const [initialSnapshot] = useState(snapshot);
  const changed = initialSnapshot !== snapshot;
  const cancel = useCallback(() => {
    if (busy) return;
    if (!changed) { leave(); return; }
    Alert.alert('Salir sin guardar', 'Los cambios de esta pantalla no se guardarán.', [{ text: 'Seguir editando', style: 'cancel' }, { text: 'Salir', onPress: leave }]);
  }, [busy, changed, leave]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { cancel(); return true; });
    return () => subscription.remove();
  }, [cancel]));
  const draftShift: Shift = useMemo(() => ({ id, start, end, ...(note.trim() ? { note: note.trim() } : {}) }), [id, start, end, note]);
  const candidates = useMemo(() => [...data.shifts.filter((s) => s.id !== id), draftShift], [data.shifts, id, draftShift]);
  const validationErrors = useMemo(() => type === 'shift' ? validateRecords(candidates, data.novelties) : [], [type, candidates, data.novelties]);
  const result = useMemo(() => type === 'shift' && !validationErrors.length
    ? computeShifts(candidates, data.settings).find((r) => r.shift.id === id) : undefined, [type, candidates, validationErrors, data.settings, id]);
  const templates = [...DEFAULT_TEMPLATES, ...data.templates.filter((t) => !DEFAULT_TEMPLATES.some((base) => base.startTime === t.startTime && base.durationMinutes === t.durationMinutes))];
  const [customTimes, setCustomTimes] = useState(false);
  const [showNote, setShowNote] = useState(Boolean(note));
  const changeField = (fieldId: string, patch: Partial<FieldDraft>) => setFields(fields.map((f) => f.id === fieldId ? { ...f, ...patch } : f));

  if (params.id && !originalShift && !originalNovelty) return <Screen title="Registro no disponible"><EmptyState title="No se encontró el registro" message="Puede haberse eliminado. Vuelve a tus registros." action={{ label: 'Volver', onPress: leave }} /></Screen>;

  const save = async () => {
    if (lock.current) return;
    Keyboard.dismiss(); setError('');
    lock.current = true; setBusy(true);
    try {
      if (type === 'shift') {
        const values = fieldsFromDraft(fields);
        await saveShift({ ...draftShift, ...(values.length ? { fields: values } : {}) });
      } else {
        await saveNovelty({ id, date: start.slice(0, 10), kind, ...(note.trim() ? { note: note.trim() } : {}) });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFlying(true);
      Animated.timing(fly, { toValue: 1, duration: 430, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => leave());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar. Intenta de nuevo.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const confirmDelete = () => Alert.alert('Eliminar registro', 'Este registro se eliminará del teléfono. No se puede deshacer.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      if (lock.current) return;
      lock.current = true; setBusy(true);
      try { if (type === 'shift') await removeShift(id); else await removeNovelty(id); leave(); }
      catch { setError('No se pudo eliminar. Intenta de nuevo.'); }
      finally { lock.current = false; setBusy(false); }
    } },
  ]);
  const addField = (name = '') => setFields([...fields, { id: newId(), name, value: '', type: 'text' }]);
  return <Screen title={params.id ? 'Editar registro' : 'Nuevo registro'} subtitle={`${formatShortDate(start.slice(0, 10))} · ${start.slice(0, 4)}`} footer={<>
    {error ? <ThemedText accessibilityRole="alert" themeColor="danger">{error}</ThemedText> : null}
    <Button label={busy ? 'Guardando…' : 'Guardar registro'} onPress={save} disabled={busy} />
    <Button label="Cancelar" variant="secondary" disabled={busy} onPress={cancel} />
  </>}>
    {!params.id ? <Card title="¿Qué vas a registrar?">
      <Choice label="Turno trabajado" selected={type === 'shift'} onPress={() => { setType('shift'); setError(''); }} disabled={busy} />
      <Choice label="Descanso o novedad" selected={type === 'novelty'} onPress={() => { setType('novelty'); setError(''); }} disabled={busy} />
    </Card> : null}
    {type === 'shift' ? <>
      <Card title="Elige tu turno">
        {templates.map((template) => {
          const values = applyTemplate(start.slice(0, 10), template);
          return <Choice key={template.id} label={template.id === 'tpl-dia' ? `Día · ${formatTime('06:00', use12)}–${formatTime('18:00', use12)}` : template.id === 'tpl-noche' ? `Noche · ${formatTime('18:00', use12)}–${formatTime('06:00', use12)} del día siguiente` : template.name} selected={start === values.start && end === values.end} disabled={busy} onPress={() => {
            setStart(values.start); setEnd(values.end); setCustomTimes(false); setError('');
          }} />;
        })}
        <ThemedText type="smallBold">Turnos programados</ThemedText>
        <View style={styles.chips}>
          {QUICK_SHIFTS.map((quick) => {
            const durationMinutes = ((24 + Number(quick.end.slice(0, 2)) - Number(quick.start.slice(0, 2))) % 24) * 60;
            const values = applyTemplate(start.slice(0, 10), { id: 'quick', name: 'Rápido', startTime: quick.start, durationMinutes });
            const label = `${formatTime(quick.start, use12)}–${formatTime(quick.end, use12)}`;
            return <Pressable key={label} accessibilityRole="button" accessibilityLabel={`Turno de ${label}`} accessibilityState={{ selected: start === values.start && end === values.end, disabled: busy }} disabled={busy}
              onPress={() => { setStart(values.start); setEnd(values.end); setError(''); }}
              style={[styles.chip, { borderColor: start === values.start && end === values.end ? theme.primary : theme.border, backgroundColor: start === values.start && end === values.end ? theme.backgroundSelected : theme.backgroundElement }]}>
              <ThemedText type="smallBold">{label}</ThemedText>
            </Pressable>;
          })}
        </View>
        <ThemedText type="small">{formatShortDate(start.slice(0, 10))} · {formatTime(start, use12)} → {formatShortDate(end.slice(0, 10))} · {formatTime(end, use12)}</ThemedText>
        {validationErrors.length ? <ThemedText accessibilityRole="alert" themeColor="danger">{validationErrors[0]}</ThemedText> : null}
        <Button label={customTimes ? 'Ocultar horario especial' : 'Necesito un horario diferente'} variant="secondary" disabled={busy} onPress={() => setCustomTimes(!customTimes)} />
        {customTimes ? <>
          <DateTimeField label="Entrada" value={start} onChange={setStart} disabled={busy} />
          <DateTimeField label="Salida" value={end} onChange={setEnd} disabled={busy} />
          <Button label="Gestionar plantillas" variant="secondary" disabled={busy} onPress={() => router.push('/plantillas')} />
        </> : null}
      </Card>
      {fields.map((field, index) => <Card key={field.id} title={`Dato adicional ${index + 1}`}>
        <TextField label="Nombre" placeholder="Ej.: Observaciones" value={field.name} onChange={(name) => changeField(field.id, { name })} maxLength={80} disabled={busy} />
        <TextField label={field.name ? `Valor de ${field.name}` : 'Valor'} value={field.value} onChange={(value) => changeField(field.id, { value, type: 'text' })} maxLength={500} disabled={busy} />
        <Button label={`Quitar dato ${index + 1}`} variant="secondary" disabled={busy} onPress={() => setFields(fields.filter((f) => f.id !== field.id))} />
      </Card>)}
      <Button label="Añadir dato adicional" variant="secondary" disabled={busy || fields.length >= 20} onPress={() => addField()} />
      {result ? <Card title="Vista previa del turno">
        <ValueRow label="Duración" value={formatMinutes(result.totalMinutes)} />
        <ValueRow label="Horas extra" value={formatMinutes(result.extraMinutes)} />
        <ValueRow label="Recargos + extras" value={formatCOP(result.total)} />
        <ThemedText type="caption">Adicional al básico; no es la liquidación neta del periodo.</ThemedText>
        <ShiftBreakdown result={result} />
        {result.warnings.map((warning) => <ThemedText key={warning} accessibilityRole="alert" themeColor="danger">{WARNING_LABELS[warning] ?? warning}</ThemedText>)}
      </Card> : null}
    </> : <Card title="Novedad de jornada completa">
      <DateTimeField label="Fecha de la jornada" value={start} onChange={setStart} dateOnly disabled={busy} />
      {(Object.keys(NOVELTY_LABELS) as Novelty['kind'][]).map((key) => <Choice key={key} label={NOVELTY_LABELS[key]} selected={kind === key} onPress={() => setKind(key)} disabled={busy} />)}
      <ThemedText type="small">La fecha corresponde al inicio de la jornada, igual que los turnos nocturnos. No se permiten turno y novedad completa con el mismo inicio.</ThemedText>
      <ThemedText>{kind === 'rest' ? 'El descanso remunerado ya está incluido en el básico: no suma ni resta.' : kind === 'sick' ? 'Tu condición empresarial es 75 %. El ajuste monetario de incapacidad aún no está implementado.' : 'Se guarda la novedad. Los ajustes monetarios por permisos aún no están implementados.'}</ThemedText>
      <ThemedText type="caption">Por ahora se registra una jornada por vez. Los permisos por horas se incorporarán después.</ThemedText>
    </Card>}
    {showNote ? <Card title="Nota opcional"><TextField label="Nota" value={note} onChange={setNote} multiline disabled={busy} /></Card> : <Button label="Añadir nota opcional" variant="secondary" onPress={() => setShowNote(true)} disabled={busy} />}
    {params.id ? <Button label="Eliminar registro" variant="danger" onPress={confirmDelete} disabled={busy} /> : null}
    {flying ? <Animated.View pointerEvents="none" style={[styles.fly, { opacity: fly.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, -320] }) }, { translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }) }, { scale: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) }] }]}>
      <ThemedText type="smallBold">{formatShortDate(start.slice(0, 10))} · guardado</ThemedText>
    </Animated.View> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, borderWidth: 2, borderRadius: 22, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  fly: { position: 'absolute', alignSelf: 'center', top: '42%', backgroundColor: '#DCFCE7', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 22, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
});
