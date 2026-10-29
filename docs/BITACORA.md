# Bitácora de sesiones

Registro cronológico (más reciente arriba). Una entrada por sesión de trabajo.
Formato: fecha, objetivo, qué se hizo, verificación ejecutada, pendientes.

---

## 2026-10-29 — Submit a App Store Connect programado + metadatos de tienda y cumplimiento de cifrado
- **Objetivo:** subir el build 2 a App Store Connect y preparar la ficha de tienda.
- **Hecho:** app creada en App Store Connect por el usuario (id `6828459921`, nombre
  "TurnosApp" quedó libre). `eas.json` con `ascAppId` + llave ASC local
  (`~/Downloads/AuthKey_QX47VJDJBL.p8`). `eas submit` programó la subida del build
  7e7c2cb1 (v1.0.0, buildNumber 2) — **upload en curso al cerrar**. Generados los
  assets promocionales en las 5 dimensiones pedidas por Apple (`assets/images/promo-*`)
  y 3 capturas de simulador 1320×2868 (`assets/screenshots/`). Textos listos:
  subtítulo, descripción, promocional (168 car.), palabras clave (99 car.),
  copyright `© 2026 Natanaelr16`. Metadatos obligatorios pendientes explicados al
  usuario (versión, contacto, derechos, privacidad, precio, categoría, edades).
  **Hallazgo de cumplimiento:** el cifrado AES-JS de los respaldos hace la app
  "encriptación no exenta" → `ITSAppUsesNonExemptEncryption` corregido a `true`
  (D-040); el build 2 salió con `false`, sirve para TestFlight interno pero para
  revisión conviene build 3 con el flag y el código de cumplimiento.
- **Verificación:** resultado del submit pendiente (proceso sigue corriendo);
  build 2 compiló con éxito en EAS.
- **Pendientes:** declaración de encriptación en ASC ("solo algoritmos estándar",
  sin documentos salvo Francia), código de cumplimiento → `app.json`, build 3,
  captura de calendario desde el iPhone, completar campos obligatorios.

## 2026-10-29 — Cuenta Apple activada: credenciales de firma y primer build de producción
- **Objetivo:** llevar la app a producción tras activarse la cuenta Apple Developer.
- **Hecho:** `npx eas-cli init` creó y vinculó `@natanaelr16/TurnosApp` en expo.dev
  (tomó el ícono nuevo; projectId en app.json). El usuario creó una llave App Store
  Connect API (`AuthKey_QX47VJDJBL.p8`, issuer 116e6061-07b3-4ef9-abe3-1bef7e3104d4,
  team J2W4AY4LP6 tipo Individual) para builds sin escribir la contraseña de Apple.
  `eas build -p ios --profile production` en modo interactivo: registró el bundle
  `com.natanaelr16.turnosapp`, creó certificado de distribución y provisioning
  (vencen oct 2027), buildNumber 1→2 y subió el build a EAS — **en curso al cerrar**.
  `eas.json` con perfiles dev/preview/production; submit pendiente de configurar
  (la llave ASC quedó como env vars EXPO_ASC_* en el comando).
- **Verificación:** build en vuelo (fase Bundle JavaScript al cerrar la sesión);
  logs en expo.dev builds/7e7c2cb1-9c44-42f3-b7b9-b787711bbbcd.
- **Pendientes:** resultado del build → `eas submit` → capturas/descripción/precio/
  privacidad en App Store Connect → TestFlight.

## 2026-10-29 — Respaldo cifrado opcional con contraseña y recuperación local (D-038)
- **Objetivo:** el usuario quiere que el PDF de respaldo pueda cifrarse con contraseña,
  con recuperación local sin nube, opcional desde el onboarding y activable en Ajustes.
- **Hecho:** `crypto-es` (JS puro, funciona en Expo Go). `domain/backup-crypto.ts`:
  clave maestra 256 bits guardada localmente (nunca viaja en el respaldo), cifrado
  AES-256-CBC + HMAC, PBKDF2 50.000 iteraciones; el sobre del PDF lleva la clave
  envuelta por contraseña y por código de recuperación (XXXX-XXXX-XXXX sin ambiguos).
  UI: tarjeta `components/backup-security.tsx` en Ajustes (activar/cambiar/restablecer
  con código/quitar), opción en el paso 6 del onboarding con Alert del código, y
  `components/secret-prompt.tsx` (modal multiplataforma) para pedir el secreto al
  importar — incluido restaurar desde onboarding. Al restaurar en teléfono sin
  protección se adopta la del respaldo. Bug corregido: `WordArray.random(n)` es bytes.
- **Verificación:** `npx tsc --noEmit` ✓ · `npx expo lint` ✓ · `npm test` 135/135 ✓
  (7 pruebas nuevas: unwrap, código, cambio de contraseña, HMAC alterado).
- **Pendientes:** prueba visual en iPhone del ciclo cifrado completo; commit.
- **Actualización:** commits `db73f94` y `fcb6b45` hechos; el usuario probó en el iPhone
  real con Expo Go (LAN 8083) el mismo día — activar protección, exportar PDF cifrado
  y restaurar con contraseña: **funciona bien todo**.

