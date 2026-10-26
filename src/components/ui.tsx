// Componentes base reutilizables: pantalla, tarjeta, fila de valor, botón y estado vacío.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Pantalla con título. `scroll={false}` para pantallas que usan su propia lista (FlatList) o grilla. */
export function Screen({
  title,
  subtitle,
  scroll = true,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  scroll?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const theme = useTheme();
  const header = (
    <View style={styles.header}>
      <ThemedText type="title" accessibilityRole="header" maxFontSizeMultiplier={1.6}>
        {title}
      </ThemedText>
      {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
    </View>
  );
  return (
    <SafeAreaView edges={footer ? ['top', 'bottom'] : ['top']} style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, footer ? { paddingBottom: Spacing.three } : undefined]} contentInsetAdjustmentBehavior="automatic">
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content]}>
            {header}
            {children}
          </View>
        )}
        {footer ? <View style={[styles.content, { paddingBottom: Spacing.two }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {title ? (
        <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header" style={styles.cardTitle}>
          {title.toUpperCase()}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

export function ValueRow({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: string;
  color?: ThemeColor;
  strong?: boolean;
}) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type={strong ? 'smallBold' : 'small'} style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText type="money" themeColor={color} style={[styles.value, strong && styles.strong]} maxFontSizeMultiplier={1.8}>
        {value}
      </ThemedText>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const theme = useTheme();
  const bg = variant === 'primary' ? theme.primary : variant === 'danger' ? theme.danger : theme.backgroundSelected;
  const fg = variant === 'secondary' ? theme.text : theme.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }]}>
      <ThemedText type="smallBold" style={{ color: fg }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <Card>
      <View style={styles.empty}>
        <ThemedText type="subtitle" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
        {action ? <Button label={action.label} onPress={action.onPress} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { flexShrink: 1, flexGrow: 1 },
  value: { flexShrink: 1, maxWidth: '100%', textAlign: 'right' },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  card: { borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two },
  cardTitle: { letterSpacing: 0.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Spacing.two, minHeight: 32 },
  strong: { fontSize: 18 },
  button: {
    minHeight: 48,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  center: { textAlign: 'center' },
});
