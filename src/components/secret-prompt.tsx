import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

type Pending = { title: string; message: string; resolve: (v: string | null) => void };

/** Diálogo modal para pedir la contraseña/código de un respaldo (Alert.prompt es solo iOS). */
export function useSecretPrompt() {
  const theme = useTheme();
  const [pending, setPending] = useState<Pending | null>(null);
  const [value, setValue] = useState('');
  const resolveRef = useRef<Pending['resolve'] | null>(null);

  const ask = (title: string, message: string) =>
    new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      setValue('');
      setPending({ title, message, resolve });
    });

  const close = (result: string | null) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setPending(null);
  };

  useEffect(() => () => { resolveRef.current?.(null); }, []);

  const prompt = pending ? (
    <Modal transparent animationType="fade" visible onRequestClose={() => close(null)}>
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} accessibilityViewIsModal>
          <ThemedText type="subtitle" style={s.center}>{pending.title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={s.center}>{pending.message}</ThemedText>
          <TextInput
            style={[s.input, { borderColor: theme.border, color: theme.text }]}
            value={value}
            onChangeText={setValue}
            secureTextEntry
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Contraseña o código de recuperación"
            placeholder="Contraseña o código XXXX-XXXX-XXXX"
            placeholderTextColor={theme.textSecondary}
          />
          <View style={s.row}>
            <Button variant="secondary" label="Cancelar" onPress={() => close(null)} />
            <Button label="Abrir" onPress={() => close(value.trim() || null)} disabled={!value.trim()} />
          </View>
        </View>
      </View>
    </Modal>
  ) : null;

  return { ask, prompt };
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 12 },
  center: { textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
});