## 2026-10-29 — Preparación para publicación: ícono, ids de tienda, eas.json y privacidad
- **Objetivo:** adelantar lo evitable de Fase 4 (ícono, versionado, documentación legal)
  y registrar las prácticas de uso de IA del usuario.
- **Hecho:** ícono definitivo generado con `sips` desde SVG (calendario blanco con
  marcas D/N/L/V en los colores de la app sobre azul degradado; también splash-icon y
  adaptativos Android); se eliminó `assets/expo.icon` de plantilla. `app.json`:
  `ios.bundleIdentifier`/`android.package` = `com.natanaelr16.turnosapp`, buildNumber/
  versionCode 1, solo iPhone, `ITSAppUsesNonExemptEncryption:false` y `privacyManifests`
  (FileTimestamp C617.1, UserDefaults CA92.1). `eas.json` nuevo con perfiles
  development/preview/production (autoIncrement). `docs/POLITICA_PRIVACIDAD.md` listo
  para publicar (100 % local, sin analítica, Ley 1581, aviso de estimado). `npm audit
  fix` corrigió node-forge; quedan 3 high en deps de desarrollo (deepmerge, zod) que
  solo se arreglan bajando a Expo 51 → documentado, sin `--force`. Registrada D-037
  (prácticas de tokens: modelo potente solo al codificar, editar por línea).
- **Verificación:** `npx tsc --noEmit` ✓ · `npx expo lint` ✓ · `npm test` 128/128 ✓ ·
  `npx expo config --type public` ✓.
- **Pendientes:** publicar la política en URL pública y enlazarla en Ajustes;
  `/revision-legal`; cuenta Apple Developer → build producción → TestFlight.

## 2026-10-28 — Commit de liquidación/mes, explicación de FSP $0 y camino a app oficial
- **Objetivo:** cerrar el trabajo de PDF/incapacidad/proyección; responder por qué FSP
  y retención salen en $0 en octubre; explicar cómo llevar la app a instalable oficial.
- **Hecho:** commit `2b858a0` (vista de mes, incapacidad aparte del básico, proyección
  de FSP/retención en 1ª quincena, pestañas sin animación). Se explicó al usuario que
  los $0 de FSP/retención son por ley (IBC del mes ~$5,9M < 4 SMMLV; base gravable
  < 95 UVT) y dónde ver los umbrales en Resumen. Camino oficial: Apple Developer
  ($99/año) → EAS build producción → TestFlight; se dejó como decisión pendiente.
- **Verificación:** `npm test` 128/128 ✓ · `npx tsc --noEmit` ✓ · `npx expo lint` ✓.
- **Pendientes:** `/revision-legal`; confirmación del usuario en el iPhone; decisión
  y compra de cuenta Apple Developer para el build con EAS.

## 2026-10-28 — Vista de mes completo, umbrales FSP/retención y PDF corregido (D-036)
- **Objetivo:** el usuario cargó octubre completo y no veía retefuente ni fondo de
  solidaridad en Resumen ni en el PDF; el PDF de mes mostraba valores cortados; pidió
  liquidar el mes completo y una animación de pestañas con entrada y salida.
- **Hecho:** `basicPayDetail`/`payEstimate` deducen tope (15/30 días) y fracción por
  la duración del periodo: corrige que el cálculo mensual de FSP/retención topara el
  básico en 15 días con pago quincenal. Resumen: segmento Quincena | Mes; FSP y
  retención siempre visibles ("2ª quincena" o valor), con IBC del mes vs 4 SMMLV y
  base gravable en UVT vs 95 (`taxableBaseUvt`, campos `monthBase`/`fspThreshold`/
  `taxableUvt`). PDF de liquidación: celdas `.num` sin cortes, desglose completo,
  bonificación de ambas quincenas en vista de mes, umbrales. Simulación de octubre
  típico: ~$5,9M de IBC → FSP y retención $0 por ley. Pestañas: tras probar
  Reanimated se explicó que `NativeTabs` no permite animar la salida; el usuario
  eligió barra liquid sin animación → se eliminó `components/tab-slide.tsx`.
- **Ajuste posterior:** el usuario pidió incapacidad aparte del básico y ver FSP/
  retención calculados en la vista previa. Resumen y PDF muestran Salario básico,
  Incapacidad, Recargos y extras, Auxilio, Ingreso adicional y Devengado en filas
  separadas; `payEstimate` siempre calcula el mes (`monthSolidarityFund`/
  `monthWithholding`): en la 1ª quincena es proyección con lo registrado (no se
  descuenta), al final del mes es el descuento real.
- **Verificación:** `npx tsc --noEmit` ✓ · `npx expo lint` ✓ · `npm test` 128/128 ✓
  (nueva prueba con la nómina real sep 16–30: FSP 89.500 y retención 215.000).
- **Pendientes:** confirmación del usuario con sus datos reales; `/revision-legal`.

## 2026-10-28 — iPhone real vía Expo Go, tabs animadas y nombres de PDF (D-035)
- **Objetivo:** probar la app en el iPhone del usuario y ajustar diseño: transición
  animada entre pestañas y nombres de archivo claros en los PDF.
