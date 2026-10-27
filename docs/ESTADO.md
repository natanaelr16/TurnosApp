# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-26 — calendario iOS completo, popover, formato 12/24 h y
cuadro de liquidación en Resumen (D-024/D-025/D-026).
**Fase actual:** Fase 3 — F0–F5 implementados; prueba visual de esta iteración pendiente.
**Git:** último commit `d63e563` (hallazgos UI menores). Sin commit: todo lo de esta sesión
(calendario estilo iOS completo, popover, genie, basurita, chips 8 h, formato 12/24 h,
cuadro en Resumen, eliminación en `/detalle`, skill `/diseno-ui` y @expo/vector-icons).

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
- PDF de acumulados (D-021): expo-print + expo-sharing, consentimiento y escape HTML.
  No incluye neto ni JSON: NO es respaldo restaurable.

## Verificación al cerrar
- **113/113 pruebas (13 suites), tipos y lint en verde** tras los cambios de esta sesión.
- Metro LAN puerto 8083 activo; app recargada en simulador `EB5FAFDF-45F8-48BA-800F-5B884C38F8F9`.
- Crash anterior del tap sostenido corregido (interpolación de la basurita y `useWindowDimensions`);
  falta validación directa del popover y del genie en el simulador.

## En curso / siguiente sesión
1. Confirmación visual del usuario: swipe de meses, scroll de años, selector de década,
   colores, popover, genie, basurita, chips 8 h y formato 12/24 h. No asumir aprobación.
2. Definir reglas de básico/aportes por novedades y cierre/reapertura (D-015/D-016) antes de F6.
3. Implementar F6: estimación y PDF salarial con FSP/retención sobre mes real.
4. Completar respaldo PDF restaurable F7; permisos por horas; limpieza de caché de PDFs.

## Decisiones pendientes con el usuario / bloqueos
- Confirmación visual del calendario completo, chips y formato de hora; PDF de acumulados.
- Concretar cierre/reapertura y tratamiento de aportes/mínimos/duración de incapacidad antes de F6.
- Descanso ya incluido en básico; permisos e incapacidad 75 % empresarial solo registrados,
  sin ajuste monetario. Motor anterior proyecta quincena ×2 y no se usa para mostrar netos.

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
