# PRD — TurnosApp

## Visión
App móvil personal (iOS y Android) para que un trabajador en Colombia registre sus turnos laborales y
sepa, con base en la legislación colombiana vigente, cuántas horas ordinarias, recargos y horas extra
trabajó y cuánto dinero estimado devengó en la quincena o el mes, incluyendo descuentos de ley.

## Usuario objetivo
Trabajador dependiente por turnos (ej. 06:00–18:00 y 18:00–06:00, también turnos de 4, 5 u 8 horas),
que quiere verificar su liquidación de nómina.

## Funcionalidades (MVP)

### F0. Configuración inicial guiada (onboarding)
Se muestra al abrir la app por primera vez (y si no hay configuración guardada). No se puede
registrar turnos sin completarla. Pasos, uno por pantalla, con barra de progreso y botón "Atrás":
1. **Bienvenida + aviso legal:** qué hace la app y aceptar que los valores son estimados.
   Botón secundario **"Ya tengo un respaldo (PDF)"** → restaura (F7) y salta el resto del onboarding.
2. **Salario base mensual** (obligatorio, solo números, formato `$ 1.234.567`). Muestra en vivo el valor
   hora ordinaria resultante (salario ÷ divisor vigente).
3. **¿Recibes auxilio de transporte?** Sí / No (obligatorio, sin valor preseleccionado).
   - Si "Sí": valor editable, por defecto el legal vigente ($249.095 en 2026).
   - Ayuda contextual (informativa, no bloquea): si salario ≤ 2 SMMLV → "Por ley normalmente tienes
     derecho"; si salario > 2 SMMLV → "Por ley normalmente no aplica, pero puedes activarlo si tu empresa lo paga".
4. **Periodo de pago:** quincenal / mensual.
5. **Jornada:** límite diario de horas ordinarias (por defecto 8) y semanal (por defecto 42).
   Opción avanzada (plegada): "¿Cómo te pagan las horas normales en domingo o festivo?" —
   *Hora completa + recargo (190 %)* (por defecto) / *Solo el recargo (90 %), porque me dan otro día de descanso pagado*.
6. **Turnos frecuentes:** sugerir plantillas "Día 06:00–18:00" y "Noche 18:00–06:00" (marcar/desmarcar, se pueden crear después).
7. **Resumen:** muestra todo lo elegido, permite editar cualquier paso y "Empezar".

Pasos 4–6 tienen valores por defecto y botón "Omitir". Todo se puede cambiar después en Ajustes (F1).

### F1. Configuración
- Salario base mensual (manual).
- Auxilio de transporte: interruptor **Sí/No manual** (el usuario decide; nunca se activa solo) y valor editable.
- Divisor de horas mensuales (por defecto según la ley vigente: 210 desde 15-jul-2026). Muestra el valor hora resultante.
- Límite diario y semanal de horas ordinarias (por defecto 8 h y 42 h).
- Factores/porcentajes editables: recargo nocturno, recargo dominical/festivo, extra diurna, extra nocturna
  (valores legales por defecto según la fecha, con botón "restaurar valores de ley").
- Pago de horas ordinarias en domingo/festivo: hora completa + recargo (por defecto) o solo recargo (D-013).
- La pantalla de Ajustes muestra la tabla de factores resultante (1,25 · 0,35 · 1,75 · 1,90 · 2,15 · 2,25 · 2,65),
  igual a como aparece en una planilla de nómina, para que el usuario la compare con la suya.
- Periodo de pago: quincenal o mensual.

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
- Salario básico del periodo + recargos + extras + auxilio de transporte (solo si está activado) = total devengado.
- Descuentos: salud 4 %, pensión 4 %, Fondo de Solidaridad Pensional (si aplica),
  retención en la fuente (procedimiento 1, **estimado**).
- Neto estimado a recibir, con aviso: *"Valores aproximados; pueden diferir de tu liquidación oficial."*

### F7. Exportar PDF + restaurar desde PDF (respaldo sin cuentas)
- **Exportar:** genera un PDF legible del periodo elegido (o de todo el historial): resumen de pago, tabla de
  turnos y detalle de liquidación. El PDF lleva **embebido un respaldo completo** (configuración, turnos y
  plantillas) en formato JSON versionado, invisible al leerlo.
- Compartir el PDF con la hoja nativa del sistema (correo, WhatsApp, Drive, Archivos…).
- **Restaurar:** en el onboarding ("Ya tengo un respaldo") y en Ajustes, el usuario elige un PDF exportado;
  la app lee el respaldo embebido, muestra un resumen (n.º de turnos, rango de fechas, salario) y pide
  confirmación antes de reemplazar o combinar los datos.
- Sirve para cambiar de teléfono o reinstalar la app sin servidor ni cuenta.
- Si el PDF no tiene respaldo válido o es de una versión más nueva de la app, se informa claramente.

## Fuera del MVP (futuro)
- Exportación CSV, sincronización en la nube, recordatorios/notificaciones,
  widgets, día de descanso distinto al domingo, primas/cesantías/vacaciones.
- Novedades por día sin horas (Descanso, Permiso, Vacaciones, Incapacidad), como en las planillas de nómina.
- Vista "planilla": tabla por fecha con columnas D.O, Ext. D, Ord. Noc, Ext. Noc, Dom/Fes, Ext. F.D,
  Rec. Noc. Fes, Ext. F.N y el cuadro "Detalle de liquidación" (concepto, factor, horas, valor).

## Referencia real
Planilla de nómina del usuario (conductor operador de equipos, salario $4.453.128, valor hora $21.205,
sin auxilio de transporte, turnos 06–18 / 18–06 y parciales). Las pruebas de `shift-calc-test.ts`
("coincide con planilla real de nómina") reproducen sus valores exactos. No guardar datos personales
del usuario (nombre, cédula) en el repositorio.

## Requisitos no funcionales
- Funciona sin internet. Datos solo en el dispositivo.
- Interfaz en español (Colombia), formato de moneda `$ 1.234.567`, formato de 24 h configurable.
- Accesible (tamaños de letra dinámicos, contraste AA, lectores de pantalla).
- Cálculos verificados con pruebas automáticas contra casos de `REGLAS_LEGALES.md`.

## Criterios de éxito
- Registrar un turno en menos de 10 segundos usando plantillas.
- El cálculo de un turno coincide con el cálculo manual de los casos de ejemplo de `REGLAS_LEGALES.md`.
