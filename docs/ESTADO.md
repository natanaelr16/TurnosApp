# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-25 — cierre del día.
**Fase actual:** Fase 3 — F0–F5 implementados; prueba visual del rediseño pendiente.
**Git:** avance guardado en `bfceb39` (F0/F1 en `a9429a6`). Repo limpio antes de este cierre;
solo memoria/documentación pendiente de commit al terminar. Sincronización remota no comprobada.
El título «Fase 4» del commit no cambia el ROADMAP: F6 aún está pendiente.

## Qué existe hoy
- Motor puro de turnos/nómina validado con planilla real (D-013); auditoría previa en BITACORA.
- SQLite v2: settings, turnos/campos opcionales, plantillas, novedades; migración v1 probada,
  guardado validado, restauración atómica y respaldo JSON formato 2 compatible con formato 1.
- Onboarding de siete pasos y Ajustes editables (F0/F1); gestión de plantillas en Ajustes.
- Calendario fijo sin scroll ni CTA de registro/Ir a hoy: tap vacío registra y tap ocupado consulta.
  Día azul cielo, noche azul oscuro, descanso verde, novedad violeta; letras D/N/L/V (D-020).
- Registro Día 06–18/Noche 18–06 con salida automática; horario especial plegado y campos
  opcionales solo nombre/valor, sin selector de tipo. Fechas/horas nativas con @expo/ui.
- Consulta `/detalle` separada de edición: horas extra, recargos, importes por categoría y avisos.
  Historial por periodo, sin botones de registro; PDF incluye todo el periodo, no solo búsqueda.
- Resumen solo muestra aviso breve de incompleto/no disponible; sin progreso ni días faltantes.
  La estimación salarial neta F6 todavía no está implementada.
- PDF de acumulados (D-021): expo-print 58.0.7 + expo-sharing 58.0.20, consentimiento de privacidad,
  HTML escapado y sin recursos externos. No incluye neto ni JSON: NO es respaldo restaurable.
- Provider con error/reintento, validación, confirmación de salida y soporte de teclado.

## Verificación al cerrar
- Reejecutados: **111/111 pruebas (13 suites), tipos y lint correctos**.
- Expo-doctor 20/20 y bundles iOS/Android HTTP 200 comprobados previamente en esta sesión.
- QA/UI ejecutadas. Prueba visual y exportación PDF nativa aún sin confirmación del usuario.

## En curso / siguiente sesión
1. Revisar calendario entero/colores, tap vacío/ocupado, Noche automática y campo Grúa: RTG19;
   probar PDF nativo, letra grande, oscuro, persistencia y pantallas pequeñas/iOS/Android.
2. Especificar reglas de básico/aportes por novedades y cierre/reapertura; revisar normas/pruebas.
3. Implementar F6: estimación y PDF salarial, FSP/retención en última quincena sobre mes real.
4. Completar respaldo PDF restaurable F7; pulir animaciones/háptica y permisos por horas.

## Decisiones pendientes con el usuario / bloqueos
- Confirmación visual del rediseño y del PDF; no asumir aprobación por compilar.
- Concretar cierre/reapertura y tratamiento de aportes/mínimos/duración de incapacidad antes de F6.
- Descanso ya incluido en básico; permisos e incapacidad 75 % empresarial solo registrados,
  sin ajuste monetario. Motor anterior proyecta quincena ×2 y no se usa para mostrar netos.

## Riesgos que retomar
- Último npm audit: **5 high** vía Expo CLI/code-signing/node-forge y zod (también lint).
  No aplicar --force (sugiere Expo 44) ni alterar políticas. Falta solución compatible/auditoría dedicada.
- Revisar limpieza de caché de PDFs privados al borrar datos; PDF actual no sustituye respaldo F7.
- Provider recarga toda BD; faltan pruebas de interacción y fronteras legales sugeridas en BITACORA.
- Simulador `EB5FAFDF-45F8-48BA-800F-5B884C38F8F9`; Metro LAN puerto 8083 evita IPv4/IPv6.
  Capturas negras: revisión visual del usuario; verificar padding inferior en iPhone real.

## Recordatorios
- No reintroducir CTA de registro en Historial/Resumen ni listas de días faltantes (D-020).
- Novedades por fecha de inicio (D-019): noche 25→26 y descanso 26 permitido; no inferir descansos.