- **Hecho:** usuario creó cuenta expo.dev (vía GitHub) y ejecutó `npx expo login`
  con login por navegador; Expo Go en el iPhone carga la app por LAN
  (`exp://192.168.1.8:8083`). `(tabs)/_layout.tsx` migrado de `NativeTabs` (sin
  transiciones posibles) a `Tabs` de React Navigation con `animation: 'shift'` e
  Ionicons — la página desliza hacia el lado del botón. Los PDFs exportados se
  renombran antes de compartir: `TurnosApp-Turnos-Octubre-2026-Quincena-1-Parcial.pdf`,
  `...-Salario-...-Mes-Completo.pdf`, `TurnosApp-Respaldo-<fecha>.pdf`.
- **Verificación:** `npx tsc --noEmit` ✓ · `npx expo lint` ✓ · `npm test` 123/123 ✓.
- **Ajuste posterior:** el usuario pidió conservar la barra nativa "liquid";
  se revirtió a `NativeTabs` y la animación direccional se movió al contenido con
  `components/tab-slide.tsx`; tras dos iteraciones visuales quedó como desvanecido
  puro (fade 260 ms + elevación 6 px) — el desliz lateral "cortaba" la pantalla.
  Verificación tras el ajuste: `tsc` ✓ · `lint` ✓ · 123/123 pruebas ✓.
- **Pendientes:** confirmación visual de la animación y nombres en el iPhone;
  ciclo exportar→restaurar en dispositivo real; Fase 4 (EAS build).

## 2026-10-28 — F7 completo: restaurar desde onboarding y tres PDFs distintos (D-034)
- **Objetivo:** el usuario borró sus datos para probar la restauración y el onboarding
  no ofrecía restaurar; además pidió PDFs diferenciados: respaldo propio, planilla de
  turnos con colores del calendario y liquidación con recargos/extras coloreados.
