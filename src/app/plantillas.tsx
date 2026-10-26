import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { DateTimeField, TextField } from '@/components/record-fields';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen } from '@/components/ui';
import { newId } from '@/data/repository';
import { validateTemplate } from '@/domain/records';
import type { ShiftTemplate } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { formatMinutes, todayLocal } from '@/lib/format';

export default function TemplatesScreen() {
  const { data, updateTemplates } = useAppData();
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [duration, setDuration] = useState('12');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const clear = () => { setId(null); setName(''); setStartTime('06:00'); setDuration('12'); setError(''); };
  const persist = async (templates: ShiftTemplate[]) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await updateTemplates(templates); clear(); }
    catch { setError('No se pudieron guardar las plantillas. Intenta de nuevo.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const save = () => {
    if (!/^\d+(?:[.,]\d+)?$/.test(duration)) { setError('Ingresa una duración en horas, por ejemplo 12 o 4,5.'); return; }
    const template: ShiftTemplate = { id: id ?? newId(), name: name.trim(), startTime, durationMinutes: Number(duration.replace(',', '.')) * 60 };
    const errors = validateTemplate(template);
    if (errors.length) { setError(errors[0]); return; }
    if (data.templates.some((t) => t.id !== id && t.name.toLocaleLowerCase('es') === template.name.toLocaleLowerCase('es'))) { setError('Ya tienes una plantilla con ese nombre.'); return; }
    persist(id ? data.templates.map((t) => t.id === id ? template : t) : [...data.templates, template]);
  };
  return <Screen title="Plantillas de turno" subtitle="Solo guardan hora de entrada y duración; no copian datos de la operación" footer={<Button label="Volver" variant="secondary" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />}>
    <Card title={id ? 'Editar plantilla' : 'Crear plantilla'}>
      <TextField label="Nombre de la plantilla" value={name} onChange={setName} maxLength={80} disabled={busy} />
      <DateTimeField label="Hora de entrada" value={`${todayLocal()}T${startTime}`} onChange={(value) => setStartTime(value.slice(11))} timeOnly disabled={busy} />
      <TextField label="Duración en horas (máximo 24)" value={duration} onChange={setDuration} keyboardType="decimal-pad" maxLength={8} disabled={busy} />
      {error ? <ThemedText accessibilityRole="alert" themeColor="danger">{error}</ThemedText> : null}
      <Button label={busy ? 'Guardando…' : id ? 'Guardar cambios de plantilla' : 'Crear plantilla'} onPress={save} disabled={busy} />
      {id ? <Button label="Cancelar edición" variant="secondary" onPress={clear} disabled={busy} /> : null}
    </Card>
    {data.templates.map((template) => <Card key={template.id} title={template.name}>
      <ThemedText>{template.startTime} · {formatMinutes(template.durationMinutes)}</ThemedText>
      <Button label={`Editar ${template.name}`} variant="secondary" disabled={busy} onPress={() => { setId(template.id); setName(template.name); setStartTime(template.startTime); setDuration(String(template.durationMinutes / 60)); setError(''); }} />
      <Button label={`Eliminar ${template.name}`} variant="danger" disabled={busy} onPress={() => Alert.alert('Eliminar plantilla', 'No afecta los turnos que ya registraste.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => persist(data.templates.filter((t) => t.id !== template.id)) }])} />
    </Card>)}
    {!data.templates.length ? <ThemedText>Aún no tienes plantillas. Crea la primera arriba.</ThemedText> : null}
  </Screen>;
}
