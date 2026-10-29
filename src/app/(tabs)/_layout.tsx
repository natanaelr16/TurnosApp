import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** Tabs JS con animación 'shift': la página desliza hacia el lado del botón tocado. */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Calendario', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color as string} /> }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial', tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color as string} /> }} />
      <Tabs.Screen name="resumen" options={{ title: 'Resumen', tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color as string} /> }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color as string} /> }} />
    </Tabs>
  );
}