- **Hecho:** `lib/period-report.ts` dividido en `buildShiftsReport` (badges D/N/L/V del
  calendario), `buildPayrollReport` (recargos índigo, extras verde como el historial) y
  `buildBackupReport` (portada de respaldo con instrucciones). `hooks/use-backup.ts`
  concentra exportar/importar y lo usan Ajustes y el onboarding ("Ya tengo un
  respaldo"). `use-period-pdf` acepta kind 'turnos'|'liquidacion'; botón "Exportar
  liquidación (PDF)" en Resumen y "Exportar turnos (PDF)" en Historial.
- **Verificación:** `npx tsc --noEmit` ✓ · `npx expo lint` ✓ · `npm test` 123/123 ✓.
- **Pendientes:** prueba real del ciclo exportar→borrar→restaurar en el simulador;
  limpieza de caché de PDFs.

## 2026-10-28 — F6 completo + F7: cierre de periodo y respaldo restaurable (D-032/D-033)
- **Objetivo:** terminar F6 (cierre/reapertura de periodo) e implementar F7 (respaldo
  PDF restaurable para migrar de celular sin nube). Permisos por horas descartados por
  el usuario: no existen en su empresa.
- **Hecho:** `settings.closedPeriods` + `isPeriodClosed` en `domain/payroll.ts`;
  `use-app-data` bloquea crear/editar/eliminar registros del periodo cerrado; botón
  Cerrar/Reabrir en Resumen. `lib/backup-file.ts` incrusta el JSON de respaldo en
  base64 tras `%%EOF` del PDF; Ajustes → Datos exporta el PDF restaurable
  (expo-print + expo-sharing) y restaura con `expo-document-picker` ~58.0.4 +
  `expo-file-system` ~58.0.13, validando con `parseBackup`, mostrando resumen y
  reemplazando todos los datos tras confirmación. Nueva prueba de ida y vuelta con
  campos nuevos (extraIncome, closedPeriods, timeFormat).
- **Verificación:** `npx tsc --noEmit` ✓ · `npx expo lint` ✓ · `npm test` 121/121 ✓.
- **Pendientes:** opción "Ya tengo un respaldo" en onboarding; prueba real
  exportar→restaurar en dispositivo; limpieza de caché de PDFs.

## 2026-10-28 — F6 parcial: liquidación estimada del periodo (D-029)
- **Objetivo:** estimación de nómina del periodo: deducciones reales (salud/pensión 4 %
  con redondeo a centenas como la planilla), FSP/retención solo en 2ª quincena sobre
  el mes real, y neto estimado en Resumen y PDF.
- **Hecho:** `payEstimate` en `domain/payroll.ts` (devengado = básico + incapacidad +
  recargos/extras + auxilio; IBC con mínimo ½ SMMLV; FSP/retención con el mes completo);
  tarjeta "Liquidación estimada" en Resumen; tabla equivalente en el PDF; aviso y prueba
  del informe actualizados al nuevo alcance (sí muestra neto estimado).
- **Verificación:** `npx tsc --noEmit`, `npx expo lint` y `npm test` en verde
  (118/118 pruebas, 13 suites).
- **Pendientes:** cierre/reapertura de periodo; validación visual del usuario.
- **Mismo día — bonificación (D-030):** `settings.extraIncome` por periodo + campo en
  Resumen → Liquidación estimada; suma al devengado completo (IBC y FSP/retención);
  en 2ª quincena se suman ambas quincenas; también en el PDF.
  `tsc`, `expo lint` y **119/119 pruebas** en verde.

---

## 2026-10-28 — Básico prorrateado por día pago en Resumen y PDF (D-027)
- **Objetivo:** pedido del usuario: mostrar el salario básico en el detalle de liquidación,
  PDF e historial, afectado por novedades — incapacidad al 75 % del día, permiso no
  remunerado sin pago (regla observada en su nómina real: día pago = salario ÷ 30).
- **Hecho:** `basicPayDetail` en `domain/payroll.ts` (días completos = turnos + descansos +
  permisos remunerados, incapacidad al 75 %, día con turno cuenta una vez); Resumen muestra
  básico/incapacidad/permiso no remunerado y "Total del periodo"; PDF del periodo con la
  misma sección y texto actualizado sobre novedades. Prueba con el caso real oct 1–15
  (11 días × $148.438 ≈ $1.632.818 vs $1.632.814 de nómina, ±4 por redondeo).
- **Verificación:** `npx tsc --noEmit`, `npx expo lint` y `npm test` en verde
  (114/114 pruebas, 13 suites). Metro reiniciado; la IP del Mac cambió a 192.168.1.8
  y Expo Go se relanzó con la URL nueva.
- **Pendientes:** validación visual del usuario; deducciones (salud/pensión 4 %,
  FSP/retención 2ª quincena) e ingresos extra tipo bonificación siguen pendientes para F6.
- **Corrección posterior el mismo día:** el finiquito sep 1–15 mostró que la incapacidad
  paga el 75 % del **promedio diario devengado** (2 días = 414.020 → 207.010/día ≈ 75 %
  de 276.013), no del básico. Implementado en `basicPayDetail` (nueva D-028); prueba
  realista añadida. `tsc`, `expo lint` y **115/115 pruebas** en verde.

---

## 2026-10-26 — Calendario iOS completo, chips 8 h, formato 12/24 y cuadro de liquidación
- **Objetivo:** iteraciones del usuario tras probar la app: navegación real del calendario
  (swipe/scroll/selector de años), colores diferenciados, popover con datos del día,
  eliminación con basurita animada y en `/detalle`, creación más ágil (chips 8 h),
  formato de hora 12/24 global y acumulados en Resumen estilo planilla de la empresa.
- **Hecho:** mes como `FlatList` horizontal paginado ±30 años; vista de año con scroll
  vertical por año y selector de bloques de 12; selección azul vs. actual rojo; marcas
  D/N/L/V fijas en la esquina de la celda; popover `DayPopover` animado desde la celda con
  datos del turno/novedad, botón Abrir y `TrashButton` (ícono @expo/vector-icons con
  sacudido + confirmación); "genie" zoom hacia la celda al abrir y al volver; eliminación
  con confirmación en `/detalle`; chips 06–14/14–21/14–22/21–06/22–06 en registro;
  `timeFormat` 12/24 en Ajustes aplicado por `formatTime` a selectores y textos;
  `payroll.liquidationTable` con cuadro factor·concepto·horas·valor en Resumen validado
  contra la planilla real (oct 1–15: horas exactas, valores ±40 por redondeo).
- **Verificación:** `npx tsc --noEmit`, `npx expo lint` y `npm test` en verde
  (113/113 pruebas, 13 suites) tras los cambios. Metro en 192.168.1.17:8083 recargado;
  corregidos en caliente: interpolación de la basurita y `useWindowDimensions` ausente.
- **Pendientes:** confirmación visual del usuario del calendario/popover/genie/chips/formato
  y del cuadro en Resumen; reglas de novedades/cierre antes de F6; respaldo PDF restaurable.

## 2026-10-26 — Calendario estilo iOS: selección por doble tap y zoom año↔mes
- **Objetivo:** pedido del usuario tras probar la vista de año: comportamiento como el calendario
  oficial de iPhone — tap selecciona, segundo tap abre; animación al entrar/salir del año.
- **Hecho:** estado `selected`/`selectedMonth` en el calendario; día seleccionado con borde
  primario y accesibilidad ("seleccionado, toca de nuevo para abrir"); mismo patrón en
  miniaturas de mes. `Animated.Value` en estado con timing 240 ms ease-out: zoom 0.88→1 al
  entrar al mes, 1.12→1 al volver al año. Selección se limpia al cambiar de mes/año/modo.
- **Verificación:** 111/111 pruebas, `tsc` y `expo lint` en verde (corregido patrón ref→state
  para Animated y set-state-in-effect). Usuario reportó un **crash de Expo Go** al inicio de la
  sesión, sin mensaje capturado; pendiente reproducir/diagnosticar.
- **Pendientes:** validación visual del usuario; crash por diagnosticar; acumulado en Resumen;
  reglas de novedades/cierre y F6; F7. Sin commit ni push.

## 2026-10-26 — Hallazgos UI menores de la revisión aplicados
- **Objetivo:** cerrar los hallazgos menores pendientes de la revisión UI global del mismo día.
- **Hecho:** `snapshot` de `/registro` memoizado con `useMemo` (evitaba JSON.stringify por render);
  acción "Limpiar búsqueda" en Historial (botón secundario visible solo con texto escrito, no cierra
  el campo); marcas D/N/L/V del calendario con `maxFontSizeMultiplier` 1.1→1.3 y peso 600 para
  letra grande del sistema.
- **Verificación:** 111/111 pruebas (13 suites), `npx tsc --noEmit` y `npx expo lint` correctos.
- **Pendientes:** confirmación visual del usuario; decisión sobre acumulado en Resumen;
  reglas de novedades/cierre y F6; respaldo F7; npm audit. Sin commit ni push.

## 2026-10-26 — Vista de año en calendario, "Dato adicional" y revisión UI global
- **Objetivo:** rediseño pedido por el usuario: calendario estilo iPhone (año→mes), campos
  genéricos sin concepto "grúa" y menos botones/más tap.
- **Hecho:** tocar el nombre del mes abre vista de año con 12 miniaturas (mismos colores D-020,
  puntito si hay segunda marca, borde en mes actual); flechas cambian mes o año según la vista.
  "Campo opcional" renombrado a "Dato adicional" con placeholder "Ej.: Observaciones" (mismo
  modelo nombre/valor de D-017). Háptico de éxito al guardar con expo-haptics ~58.0.7 (D-022).
- **Revisión UI global:** CAMBIOS RECOMENDADOS. Aplicados: fechas `formatShortDate` en
  DateTimeField, háptico al guardar, eliminado botón deshabilitado de respaldo en onboarding,
  mapa `WARNING_LABELS` compartido en registro/detalle, etiqueta de búsqueda aclarada.
  Alto pendiente: propone acumulado de recargos+extras en Resumen — queda a decisión del usuario
  (él pidió solo aviso breve; compatible con D-020 pero no se aplicó).
  Menores pendientes: memoizar `snapshot`, "Limpiar búsqueda", marcas con letra grande.
- **Verificación:** 111/111 pruebas (13 suites), `npx tsc --noEmit`, `npx expo lint` y
  `npx expo-doctor` 20/20 correctos. Metro LAN 8083 levantado y app recargada en simulador;
  prueba visual de vista de año/háptico sin confirmar.
- **Pendientes:** validación del usuario; decisión sobre acumulado en Resumen; reglas de
  novedades/cierre y F6; respaldo F7; 5 avisos high de npm audit y auditoría dedicada.
  Sin commit ni push de este avance.

## 2026-10-25 — Cierre del día: memoria reconciliada con Git
- **Objetivo:** terminar la sesión sin programar más y dejar un punto claro de reanudación.
- **Hecho:** `git status --short` y `git diff --stat` vacíos al comenzar el cierre.
  El avance ya está en `bfceb39` (calendario directo, consulta separada y PDF de acumulados),
  después de `a9429a6` (F0/F1). Corregida memoria que aún decía «sin commit».
  El título «Fase 4» del commit no implica completar Fase 3: F6 sigue pendiente según ROADMAP.
  ESTADO compactado; ROADMAP conserva implementaciones marcadas y pruebas visuales/seguridad abiertas.
  D-020/D-021 y ARQUITECTURA ya documentaban flujo/dependencias: no hay nueva decisión técnica.
- **Verificación reejecutada:** 111/111 pruebas (13 suites), `npm run typecheck` y `npm run lint` correctos.
  Expo-doctor 20/20 y bundles iOS/Android HTTP 200 verificados antes en esta misma sesión;
  no se repitieron en este cierre. Prueba visual/PDF nativo no confirmados.
- **Pendientes:** validación del usuario; reglas de novedades/cierre, F6 y PDF salarial; respaldo
  restaurable F7; 5 avisos high de npm audit, auditoría dedicada y caché privada de PDFs.
  No se hizo commit ni push durante este cierre; quedan solo los cambios documentales del cierre.
  Estado del remoto no comprobado.

## 2026-10-25 — Rediseño solicitado: calendario directo, consulta y PDF de acumulados
- **Objetivo:** simplificar el flujo tras la revisión visual del usuario; registrar solo desde calendario.
- **Hecho:** calendario fijo sin scroll ni botones de registro/Ir a hoy, fecha actual al enfocar/reanudar,
  colores azul cielo/azul oscuro/verde/violeta con letras y leyenda, tap registra o consulta.
  Día 06–18 y Noche 18–06 calculan salida automáticamente; horario especial plegado y campos
  opcionales solo nombre/valor, sin selector de tipo. Consulta `/detalle` separada de edición.
  Historial compacto con importes, filtro por periodo y búsqueda, sin CTA de registro.
  Resumen solo muestra aviso breve de incompleto/no disponible, sin listas ni progreso (D-020).
- **PDF:** instalados expo-print 58.0.7 y expo-sharing 58.0.20 exactos por compatibilidad SDK 58;
  Historial genera informe de acumulados del periodo seleccionado, con consentimiento, escape HTML
  y sin recursos remotos. Aviso explícito: no es neto salarial ni respaldo restaurable (D-021).
  PDF de liquidación salarial mensual y JSON embebido siguen pendientes de F6/F7.
- **Revisiones:** QA 111 pruebas/tipos/lint correctos; UI ejecutada. Aplicados validación visible,
  formato de fechas y subtítulo de jornada; no se acepta reintroducir faltantes/CTA en Resumen
  porque contradice el pedido. Animaciones/háptica y comprobación visual siguen pendientes.
- **Seguridad:** npm audit --omit=dev reportó 5 high vía Expo CLI/code-signing/node-forge/zod;
  npm ls confirmó esas rutas y uso de zod en lint. No se aplicó --force (propone Expo 44),
  overrides ni cambios de políticas. Revisar actualización compatible y caché de PDFs privados.
- **Verificación:** 111 pruebas, tipos, lint y expo-doctor 20/20 correctos. PDF/colores probados
  con pruebas puras; exportación nativa y UI aún por confirmar por el usuario.
- **Pendientes:** prueba visual/nativa, estimación y PDF salarial F6, respaldo F7, vulnerabilidades.
  Sin commit ni push de este avance.

## 2026-10-25 — Continuación F2–F5: validación, respaldo y revisión UI
- **Objetivo:** completar el flujo de registro con campos informativos y novedades, sin liquidar datos parciales.
- **Hecho:**
  - Turnos y plantillas: crear/editar/eliminar, fechas/horas nativas con @expo/ui existente, notas,
    campos texto/número/alfanuméricos y reutilización de nombres, sin alterar importes (probado).
  - Novedades por jornada de inicio: descanso remunerado, permiso remunerado/no remunerado e incapacidad.
    No se calcula aún su efecto monetario. Noche seguida de descanso permitida (D-019).
  - SQLite v2 conserva datos de v1; guardado validado transaccional; respaldo formato 2 incluye
    campos/novedades y migra formato 1 (D-018). Borrado/restauración incluyen novedades.
  - Calendario mensual con festivos y registros; historial FlatList con periodo/búsqueda.
    Resumen solo muestra acumulado y jornadas faltantes, sin neto ni descuento mensual proyectado.
  - Revisión UI: aplicados desglose expandible de horas/importes, fechas legibles, memoización,
    valores largos, límites de letra en celdas, CTA sin plantillas y error/reintento de carga inicial.
    Cancelar confirma solo cambios; Atrás Android protegido y gesto de cierre deshabilitado en registro.
  - Añadidas pruebas de límites de plantilla/campos/notas, periodo inválido y cobertura entre años.
- **Verificación:** 107/107 pruebas, tipos y lint correctos; expo-doctor 20/20.
  Bundles iOS y Android HTTP 200. Recarga y enlace a `/registro` enviados al simulador; no sustituye prueba visual.
- **Pendientes:** usuario debe probar turno nocturno con Grúa: RTG19, edición/borrado, descanso siguiente,
  plantillas, teclado/letra grande/oscuro y persistencia. F6: cierre/reapertura, básico por novedades,
  aportes y FSP/retención sobre mes real. Mantener pruebas sugeridas por auditoría de la entrada siguiente.
  Animaciones/háptica, permisos por horas y PDF pendientes. Sin commit ni push de este avance.

## 2026-10-26 — Auditoría del motor + avance F2–F5 (registro, novedades, calendario, historial)
- **Objetivo:** auditar `src/domain/` contra `REGLAS_LEGALES.md` y registrar el avance de Fase 3.
- **Hecho:**
  - Auditoría completa del motor: veredicto **APROBADO**. Sección por sección verificada
    (divisor 210 desde 2026-07-15, nocturno 19:00 desde 2025-12-25, dominical 80/90/100 %,
    factores §4.1, festivos 2026 día por día, deducciones, FSP ambas tablas, retención proc. 1).
    4 cálculos manuales coinciden con las pruebas (71.429 / 240.715 / 217.143 / 617.000).
  - Observaciones menores (no bloquean): retención quincenal puede dar 308.500 (no múltiplo de
    $1.000); motor aún proyecta quincena ×2 (D-012, ya reemplazada por D-015, implementación pendiente).
  - Pruebas sugeridas para agregar: frontera 20:59/21:00 pre-2025-12-25, dominical 100 % a nivel
    turno, FSP en 17/18 SMMLV, tramos altos de retención con valores literales, festivo en domingo.
  - En el árbol de trabajo (sin commit) hay implementado: `/registro` (crear/editar/eliminar turno
    o novedad), `/plantillas`, `record-card`/`record-fields`, calendario con festivos y registros,
    historial con filtro por periodo y búsqueda, migración DB v2 (`fields_json`, `novelties`),
    `domain/records.ts` (validación, `accruedForPeriod`, `recordCoverage`). Resumen muestra
    acumulado y cobertura, sin liquidación (a propósito, hasta D-015/D-016).
- **Verificación:** `npm test` → 103/103 ✅; `npx tsc --noEmit` ✅. Lint y expo-doctor pendientes.
- **Pendientes:** ajuste del básico por novedades y liquidación con cierre/reapertura (F6);
  `/revision-ui` de las pantallas nuevas; commit y push del avance; pruebas de la auditoría.

## 2026-10-25 — Prueba visual inicial y requisitos de nómina/novedades
- **Objetivo:** abrir la app y precisar cómo registrar operación diaria y liquidar periodos completos.
- **Hecho:** Expo Go instalado; apertura con localhost fallaba (servidor IPv6, enlace IPv4).
  Metro LAN puerto 8083 respondió `packager-status:running`; simulador solicitó bundle iOS
  (1352 módulos). Usuario confirmó: «se ve excelente». No implica checklist visual completo.
- **Confirmado:** incapacidad al 75 % por condición empresarial; FSP/retención se descuentan
  en última quincena con mes real completo; descanso remunerado incluido en básico, sin alterar valor.
  Registrar descansos/novedades como turnos. Campos personalizados informativos por turno con
  nombre y valor texto/número/alfanumérico: ejemplo Grúa → RTG19, sin efecto en cálculos.
- **Documentación:** PRD y ROADMAP incorporan requisitos; D-015 reemplaza la proyección quincenal
  de D-012; D-016 novedades en MVP y 75 % empresarial; D-017 campos informativos.
- **Verificación:** solo documentación en este tramo; motor y REGLAS_LEGALES sin modificar.
  Última verificación de código: 88 pruebas, tipos, lint y expo-doctor 20/20 correctos.
- **Pendientes:** especificar cierre/reapertura, tratamiento de novedades y revisión legal antes del motor;
  implementar F2–F6 con estas reglas. El resumen actual aún no las aplica. Sin commit ni push.

## 2026-10-25 — Fase 3: onboarding real y Ajustes editables
- **Objetivo:** simulador grande, F0 y F1 (resto de Fase 3 fuera de esta sesión).
- **Hecho:**
  - F0: siete pasos con aviso legal explícito, salario formateado/valor hora, auxilio sin preselección,
    periodo, jornada, selección de plantillas y resumen editable. Omitir usa valores predeterminados.
  - F1: borrador editable, validación por campo, guardar/descartar, divisor y porcentajes opcionales,
    restaurar valores de ley y factores en vivo. Aviso de recálculo del historial y año sin parámetros.
  - `settings-fields.tsx` y `lib/settings-form.ts` comparten campos y validaciones; sin dependencias nuevas.
  - `completeOnboarding` guarda configuración y plantillas atómicamente; prueba de rollback.
    Borrar todo ahora repone las plantillas predeterminadas, incluso tras desmarcarlas todas.
  - `Screen` con footer fijo y teclado; botones con etiqueta accesible, opciones radio/checkbox.
  - Simulador nuevo creado y arrancado: TurnosApp iPhone 18 Pro Max, iOS 27.0,
    `EB5FAFDF-45F8-48BA-800F-5B884C38F8F9`. El identificador previo dejó de existir.
- **Verificación:** 88/88 pruebas; tipos y lint correctos; expo-doctor 20/20.
  Metro compiló el bundle iOS (1252 módulos; HTTP 200). No equivale a prueba funcional en dispositivo.
- **Pendientes:** apertura visual bloqueada: no se encuentra Simulator.app; el simulador no abre
  `exp://127.0.0.1:8081` (error 115, sin manejador Expo Go). Usuario debe ayudar desde Xcode/Developer.
  Revisar teclado, modo oscuro, letra grande, persistencia y navegación en dispositivo.
  Animaciones/háptica pendientes de pulido; PDF deshabilitado explícitamente hasta Fase 3.6.
  F2–F6 y revisión UI global siguen pendientes. Sin commit ni push.

## 2026-10-24 — Cierre: repo en GitHub y ajuste de consumo de tokens
- **Objetivo:** publicar el proyecto en GitHub y optimizar el consumo de créditos de Devin.
- **Hecho:**
  - `gh auth login` completado por el usuario (navegador, tras confusión token vs. código one-time).
  - Repo creado y subido desde el editor: `origin` = https://github.com/natanaelr16/TurnosApp.git,
    `main` remota en `ad0880b` = local. Verificado con `git ls-remote`.
  - Config global `~/.config/devin/config.json`: `agent.model: adaptive` (enruta barato/potente
    según la tarea) y `agent.subagent_model: swe` (subagentes baratos).
  - Usuario pidió probar en simulador **iPhone Pro Max (18)** con compatibilidad global → tarea en ROADMAP.
- **Verificación:** `git status` limpio; `ls-remote` confirma sync.
- **Pendientes:** crear el simulador Pro Max y arrancar Fase 3 (onboarding F0).

## 2026-10-24 — Fase 2: datos y estructura de la app
- **Objetivo:** base de datos local, navegación, tema y quitar la plantilla.
- **Hecho:**
  - Usuario confirmó datos solo en el teléfono y pidió respaldo en PDF restaurable → PRD F7, D-014,
    CUMPLIMIENTO (aviso de privacidad), ROADMAP Fase 3.6. Formato de respaldo adelantado en `domain/backup.ts`.
  - `expo-sqlite` + migraciones + repositorio; pruebas con SQLite real de Node (incluye exportar→restaurar
    en "teléfono nuevo" y restauración atómica).
  - `AppDataProvider`, `Stack.Protected` (onboarding/tabs), pestañas nativas, pantallas base, tema semántico,
    `lib/format.ts`. Plantilla de Expo eliminada; `@types/node` agregado (solo para pruebas).
  - Revisión UI (subagente): contraste AA OK; aplicados: ValueRow con letra grande, `Screen scroll`,
    Button `disabled`, EmptyState con acción, import de CSS movido al layout.
- **Verificación:** `npm test` 80/80 ✅; `tsc` ✅; `expo lint` ✅; `expo-doctor` 20/20 ✅; Metro compila y
  carga en Expo Go (simulador iPhone) sin errores. Captura de pantalla no disponible desde el agente.
- **Pendientes:** Fase 3.

## 2026-10-24 — Validación contra planilla real y corrección del pago dominical
- **Objetivo:** comparar el motor con 3 reportes reales de nómina del usuario (jul, sep, oct 2026).
- **Hecho:**
  - Coinciden: valor hora (salario ÷ 210), nocturno desde 19:00, extras después de 8 h, factores 1,25/0,35/1,75/2,15/2,65.
  - **Error encontrado:** horas ordinarias dominicales/festivas se pagaban 0,90/1,25; la planilla y el Art. 179
    ("sin perjuicio del salario ordinario") indican 1,90/2,25. Corregido (D-013) con opción `solo-recargo`.
  - Pruebas nuevas con cifras exactas de la planilla. PRD: opción en onboarding/ajustes, tabla de factores,
    futuras novedades (permiso, descanso…) y vista "planilla" (Fase 3.5).
- **Verificación:** `npm test` → 56/56 ✅; `tsc` sin errores nuevos (solo el conocido de la plantilla).
- **Pendientes:** confirmar almacenamiento local; Fase 2.

## 2026-10-24 — Fase 1: motor de cálculo
- **Objetivo:** implementar y probar el cálculo legal de turnos y nómina.
- **Hecho:**
  - Jest (`jest-expo`) configurado; scripts `test`, `test:watch`, `typecheck`. ESLint configurado por `expo lint`.
  - `src/domain/`: `types`, `time`, `holidays`, `legal-params`, `shift-calc`, `payroll`, escrito con pruebas primero.
  - Usuario confirmó límite de 8 h/día; ejemplos 06–18 (4 h extra diurna) y 18–06 (nocturno desde 19:00, 4 h extra nocturna).
  - Revisión legal (subagente auditor): H1 propuso sacar el auxilio de la base de retención → **descartado** tras
    verificar doctrina DIAN (sí es base); se corrigió REGLAS_LEGALES §6–7. H2/H3 documentados (D-011, D-012).
    H4: `hasYearlyParams()`. Se agregaron 9 pruebas de borde sugeridas.
- **Verificación:** `npm test` → 50/50 ✅; `npx tsc --noEmit` → solo 1 error en plantilla; `npx eslint src/domain` ✅.
- **Pendientes:** Fase 2; confirmar almacenamiento local.

## 2026-10-24 — Requisitos: auxilio de transporte opcional y onboarding
- **Objetivo:** incorporar pedidos del usuario antes de programar.
- **Hecho:** PRD F0 (onboarding guiado) y F1 (auxilio Sí/No manual); REGLAS_LEGALES §6 (auxilio solo si está
  activado); ARQUITECTURA (modelo `transportAllowance`, redirección a `onboarding/`); DISENO (pantallas de
  onboarding); ROADMAP; decisiones D-009 y D-010.
- **Verificación:** no aplica (solo documentación).
- **Pendientes:** respuesta del usuario sobre límite diario y almacenamiento local; Fase 1.

## 2026-10-24 — Fase 0: fundaciones
- **Objetivo:** crear el proyecto, la documentación y el sistema de agentes.
- **Hecho:**
  - Proyecto Expo SDK 58 creado en `~/Developer/TurnosApp`.
  - Docs: `PRD`, `REGLAS_LEGALES` (normativa vigente a oct-2026 verificada en fuentes oficiales), `ARQUITECTURA`, `DISENO`, `CUMPLIMIENTO`, `ROADMAP`, `DECISIONES`, `ESTADO`.
  - Agentes Devin: `legal-reviewer`, `ui-designer`, `qa-tester`, `store-compliance`.
  - Skills: `/iniciar-sesion`, `/cerrar-sesion`, `/nueva-funcionalidad`, `/verificar`, `/revision-legal`, `/revision-ui`, `/actualizar-normativa`.
  - Hooks: al iniciar sesión se inyecta `ESTADO.md`; al terminar se bloquea una vez si hubo cambios en código sin actualizar `ESTADO.md`.
- **Verificación:** no aplica (sin lógica de negocio todavía).
- **Pendientes:** Fase 1 (motor de cálculo).
