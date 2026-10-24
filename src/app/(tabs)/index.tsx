import { EmptyState, Screen } from '@/components/ui';
import { useAppData } from '@/hooks/use-app-data';
import { formatMonth, todayLocal } from '@/lib/format';

export default function CalendarScreen() {
  const { data } = useAppData();
  const [year, month] = todayLocal().split('-').map(Number);
  return (
    <Screen title="Calendario" subtitle={formatMonth(year, month)}>
      <EmptyState
        title={data.shifts.length ? `${data.shifts.length} turnos registrados` : 'Aún no tienes turnos'}
        message="Aquí verás el mes con tus días de trabajo y podrás registrar turnos con un toque. (Fase 3)"
      />
    </Screen>
  );
}
