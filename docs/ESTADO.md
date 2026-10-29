# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-29 — build 2 compilado en EAS y submit programado
(upload en curso); app registrada en App Store Connect (`6828459921`); flag de
encriptación corregido a `true` (D-040).
**Fase actual:** Fase 4 — publicación en marcha (submit en vuelo → metadatos →
declaración de encriptación → build 3 → TestFlight).
**Git:** último commit `87c5fc1`. Sin commit: `app.json` (flag encriptación),
`eas.json` (ascAppId), `assets/images/promo-*` y `assets/screenshots/`.

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
- Respaldo cifrado opcional (D-038, **probado en iPhone real**): `domain/backup-crypto.ts` con clave maestra local +
  wraps por contraseña y código de recuperación (AES-256-CBC + HMAC, crypto-es); opción
  en onboarding y Ajustes (`components/backup-security.tsx`); importar pide secreto con
  `components/secret-prompt.tsx`; la clave nunca sale en el PDF.
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
- Fase 4 iniciada: ícono definitivo (calendario blanco + marcas D/N/L/V sobre azul,
  también splash y adaptativos Android), `bundleIdentifier`/`package`
  `com.natanaelr16.turnosapp`, buildNumber/versionCode 1, `privacyManifests`,
  `ITSAppUsesNonExemptEncryption:true` (D-040; el build 2 salió con `false`),
  `eas.json` (development/preview/production + `ascAppId` 6828459921),
  `docs/POLITICA_PRIVACIDAD.md` lista para publicar.
- Tienda: assets promocionales en las 5 dimensiones de Apple (`assets/images/promo-*`,
  bandera de Colombia en esquina), 3 capturas de simulador 1320×2868
  (`assets/screenshots/`); textos listos (subtítulo, descripción, promocional 168
  car., keywords 99 car., copyright `© 2026 Natanaelr16`).

## Verificación al cerrar
- **135/135 pruebas (14 suites), tipos y lint en verde**; incluye prueba que reproduce
  la nómina real sep 16–30 (FSP $89.500, retención $215.000), PDF de mes completo,
  incapacidad aparte y proyección de la 1ª quincena.
- Metro LAN puerto 8083 activo (IP del Mac: 192.168.1.8); `npx expo login` hecho
  (cuenta expo.dev del usuario vía GitHub). App probada en iPhone real con Expo Go.

## En curso / siguiente sesión
1. **Submit a App Store Connect en vuelo** (build 7e7c2cb1, v1.0.0 #2, submission
   de4437d5): verificar resultado con `npx eas-cli submission:list` o en expo.dev.
   El build ya compiló con éxito en EAS.
2. En App Store Connect (app `6828459921`), faltan obligatorios: seleccionar versión,
   información de contacto, derechos de contenido, URL de política de privacidad,
   cuestionario de privacidad ("no se recopilan datos"), franja de precio (paga,
   el usuario quiere bajo costo — Tier 1 sugerido), categoría principal
   (Productividad), clasificación por edades, y adjuntar el build a la versión.
3. **Declaración de encriptación (D-040):** responder en ASC "usa encriptación →
   solo algoritmos estándar" (AES-256 de crypto-es, no del OS); Apple da código de
   cumplimiento → añadir `ITSEncryptionExportComplianceCode` a `app.json` y compilar
   **build 3** (el 2 tiene el flag en `false`; sirve para TestFlight interno, no
   para revisión). Documento francés solo si se distribuye en Francia.
4. Falta la captura del **Calendario** para la ficha (tomarla en el iPhone real,
   1320×2868 o superior) y confirmar vista Mes con datos de octubre.
5. `/revision-legal` recomendada: cambió el tope de básico/fracción según duración del
   periodo en `payroll.ts` (D-036).
6. Publicar `POLITICA_PRIVACIDAD.md` en URL pública (raw GitHub si el repo es
   público, o gist) — **requisito obligatorio de la ficha**; enlazarla en Ajustes.
7. Limpieza de caché de PDFs. (Permisos por horas descartados: no existen en su empresa.)

## Decisiones pendientes con el usuario / bloqueos
- ~~App oficial: camino EAS~~ → **cuenta Apple Developer YA activada** (team
  J2W4AY4LP6, Individual); credenciales creadas vía ASC API key; build en curso.
  Pendiente: decidir precio (el usuario la quiere paga a bajo costo) y metadatos de tienda.
- FSP/retención en $0 en octubre es por ley (IBC ~$5,9M < 4 SMMLV; base < 95 UVT);
  el usuario lo sabe; la app muestra los umbrales.
- Confirmación visual de F6/F7 completos y de los tres PDFs.
- Restaurar **reemplaza** todos los datos (sin mezclar); verificar que así lo quiere.

## Riesgos que retomar
- npm audit al 2026-10-29: **3 high** restantes (deepmerge vía @expo/config/jest-config,
  zod vía expo CLI) — son deps de desarrollo, no van en la app; `node-forge` ya se corrigió.
  Solo se resuelven con `--force` que baja a Expo 51: no aplicar; auditoría dedicada pendiente.
- Revisar limpieza de caché de PDFs privados al borrar datos; PDF actual no sustituye respaldo F7.
- Provider recarga toda BD; faltan pruebas de interacción y fronteras legales sugeridas en BITACORA.
- Capturas negras: revisión visual del usuario; verificar padding inferior en iPhone real.

## Recordatorios
- No reintroducir CTA de registro en Historial/Resumen ni listas de días faltantes (D-020).
- Novedades por fecha de inicio (D-019): noche 25→26 y descanso 26 permitido; no inferir descansos.
- Salud/pensión 4 % sobre devengado total; FSP/retención solo en segunda quincena (docs empresa).
