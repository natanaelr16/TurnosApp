# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-28 — básico prorrateado por día pago en Resumen y PDF (D-027).
**Fase actual:** Fase 3 — F0–F5 implementados; avance hacia F6 con reglas empresariales reales.
**Git:** último commit `44a4cf1` (calendario iOS completo). Sin commit: `basicPayDetail` en
dominio + básico/incapacidad/permiso no remunerado en Resumen y PDF.

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
- PDF de acumulados (D-021): expo-print + expo-sharing, consentimiento y escape HTML.
  Incluye básico del periodo; no incluye deducciones/neto ni JSON: NO es respaldo restaurable.

## Verificación al cerrar
- **114/114 pruebas (13 suites), tipos y lint en verde** tras los cambios de esta sesión.
- Metro LAN puerto 8083 activo (la IP del Mac cambió a 192.168.1.8; Expo Go relanzado).
- Crash anterior del tap sostenido corregido (interpolación de la basurita y `useWindowDimensions`);
  falta validación directa del popover y del genie en el simulador.

## En curso / siguiente sesión
1. Confirmación visual del usuario: swipe de meses, scroll de años, selector de década,
   colores, popover, genie, basurita, chips 8 h y formato 12/24 h. No asumir aprobación.
2. Definir resto de reglas para F6: deducciones salud/pensión 4 %, FSP/retención en 2ª
   quincena, ingresos extra tipo bonificación y cierre/reapertura (D-015/D-016).
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
