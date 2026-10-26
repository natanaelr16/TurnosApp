# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-25
**Fase actual:** Fase 3 — F0–F5 implementados y rediseñados; prueba visual del nuevo flujo pendiente.
**Pendiente principal:** liquidación F6 con novedades y mes real (D-015/D-016).

## Qué existe hoy
- Motor puro de turnos/nómina, validado con planilla real (D-013); auditoría previa en BITACORA.
- SQLite v2: settings, turnos con campos opcionales, plantillas y novedades; migración v1 probada,
  guardado validado y restauración atómica. Respaldo JSON formato 2 compatible con formato 1 (D-018).
- F0/F1: onboarding guiado y ajustes editables; plantillas gestionables en Ajustes.
- **Calendario D-020**: grilla fija sin ScrollView, abre en hoy; sin registrar/Ir a hoy.
  Tap vacío registra; tap ocupado consulta. Día azul cielo, noche azul oscuro, descanso verde,
  novedad violeta; letras D/N/L/V, hoy contorno y domingo/festivo subrayado. Meses con flechas.
- **Registro**: Día 06–18 o Noche 18–06 con salida/fecha siguiente automáticas. Horario especial
  plegado conserva turnos parciales. Campos opcionales solo nombre/valor, sin preguntar tipo.
- **Consulta `/detalle`** separada de edición desde calendario/historial: horas extra, recargos,
  importes por categoría, campos, notas y avisos. Historial: lista por periodo, sin CTA de registro.
- **Resumen**: solo mensaje breve de periodo incompleto o estimación no disponible. Sin progreso,
  lista de faltantes, acumulados ni botones de registro. El neto F6 aún no está implementado.
- **PDF D-021**: Historial exporta acumulados reales del periodo completo, no solo búsqueda;
  privacidad antes de compartir, HTML escapado y sin recursos externos. Expo Print/Sharing exactos
  SDK 58 instalados. PDF NO contiene neto ni JSON de respaldo: no es restaurable todavía.
- Provider con error/reintento; pantallas con validación, confirmación de salida y soporte de teclado.
- **Verificación:** 111 pruebas, tipos y lint correctos; expo-doctor 20/20.
  QA/UI ejecutadas; sugerencia de reponer faltantes/CTA en Resumen rechazada por D-020.
- F0/F1 en commit `a9429a6`; resto del avance sin commit ni push.

## Reglas y limitaciones
- Novedades por jornada de inicio (D-019), una por fecha e incompatibles con turno que inicie allí.
  Noche 25→26 + descanso 26 permitido. Permisos por horas aún no disponibles.
- Descanso incluido en básico; permisos e incapacidad 75 % empresarial registrados sin ajuste
  monetario aún. FSP/retención en última quincena sobre mes real todavía pendiente.
- Motor anterior sigue proyectando quincena ×2: no se usa para presentar netos en la UI/PDF.

## Siguiente paso
1. Usuario: validar calendario entero/colores, tap vacío/ocupado, Noche automática y Grúa: RTG19.
2. Probar PDF nativo, teclado/letra grande/oscuro/persistencia y pantallas pequeñas/iOS/Android.
3. Especificar básico/aportes por novedades y cierre/reapertura, revisar normas/pruebas y terminar F6.
4. Añadir liquidación al PDF y respaldo restaurable F7; pulir animaciones/háptica.

## Riesgos / pendientes
- npm audit reporta **5 high** por Expo CLI/code-signing/node-forge y zod (también lint).
  Sin corrección compatible aplicada: --force sugiere Expo 44. No se alteraron controles de seguridad.
- Falta auditoría de seguridad dedicada y revisar limpieza de caché de PDFs privados al borrar datos.
- Falta prueba nativa de exportación y visual del rediseño; compilar no demuestra funcionamiento UI.
- Simulador: `EB5FAFDF-45F8-48BA-800F-5B884C38F8F9`; Metro LAN puerto 8083 evita IPv4/IPv6.
  Capturas negras; validación visual del usuario. Verificar padding inferior en iPhone real.
- Provider recarga toda BD; faltan pruebas automatizadas de interacción y fronteras legales sugeridas.

## Recordatorios
- No reintroducir registro en Historial/Resumen ni listar días faltantes: decisión explícita del usuario.
- No confundir cobertura completa con nómina cerrada ni PDF de acumulados con respaldo completo.
- Antes de aplicar 75 % empresarial: revisar bases, mínimos y duración/tipo de incapacidad.
