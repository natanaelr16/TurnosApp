/**
 * Colores de TurnosApp (claro/oscuro). Colores semánticos de docs/DISENO.md:
 * diurno = ámbar, nocturno = índigo, dominical/festivo = coral, extra = verde.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111418',
    textSecondary: '#5B6270',
    background: '#F6F7F9',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7EAF0',
    border: '#E2E5EA',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    day: '#B45309',
    night: '#4F46E5',
    holiday: '#D9363E',
    extra: '#15803D',
    danger: '#DC2626',
  },
  dark: {
    text: '#F3F4F6',
    textSecondary: '#A3A9B5',
    background: '#0B0D10',
    backgroundElement: '#16191E',
    backgroundSelected: '#22262D',
    border: '#2A2F37',
    primary: '#60A5FA',
    onPrimary: '#0B0D10',
    day: '#FBBF24',
    night: '#A5B4FC',
    holiday: '#FF7B7B',
    extra: '#4ADE80',
    danger: '#F87171',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { card: 16, button: 12 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
