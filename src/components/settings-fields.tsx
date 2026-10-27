import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ValueRow } from '@/components/ui';
import { DEFAULT_SETTINGS } from '@/domain/defaults';
import { hasYearlyParams, legalRatesOn, yearlyParams } from '@/domain/legal-params';
import { effectiveRates } from '@/domain/shift-calc';
import { useTheme } from '@/hooks/use-theme';
import { formatCOP } from '@/lib/format';
import { RATE_FIELDS, settingsFromDraft, type DraftErrors, type SettingsDraft } from '@/lib/settings-form';

export function Choice({ label, selected, onPress, disabled = false, multiple = false }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; multiple?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityLabel={label} accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress}
      style={[styles.choice, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement }]}>
      <ThemedText>{selected ? '● ' : '○ '}{label}</ThemedText>
    </Pressable>
  );
}

export function NumberField({ label, value, onChange, error, placeholder, money = false, disabled = false }: {
  label: string; value: string; onChange: (text: string) => void; error?: string; placeholder?: string; money?: boolean; disabled?: boolean;
}) {
  const theme = useTheme();
  const displayed = money && value ? `$ ${value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : value;
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput accessibilityLabel={label} accessibilityHint={error ?? placeholder} value={displayed}
        onChangeText={(text) => onChange(money ? text.replace(/\D/g, '') : text)}
        editable={!disabled} keyboardType={money ? 'number-pad' : 'decimal-pad'} placeholder={placeholder} placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: error ? theme.danger : theme.textSecondary, backgroundColor: theme.backgroundElement }]} />
      {error ? <ThemedText accessibilityRole="alert" themeColor="danger">{error}</ThemedText> : null}
    </View>
  );
}

const RATE_LABELS = { nightPct: 'Recargo nocturno (%)', sundayPct: 'Recargo dominical/festivo (%)', extraDayPct: 'Extra diurna (%)', extraNightPct: 'Extra nocturna (%)' };
export type SettingsSection = 'salary' | 'allowance' | 'period' | 'schedule' | 'rates';

export function SettingsFields({ section, draft, onChange, errors = {}, date, disabled = false }: {
  section: SettingsSection; draft: SettingsDraft; onChange: (draft: SettingsDraft) => void; errors?: DraftErrors; date: string; disabled?: boolean;
}) {
  const [advanced, setAdvanced] = useState(false);
  const rates = legalRatesOn(date);
  const yearly = yearlyParams(Number(date.slice(0, 4)));
  const update = <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) => onChange({ ...draft, [key]: value });
  const field = (key: 'salary' | 'allowance' | 'daily' | 'weekly' | 'divisor' | typeof RATE_FIELDS[number], label: string, placeholder?: string, money = false) => (
    <NumberField key={key} label={label} value={draft[key]} onChange={(value) => update(key, value)} error={errors[key]} placeholder={placeholder} money={money} disabled={disabled} />
  );
  const effective = effectiveRates(date, settingsFromDraft(draft, DEFAULT_SETTINGS));
  const hour = effective.divisor;
  return (
    <Card>
      {!hasYearlyParams(Number(date.slice(0, 4))) && (section === 'salary' || section === 'allowance') ?
        <ThemedText accessibilityRole="alert">No hay parámetros cargados para este año. Se usan los últimos conocidos; revisa los valores.</ThemedText> : null}
      {section === 'salary' ? <>
        {field('salary', 'Salario base mensual', 'Solo pesos enteros', true)}
        <ValueRow label="Valor hora ordinaria" value={Number(draft.salary) > 0 && hour > 0 ? formatCOP(Number(draft.salary) / hour) : '—'} />
        <ThemedText type="caption">El valor hora usa el divisor {hour > 0 ? hour : rates.divisor}. Puedes cambiarlo en Ajustes.</ThemedText>
      </> : null}
      {section === 'allowance' ? <>
        <Choice label="Sí, recibo auxilio de transporte" selected={draft.allowanceEnabled === true} onPress={() => update('allowanceEnabled', true)} disabled={disabled} />
        <Choice label="No recibo auxilio de transporte" selected={draft.allowanceEnabled === false} onPress={() => update('allowanceEnabled', false)} disabled={disabled} />
        {errors.allowanceEnabled ? <ThemedText themeColor="danger" accessibilityRole="alert">{errors.allowanceEnabled}</ThemedText> : null}
        <ThemedText type="small" themeColor="textSecondary">{Number(draft.salary) <= 2 * yearly.smmlv ? 'Por ley normalmente tienes derecho. Tú decides si tu empresa lo paga.' : 'Por ley normalmente no aplica, pero puedes activarlo si tu empresa lo paga.'}</ThemedText>
        {draft.allowanceEnabled ? field('allowance', 'Auxilio mensual', `Valor de referencia: ${formatCOP(yearly.transportAllowance)}`, true) : null}
      </> : null}
      {section === 'period' ? <>
        <Choice label="Quincenal" selected={draft.payPeriod === 'quincenal'} onPress={() => update('payPeriod', 'quincenal')} disabled={disabled} />
        <Choice label="Mensual" selected={draft.payPeriod === 'mensual'} onPress={() => update('payPeriod', 'mensual')} disabled={disabled} />
      </> : null}
      {section === 'schedule' ? <>
        {field('daily', 'Horas ordinarias por día')}
        {field('weekly', 'Horas ordinarias por semana')}
        <ThemedText>Formato de hora en toda la app</ThemedText>
        <Choice label="24 horas (18:00)" selected={draft.timeFormat !== '12h'} onPress={() => update('timeFormat', '24h')} disabled={disabled} />
        <Choice label="12 horas (6:00 p. m.)" selected={draft.timeFormat === '12h'} onPress={() => update('timeFormat', '12h')} disabled={disabled} />
        <Button variant="secondary" label={advanced ? 'Ocultar opción dominical/festiva' : 'Opción avanzada: pago dominical/festivo'} onPress={() => setAdvanced(!advanced)} disabled={disabled} />
        {advanced ? <>
          <ThemedText>¿Cómo te pagan las horas normales en domingo o festivo?</ThemedText>
          <Choice label={`Hora completa + recargo (${100 + effective.sundayPct} %)`} selected={draft.holidayPay === 'completa'} onPress={() => update('holidayPay', 'completa')} disabled={disabled} />
          <Choice label={`Solo el recargo (${effective.sundayPct} %), porque me dan otro día de descanso pagado`} selected={draft.holidayPay === 'solo-recargo'} onPress={() => update('holidayPay', 'solo-recargo')} disabled={disabled} />
        </> : null}
      </> : null}
      {section === 'rates' ? <>
        <ThemedText type="small">Deja el campo vacío para usar la ley según la fecha de cada turno. Un valor personalizado se aplicará también al historial.</ThemedText>
        {field('divisor', 'Divisor mensual de horas', `Legal hoy: ${rates.divisor}`)}
        {RATE_FIELDS.map((key) => field(key, RATE_LABELS[key], `Legal hoy: ${rates[key]} %`))}
        <Button label="Restaurar valores de ley" variant="secondary" disabled={disabled} onPress={() => onChange({ ...draft, divisor: '', nightPct: '', sundayPct: '', extraDayPct: '', extraNightPct: '' })} />
      </> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 18, fontVariant: ['tabular-nums'] },
  choice: { minHeight: 48, borderWidth: 2, borderRadius: 12, padding: 12, justifyContent: 'center' },
});
