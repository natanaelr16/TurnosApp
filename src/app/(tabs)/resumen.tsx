import { Card, Screen, ValueRow } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { hasYearlyParams } from '@/domain/legal-params';
import { computePeriod, periodFor } from '@/domain/payroll';
import { computeShifts } from '@/domain/shift-calc';
import { useAppData } from '@/hooks/use-app-data';
import { formatCOP, formatPeriod, todayLocal } from '@/lib/format';

export default function SummaryScreen() {
  const { data } = useAppData();
  const { settings } = data;
  const period = periodFor(todayLocal(), settings.payPeriod);
  const p = computePeriod(computeShifts(data.shifts, settings), settings, period);

  return (
    <Screen title="Resumen" subtitle={`${settings.payPeriod === 'quincenal' ? 'Quincena' : 'Mes'} · ${formatPeriod(period.start, period.end)}`}>
      <Card title="Devengado">
        <ValueRow label="Salario básico" value={formatCOP(p.basePay)} />
        <ValueRow label={`Recargos (${p.shiftCount} turnos)`} value={formatCOP(p.surcharges)} color="night" />
        <ValueRow label="Horas extra" value={formatCOP(p.extras)} color="extra" />
        {settings.transportAllowance.enabled ? (
          <ValueRow label="Auxilio de transporte" value={formatCOP(p.transportAllowance)} />
        ) : null}
        <ValueRow label="Total devengado" value={formatCOP(p.gross)} strong />
      </Card>

      <Card title="Descuentos de ley">
        <ValueRow label="Salud (4 %)" value={formatCOP(-p.health)} />
        <ValueRow label="Pensión (4 %)" value={formatCOP(-p.pension)} />
        {p.solidarityFund > 0 ? <ValueRow label="Fondo de Solidaridad Pensional*" value={formatCOP(-p.solidarityFund)} /> : null}
        {p.withholding > 0 ? <ValueRow label="Retención en la fuente*" value={formatCOP(-p.withholding)} /> : null}
      </Card>

      <Card>
        <ValueRow label="Neto estimado" value={formatCOP(p.net)} strong color="primary" />
      </Card>

      <ThemedText type="caption" themeColor="textSecondary">
        Valores estimados con fines informativos según la normativa colombiana vigente. Pueden diferir de la
        liquidación oficial de tu empleador. *Aproximados.
        {hasYearlyParams(Number(period.start.slice(0, 4)))
          ? ''
          : ' Aún no se han cargado los parámetros legales de este año; se usan los del último año conocido.'}
      </ThemedText>
    </Screen>
  );
}
