# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-26 — calendario con vista de año y hallazgos de revisión UI.
**Fase actual:** Fase 3 — F0–F5 implementados; prueba visual del rediseño y vista de año pendiente.
**Git:** avance previo en `bfceb39` + docs en `bfff494`. Cambios de esta sesión sin commit:
vista de año, "Dato adicional", háptico, expo-haptics ~58.0.7 y docs de la sesión.

## Qué existe hoy
- Motor puro de turnos/nómina validado con planilla real (D-013); auditoría previa en BITACORA.
- SQLite v2: settings, turnos/campos, plantillas, novedades; respaldo JSON formato 2 compatible con 1.
- Onboarding de siete pasos y Ajustes editables (F0/F1); gestión de plantillas en Ajustes.
- Calendario fijo sin scroll ni CTA (D-020): tap vacío registra, tap ocupado consulta.
  Día azul cielo, noche azul oscuro, descanso verde, novedad violeta; letras D/N/L/V.
- Vista de año estilo iPhone (D-022): tocar el nombre del mes muestra los 12 meses en miniatura
  con los mismos colores y puntito de segunda marca; tocar un mes abre su grilla.
- Registro Día 06–18/Noche 18–06 con salida automática; horario especial plegado.
  "Dato adicional" nombre + valor (ej.: Observaciones), sin selector de tipo (D-017/D-022).
  Fechas legibles "lun 26 oct" en selectores y háptico de éxito al guardar (expo-haptics).
- Consulta `/detalle` separada; Historial por periodo con búsqueda y PDF de acumulados;
  Resumen solo aviso breve de incompleto. Warnings con mapa `WARNING_LABELS` compartido.
- PDF de acumulados (D-021): expo-print + expo-sharing, consentimiento y escape HTML.
  No incluye neto ni JSON: NO es respaldo restaurable.

## Verificación al cerrar
- Reejecutados: **111/111 pruebas (13 suites), tipos, lint y expo-doctor 20/20**.
- Revisión UI global 2026-10-26 ejecutada: CAMBIOS RECOMENDADOS; medios aplicados
  (fechas, háptico, botón de respaldo deshabilitado, mapa de warnings).
- Metro LAN puerto 8083 activo; app recargada en simulador `EB5FAFDF-45F8-48BA-800F-5B884C38F8F9`.
  Prueba visual de la vista de año y del háptico aún sin confirmación del usuario.

## En curso / siguiente sesión
1. Confirmación visual del usuario: vista de año, miniaturas con colores, tap mes→grilla,
   "Dato adicional", háptico al guardar. No asumir aprobación por compilar.
2. Decisión del usuario sobre hallazgo alto de revisión UI: ¿mostrar en Resumen el acumulado
   de recargos+extras del periodo? (compatible con D-020, pero él pidió solo aviso; pendiente).
3. Especificar reglas de básico/aportes por novedades y cierre/reapertura; revisar normas/pruebas.
4. Implementar F6: estimación y PDF salarial, FSP/retención en última quincena sobre mes real.
5. Completar respaldo PDF restaurable F7; permisos por horas; animaciones de transición.
6. Hallazgos UI menores pendientes: memoizar `snapshot` en registro, acción "Limpiar búsqueda"
   en Historial, legibilidad de marcas D/N/L/V con letra grande.

## Decisiones pendientes con el usuario / bloqueos
- Confirmación visual del rediseño, vista de año y PDF; decisión sobre acumulado en Resumen.
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
