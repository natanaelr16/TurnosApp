import { Card, Button, Screen } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/hooks/use-app-data';

/** Temporal: la configuración guiada completa (PRD F0) se construye en la Fase 3. */
export default function OnboardingScreen() {
  const { updateSettings } = useAppData();

  const continueWithSample = () => {
    const now = new Date().toISOString();
    updateSettings({ baseSalary: 3_000_000, onboardingCompletedAt: now, legalNoticeAcceptedAt: now });
  };

  return (
    <Screen title="Bienvenido a TurnosApp" subtitle="Registra tus turnos y conoce lo que ganas">
      <Card>
        <ThemedText>
          Aquí irá la configuración guiada: aviso legal, tu salario base, si recibes auxilio de transporte, periodo de
          pago, jornada y turnos frecuentes. También podrás restaurar un respaldo en PDF.
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          En construcción (Fase 3).
        </ThemedText>
      </Card>
      <Button
        label="Continuar con datos de ejemplo (temporal)"
        onPress={continueWithSample}
        accessibilityHint="Configura un salario de ejemplo de 3.000.000 para explorar la app"
      />
    </Screen>
  );
}
