import { useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';

import { Choice, SettingsFields, type SettingsSection } from '@/components/settings-fields';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, ValueRow } from '@/components/ui';
import { useAppData } from '@/hooks/use-app-data';
import { useTheme } from '@/hooks/use-theme';
import { formatCOP, todayLocal } from '@/lib/format';
import { draftFromSettings, settingsFromDraft, validateSettingsDraft, type DraftErrors } from '@/lib/settings-form';

const TITLES = ['Bienvenido a TurnosApp', 'Tu salario base', 'Auxilio de transporte', 'Periodo de pago', 'Tu jornada', 'Turnos frecuentes', 'Todo listo'];
const SECTIONS: Partial<Record<number, SettingsSection>> = { 1: 'salary', 2: 'allowance', 3: 'period', 4: 'schedule' };
const STEP_FIELDS = { 1: ['salary'], 2: ['allowanceEnabled', 'allowance'], 3: [], 4: ['daily', 'weekly'] } as const;

/** Temporal: la configuración guiada completa (PRD F0) se construye en la Fase 3. */
export default function OnboardingScreen() {
  const { data, completeOnboarding } = useAppData();
  const theme = useTheme();
  const date = todayLocal();
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...draftFromSettings(data.settings, date), allowanceEnabled: null as boolean | null }));
  const [selected, setSelected] = useState(data.templates.map((template) => template.id));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const [editing, setEditing] = useState(false);
  const go = (next: number) => { Keyboard.dismiss(); setErrors({}); setStep(next); };
  const edit = (next: number) => { setEditing(true); go(next); };
  const next = () => {
    const all = validateSettingsDraft(draft);
    const keys = STEP_FIELDS[step as keyof typeof STEP_FIELDS] ?? [];
    const current = Object.fromEntries(keys.filter((key) => all[key]).map((key) => [key, all[key]]));
    setErrors(current);
    if (Object.keys(current).length) return;
    go(editing ? 6 : step + 1);
    setEditing(false);
  };
  const finish = async () => {
    if (lock.current) return;
    const all = validateSettingsDraft(draft);
    if (!accepted) { go(0); return; }
    if (Object.keys(all).length) {
      const first = all.salary ? 1 : all.allowance || all.allowanceEnabled ? 2 : 4;
      setStep(first); setErrors(all); return;
    }
    lock.current = true; setSaving(true);
    try {
      const now = new Date().toISOString();
      await completeOnboarding({ ...settingsFromDraft(draft, data.settings), onboardingCompletedAt: now, legalNoticeAcceptedAt: now }, data.templates.filter((template) => selected.includes(template.id)));
    } catch {
      Alert.alert('No se pudo guardar', 'Tu configuración sigue aquí. Intenta de nuevo.');
    } finally { lock.current = false; setSaving(false); }
  };
  const section = SECTIONS[step];
  const summary = (label: string, value: string, target: number) => <Card key={label}><ValueRow label={label} value={value} /><Button variant="secondary" label={`Editar ${label.toLowerCase()}`} onPress={() => edit(target)} disabled={saving} /></Card>;
  return (
    <Screen key={step} title={TITLES[step]} subtitle={`Paso ${step + 1} de 7`} footer={<>
      {step > 0 ? <Button variant="secondary" label="Atrás" onPress={() => go(step - 1)} disabled={saving} /> : null}
      <Button label={saving ? 'Guardando…' : step === 6 ? 'Empezar' : editing ? 'Volver al resumen' : 'Continuar'} onPress={step === 6 ? finish : next} disabled={saving || (step === 0 && !accepted)} />
      {step >= 3 && step <= 5 && !editing ? <Button variant="secondary" label="Omitir y usar valores predeterminados" onPress={() => {
        const defaults = draftFromSettings(data.settings, date);
        if (step === 3) setDraft({ ...draft, payPeriod: defaults.payPeriod });
        if (step === 4) setDraft({ ...draft, daily: defaults.daily, weekly: defaults.weekly, holidayPay: defaults.holidayPay });
        if (step === 5) setSelected(data.templates.map((template) => template.id));
        go(step + 1);
      }} /> : null}
    </>}>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 7, now: step + 1 }} accessibilityLabel="Progreso de configuración" style={{ height: 6, borderRadius: 3, backgroundColor: theme.border }}>
        <View style={{ width: `${((step + 1) / 7) * 100}%`, height: 6, borderRadius: 3, backgroundColor: theme.primary }} />
      </View>
      {step === 0 ? <Card>
        <ThemedText>Registra tus turnos y consulta horas, recargos, extras y pago estimado según la legislación colombiana.</ThemedText>
        <ThemedText>Los valores son aproximados; pueden diferir de tu liquidación oficial. Esta app no reemplaza asesoría laboral ni la nómina de tu empresa.</ThemedText>
        <ThemedText>Tus datos se guardan únicamente en este teléfono, sin cuentas ni servidor.</ThemedText>
        <Choice multiple label="Entiendo y acepto que los valores son estimados" selected={accepted} onPress={() => setAccepted(!accepted)} />
        <Button variant="secondary" label="Ya tengo un respaldo (PDF) — próximamente" disabled onPress={() => {}} />
        <ThemedText type="caption">La restauración desde PDF estará disponible en la Fase 3.6.</ThemedText>
      </Card> : null}
      {section ? <SettingsFields section={section} draft={draft} onChange={setDraft} errors={errors} date={date} disabled={saving} /> : null}
      {step === 5 ? <Card title="Plantillas rápidas">
        <ThemedText>Puedes marcar ambas, una o ninguna. Podrás crear otras después.</ThemedText>
        {data.templates.map((template) => <Choice multiple key={template.id} label={template.name} selected={selected.includes(template.id)} onPress={() => setSelected(selected.includes(template.id) ? selected.filter((id) => id !== template.id) : [...selected, template.id])} />)}
      </Card> : null}
      {step === 6 ? <>
        {summary('Salario mensual', formatCOP(Number(draft.salary)), 1)}
        {summary('Auxilio de transporte', draft.allowanceEnabled ? formatCOP(Number(draft.allowance)) : 'No recibo', 2)}
        {summary('Periodo de pago', draft.payPeriod === 'quincenal' ? 'Quincenal' : 'Mensual', 3)}
        {summary('Jornada', `${draft.daily} h/día · ${draft.weekly} h/semana`, 4)}
        <ValueRow label="Domingo/festivo" value={draft.holidayPay === 'completa' ? 'Hora + recargo' : 'Solo recargo'} />
        {summary('Turnos frecuentes', selected.length ? data.templates.filter((template) => selected.includes(template.id)).map((template) => template.name).join(', ') : 'Sin plantillas', 5)}
        <Button label="Revisar aviso legal" variant="secondary" onPress={() => edit(0)} disabled={saving} />
      </> : null}
    </Screen>
  );
}
