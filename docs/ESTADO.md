# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-28 — incapacidad aparte del básico (app + PDF);
proyección de FSP/retención en la 1ª quincena; camino oficial vía EAS/TestFlight explicado.
**Fase actual:** Fase 3 — F0–F7 implementados; pulido tras prueba en iPhone real.
**Git:** último commit `2b858a0`. Árbol limpio.

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
- Pestañas (D-035): `NativeTabs` (barra "liquid") con cambio instantáneo como las apps
  de Apple; se probaron y descartaron desliz y fundido (iOS cambia la vista antes que JS).
- PDFs con nombre descriptivo (D-035): `TurnosApp-<Tipo>-<Mes>-<Año>-<Span>-<Completo|
  Parcial>.pdf` y `TurnosApp-Respaldo-<fecha>.pdf`.
- Vista "Mes completo" en Resumen (D-036): segmento Quincena | Mes; el mes liquida 30
  días de básico, auxilio completo, suma de bonificaciones y FSP/retención del mes.
  FSP y retención siempre visibles, con IBC del mes vs 4 SMMLV y base gravable vs 95 UVT.
- Liquidación (Resumen y PDF) con incapacidad en fila aparte del básico (D-036) y, en la
  1ª quincena, proyección de FSP/retención de fin de mes con lo registrado.

## Verificación al cerrar
- **128/128 pruebas (13 suites), tipos y lint en verde**; incluye prueba que reproduce
  la nómina real sep 16–30 (FSP $89.500, retención $215.000), PDF de mes completo,
  incapacidad aparte y proyección de la 1ª quincena.
- Metro LAN puerto 8083 activo (IP del Mac: 192.168.1.8); `npx expo login` hecho
  (cuenta expo.dev del usuario vía GitHub). App probada en iPhone real con Expo Go.

## En curso / siguiente sesión
1. Confirmación del usuario en el iPhone: vista Mes con sus datos de octubre, umbrales
   FSP/retención, PDF de mes completo sin cortes; ciclo exportar→restaurar.
2. `/revision-legal` recomendada: cambió el tope de básico/fracción según duración del
   periodo en `payroll.ts` (D-036).
3. Limpieza de caché de PDFs. (Permisos por horas descartados: no existen en su empresa.)
4. Fase 4: EAS build/TestFlight para app instalable (requiere Apple Developer).

## Decisiones pendientes con el usuario / bloqueos
- **App oficial (Fase 4):** el usuario pregunta cómo hacerla instalable. Camino explicado:
  cuenta Apple Developer ($99 USD/año, trámite suyo) → `eas.json` + bundle id + ícono →
  `eas build` producción → TestFlight. Falta que decida/compre la cuenta.
- FSP/retención en $0 en octubre es por ley (IBC ~$5,9M < 4 SMMLV; base < 95 UVT);
  el usuario lo sabe; la app muestra los umbrales.
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
