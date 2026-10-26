import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { DATABASE_NAME } from '@/data/db';
import { migrateDbIfNeeded } from '@/data/migrations';
import { AppDataProvider, useAppData } from '@/hooks/use-app-data';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
        <AppDataProvider>
          <RootNavigator />
        </AppDataProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}

/** Sin onboarding completo solo se puede ver la configuración inicial (PRD F0, D-010). */
function RootNavigator() {
  const { data } = useAppData();
  const onboarded = Boolean(data.settings.onboardingCompletedAt);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="registro" options={{ presentation: 'modal', gestureEnabled: false }} />
        <Stack.Screen name="plantillas" options={{ presentation: 'modal' }} />
        <Stack.Screen name="detalle" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
