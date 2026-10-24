# PRD — TurnosApp

## Visión
App móvil personal (iOS y Android) para que un trabajador en Colombia registre sus turnos laborales y
sepa, con base en la legislación colombiana vigente, cuántas horas ordinarias, recargos y horas extra
trabajó y cuánto dinero estimado devengó en la quincena o el mes, incluyendo descuentos de ley.

## Usuario objetivo
Trabajador dependiente por turnos (ej. 06:00–18:00 y 18:00–06:00, también turnos de 4, 5 u 8 horas),
que quiere verificar su liquidación de nómina.

## Funcionalidades (MVP)

### F1. Configuración
- Salario base mensual (manual).
- Divisor de horas mensuales (por defecto según la ley vigente: 210 desde 15-jul-2026). Muestra el valor hora resultante.
- Límite diario y semanal de horas ordinarias (por defecto 8 h y 42 h).
- Factores/porcentajes editables: recargo nocturno, recargo dominical/festivo, extra diurna, extra nocturna
  (valores legales por defecto según la fecha, con botón "restaurar valores de ley").
- Periodo de pago: quincenal o mensual.
- Si recibe auxilio de transporte (automático si salario ≤ 2 SMMLV, editable).

### F2. Registro de turnos
- Crear, editar y eliminar un turno con fecha/hora de entrada y fecha/hora de salida.
- Soportar turnos que cruzan la medianoche y turnos de cualquier duración (máx. 24 h).
- Plantillas rápidas de turnos frecuentes (ej. "Día 06–18", "Noche 18–06").
- Nota opcional.
- Validaciones: salida posterior a entrada, sin turnos superpuestos.

### F3. Calendario
- Vista mensual con los días trabajados marcados (diferenciar día/noche/festivo).
- Tocar un día muestra sus turnos y permite agregar uno.
- Festivos de Colombia marcados automáticamente.

### F4. Detalle de turno
- Desglose: horas ordinarias diurnas, nocturnas, dominicales/festivas, extras por tipo.
- Valor en pesos de cada recargo y cada extra, y total del turno.
- Avisos legales (ej. más de 2 h extra en el día o 12 h en la semana).

### F5. Historial
- Lista de turnos por periodo (filtrable por quincena/mes), con búsqueda por fecha.
- Totales del periodo.

### F6. Resumen de pago (quincena/mes)
- Salario básico del periodo + recargos + extras + auxilio de transporte = total devengado.
- Descuentos: salud 4 %, pensión 4 %, Fondo de Solidaridad Pensional (si aplica),
  retención en la fuente (procedimiento 1, **estimado**).
- Neto estimado a recibir, con aviso: *"Valores aproximados; pueden diferir de tu liquidación oficial."*

## Fuera del MVP (futuro)
- Respaldo/exportación (CSV/PDF), sincronización en la nube, recordatorios/notificaciones,
  widgets, día de descanso distinto al domingo, primas/cesantías/vacaciones.

## Requisitos no funcionales
- Funciona sin internet. Datos solo en el dispositivo.
- Interfaz en español (Colombia), formato de moneda `$ 1.234.567`, formato de 24 h configurable.
- Accesible (tamaños de letra dinámicos, contraste AA, lectores de pantalla).
- Cálculos verificados con pruebas automáticas contra casos de `REGLAS_LEGALES.md`.

## Criterios de éxito
- Registrar un turno en menos de 10 segundos usando plantillas.
- El cálculo de un turno coincide con el cálculo manual de los casos de ejemplo de `REGLAS_LEGALES.md`.
