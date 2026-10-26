import { useMemo, useState } from 'react';

import { PeriodSelector } from '@/components/period-selector';
import { EmptyState, Screen } from '@/components/ui';
import { periodFor } from '@/domain/payroll';
import { recordCoverage } from '@/domain/records';
import { useAppData } from '@/hooks/use-app-data';
import { todayLocal } from '@/lib/format';

export default function SummaryScreen() {
  const { data } = useAppData();
  const [anchor, setAnchor] = useState(todayLocal);
  const period = useMemo(() => periodFor(anchor, data.settings.payPeriod), [anchor, data.settings.payPeriod]);
  const incomplete = recordCoverage(data.shifts, data.novelties, period).missingDates.length > 0;
  return <Screen title="Resumen" subtitle="Tu pago estimado">
    <PeriodSelector period={period} type={data.settings.payPeriod} onDateChange={setAnchor} />
    {incomplete ? <EmptyState title="Periodo incompleto" message="No se puede calcular la estimación todavía." />
      : <EmptyState title="Estimación no disponible" message="La liquidación con novedades y descuentos mensuales aún está en preparación." />}
  </Screen>;
}
