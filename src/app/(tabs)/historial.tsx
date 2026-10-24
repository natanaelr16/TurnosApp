import { EmptyState, Screen } from '@/components/ui';

export default function HistoryScreen() {
  return (
    <Screen title="Historial" subtitle="Tus turnos por quincena o mes">
      <EmptyState
        title="Sin turnos todavía"
        message="Cuando registres turnos, aquí podrás revisarlos con su desglose de horas y valores. (Fase 3)"
      />
    </Screen>
  );
}
