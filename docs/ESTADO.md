# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-28 — F7 completo: respaldo PDF restaurable también
desde el onboarding; tres PDFs distintos (respaldo, turnos coloreado, liquidación).
**Fase actual:** Fase 3 — F0–F7 implementados; pendiente prueba real exportar→restaurar.
**Git:** último commit `5c4371e` (cierre de periodo + respaldo F7). Sin commit:
onboarding con restauración, PDFs separados por tipo y `use-backup`/`use-period-pdf`.

## Qué existe hoy
- Motor puro de turnos/nómina validado con planilla real (D-013); auditoría previa en BITACORA.
- SQLite v2: settings, turnos/campos, plantillas, novedades; respaldo JSON formato 2 compatible con 1.
- Onboarding de siete pasos y Ajustes editables (F0/F1); gestión de plantillas en Ajustes.
- Calendario estilo iOS (D-020–D-024): swipe entre meses, scroll por años, selector de
  bloques de 12, doble tap para abrir, zoom año↔mes y "genie" al abrir/cerrar un día,
  colores de selección (azul) vs. actual (rojo); marcas D/N/L/V fijas en la esquina.
  Pulsación larga abre popover animado con datos del turno/novedad, botón Abrir y
  basurita animada con confirmación; eliminación también en `/detalle`.
- Registro con chips de horarios programados (06–14, 14–21, 14–22, 21–06, 22–06),
  plantillas Día/Noche y horario especial; "Dato adicional" nombre + valor;
  háptico al guardar + etiqueta que vuela al calendario.
- Ajuste global de formato de hora 12 h/24 h (`timeFormat`, D-025) en todos los relojes.
- Consulta `/detalle` con editar/eliminar; Historial por periodo con búsqueda y PDF;
  Resumen muestra el cuadro de liquidación del periodo (D-026) validado con la planilla real.
- Básico prorrateado por día pago (D-027/D-028): salario/30; descansos y permisos
  remunerados pagan día completo, incapacidad 75 % del promedio devengado, permiso
  no remunerado 0; en Resumen y PDF.
- Liquidación estimada (D-029): devengado, salud/pensión 4 % (a centenas), FSP/retención
  solo en 2ª quincena sobre el mes real, neto estimado; en Resumen y PDF.
- Ingreso adicional por periodo (D-030): bonificación variable guardada en ajustes;
  suma al devengado completo (IBC y FSP/retención); en Resumen y PDF.
- Tres PDFs distintos (`lib/period-report.ts`, D-033/D-034): respaldo (portada propia
  con instrucciones + JSON incrustado, Ajustes → Datos), turnos (planilla con badges
  de color del calendario D/N/L/V, Historial) y liquidación estimada (recargos índigo,
  extras verde, Resumen).
- Cierre/reapertura de periodo (D-032): `closedPeriods` en ajustes; bloquea crear/editar/
  eliminar registros del periodo; botón en Resumen.
- Respaldo restaurable (D-033): JSON embebido tras `%%EOF` (`lib/backup-file.ts`);
  restaura desde Ajustes → Datos **y desde el onboarding** ("Ya tengo un respaldo"),
  con confirmación y reemplazo total. Lógica compartida en `hooks/use-backup.ts`.

## Verificación al cerrar
- **123/123 pruebas (13 suites), tipos y lint en verde** tras separar los tres PDFs
  y añadir restauración al onboarding.
- Metro LAN puerto 8083 activo (IP del Mac: 192.168.1.8; Expo Go relanzado).

## En curso / siguiente sesión
1. Confirmación visual del usuario: calendario, chips, formato 12/24 h, liquidación,
   básico exacto $2.226.564, cierre de periodo y ciclo exportar→restaurar completo
   (exportar → borrar datos → restaurar desde el onboarding).
2. Permisos por horas (descartado por el usuario: no existen en su empresa);
   limpieza de caché de PDFs.

## Decisiones pendientes con el usuario / bloqueos
- Confirmación visual de F6/F7 completos y de los tres PDFs.
- Restaurar **reemplaza** todos los datos (sin mezclar); verificar que así lo quiere.

## Riesgos que retomar
- Último npm audit: **5 high** vía Expo CLI/code-signing/node-forge y zod (también lint).
  No aplicar --force (sugiere Expo 44) ni alterar políticas. Falta solución compatible/auditoría dedicada.
- Revisar limpieza de caché de PDFs privados al borrar datos; PDF actual no sustituye respaldo F7.
- Provider recarga toda BD; faltan pruebas de interacción y fronteras legales sugeridas en BITACORA.
- Capturas negras: revisión visual del usuario; verificar padding inferior en iPhone real.

## Recordatorios
- No reintroducir CTA de registro en Historial/Resumen ni listas de días faltantes (D-020).
- Novedades por fecha de inicio (D-019): noche 25→26 y descanso 26 permitido; no inferir descansos.
- Salud/pensión 4 % sobre devengado total; FSP/retención solo en segunda quincena (docs empresa).
