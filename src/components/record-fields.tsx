import NativeDateTimePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate } from '@/lib/format';
import { localFromPicker, pickerFromLocal } from '@/lib/record-form';

export function TextField({ label, value, onChange, maxLength = 1000, keyboardType = 'default', multiline = false, disabled = false, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; maxLength?: number; keyboardType?: KeyboardTypeOptions; multiline?: boolean; disabled?: boolean; placeholder?: string;
}) {
  const theme = useTheme();
  return <View style={styles.field}>
    <ThemedText type="smallBold">{label}</ThemedText>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} maxLength={maxLength} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={theme.textSecondary}
      multiline={multiline} editable={!disabled} autoCapitalize="sentences"
      style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.textSecondary }]} />
  </View>;
}

export function DateTimeField({ label, value, onChange, dateOnly = false, timeOnly = false, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; dateOnly?: boolean; timeOnly?: boolean; disabled?: boolean;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const chosen = (date: Date) => {
    if (disabled) return;
    const next = localFromPicker(date);
    onChange(mode === 'date' ? `${next.slice(0, 10)}T${value.slice(11)}` : `${value.slice(0, 10)}T${next.slice(11)}`);
    if (Platform.OS === 'android') setMode(null);
  };
  return <View style={styles.field}>
    <ThemedText type="smallBold">{label}</ThemedText>
    {!timeOnly ? <Button variant="secondary" label={`${label}: ${formatShortDate(value.slice(0, 10))} · cambiar fecha`} onPress={() => setMode(mode === 'date' ? null : 'date')} disabled={disabled} /> : null}
    {!dateOnly ? <Button variant="secondary" label={`${label}: ${value.slice(11)} · cambiar hora`} onPress={() => setMode(mode === 'time' ? null : 'time')} disabled={disabled} /> : null}
    {mode && !disabled ? <>
      <NativeDateTimePicker value={pickerFromLocal(value)} mode={mode} is24Hour locale="es_CO" accentColor={theme.primary}
        display={Platform.OS === 'ios' ? 'compact' : 'default'} presentation="dialog"
        onValueChange={(_event, date) => chosen(date)} onDismiss={() => setMode(null)} />
      {Platform.OS === 'ios' ? <Button variant="secondary" label="Listo" onPress={() => setMode(null)} /> : null}
    </> : null}
  </View>;
}

const styles = StyleSheet.create({ field: { gap: 8 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 17 } });
