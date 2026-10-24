import { Alert } from 'react-native';

import { Button, Card, Screen, ValueRow } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { effectiveRates, factorTable } from '@/domain/shift-calc';
import type { MinuteCategory } from '@/domain/types';
import { useAppData } from '@/hooks/use-app-data';
import { formatCOP, formatFactor, todayLocal } from '@/lib/format';

const FACTOR_LABELS: [MinuteCategory, string][] = [
  ['extraDay', 'Hora extra diurna'],
  ['ordinaryNight', 'Recargo nocturno'],
  ['extraNight', 'Hora extra nocturna'],
  ['ordinaryDayHoliday', 'Dominical/festivo'],
  ['extraDayHoliday', 'Hora extra diurna festiva'],
  ['ordinaryNightHoliday', 'Recargo nocturno festivo'],
  ['extraNightHoliday', 'Hora extra nocturna festiva'],
];

export default function SettingsScreen() {
  const { data, resetAll } = useAppData();
  const { settings } = data;
  const today = todayLocal();
  const factors = factorTable(today, settings);
  const hourValue = settings.baseSalary / effectiveRates(today, settings).divisor;

  const confirmReset = () =>
    Alert.alert('Borrar todos mis datos', 'Se eliminarán tu configuración y todos tus turnos de este teléfono. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => resetAll() },
    ]);

  return (
    <Screen title="Ajustes" subtitle="Tus condiciones salariales y laborales">
      <Card title="Salario">
        <ValueRow label="Salario base mensual" value={formatCOP(settings.baseSalary)} />
        <ValueRow label="Valor hora ordinaria" value={formatCOP(hourValue)} />
        <ValueRow label="Auxilio de transporte" value={settings.transportAllowance.enabled ? 'Sí' : 'No aplica'} />
        <ValueRow label="Periodo de pago" value={settings.payPeriod === 'quincenal' ? 'Quincenal' : 'Mensual'} />
      </Card>

      <Card title="Jornada">
        <ValueRow label="Horas ordinarias por día" value={`${settings.dailyLimitHours} h`} />
        <ValueRow label="Horas ordinarias por semana" value={`${settings.weeklyLimitHours} h`} />
        <ValueRow
          label="Domingo/festivo ordinario"
          value={settings.holidayOrdinaryPay === 'solo-recargo' ? 'Solo recargo' : 'Hora + recargo'}
        />
      </Card>

      <Card title="Factores de liquidación">
        {FACTOR_LABELS.map(([key, label]) => (
          <ValueRow key={key} label={label} value={formatFactor(factors[key])} />
        ))}
        <ThemedText type="caption" themeColor="textSecondary">
          Compáralos con tu planilla de nómina. La edición llega en la Fase 3.
        </ThemedText>
      </Card>

      <Card title="Datos">
        <Button label="Borrar todos mis datos" variant="danger" onPress={confirmReset} />
      </Card>
    </Screen>
  );
}
