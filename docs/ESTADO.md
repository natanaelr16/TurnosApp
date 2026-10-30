# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-30 — **respuesta ya enviada a Apple** (la
versión quedó "Rechazado" a la espera de que procesen la respuesta — flujo normal).
Política publicada en GitHub público y enlazada en Ajustes (D-044). PDFs corregidos
(D-042) y **EAS Update configurado (D-043)**: el build 3 saldrá con canal OTA —
los cambios JS llegarán sin compilar (`eas update --channel production`).
**Fase actual:** Fase 4 — esperando resultado de revisión; además: pegar URL de
política en ASC, declaración de encriptación, build 3 (incluye fix PDFs + OTA +
tarjeta legal), beta externo.
**Git:** último commit `21f5654`, `main` sincronizada con origin (push hecho).

## Qué existe hoy
- Motor puro de turnos/nómina validado con planilla real (D-013); auditoría en BITACORA.
- SQLite v2 + respaldo JSON formato 2 (compatible con 1), restaurable desde PDF
  (onboarding y Ajustes), con cifrado opcional AES-256 probado en iPhone real (D-038).
- Onboarding de 7 pasos, Ajustes editables, gestión de plantillas.
- Calendario estilo iOS completo (D-020–D-024): swipe, años, zoom genie, popover por
  pulsación larga, eliminación animada; marcas D/N/L/V.
- Registro con chips de horarios, plantillas Día/Noche, dato adicional nombre+valor,
  háptico al guardar; formato de hora 12/24 global (D-025).
- `/detalle` con editar/eliminar; Historial con búsqueda y PDF; Resumen con cuadro
  de liquidación del periodo y vista "Mes completo" (D-026–D-036): básico por día
  pago, incapacidad 75 %, deducciones, FSP/retención solo al final del mes sobre el
  mes real, bonificación por periodo, cierre/reapertura de periodo.
- Tres PDFs (`lib/period-report.ts`, D-033/D-034/**D-042**): respaldo (JSON
  incrustado), turnos (**lista única cronológica, compacta, badges D/N/L/V**) y
  liquidación (**FSP/retención con el mes completo; nota de bonificación de la otra
  quincena**).
- Pestañas `NativeTabs` con cambio instantáneo; PDFs con nombre descriptivo.
- Ícono/splash definitivos, `com.natanaelr16.turnosapp`, `privacyManifests`,
  `ITSAppUsesNonExemptEncryption:true` (el build 2 salió con `false`), `eas.json`
  con `ascAppId` 6828459921; política lista en `docs/POLITICA_PRIVACIDAD.md`.
- Tienda: ficha completa, assets promo, 4 capturas en 1320×2868 y 1179×2556;
  versión 1.0 enviada a revisión (build 2).

## Verificación al cerrar
- **138/138 pruebas (14 suites), tipos y lint en verde**; incluye orden cronológico
  del PDF de turnos, retención de 2ª quincena con mes completo y nota de
  bonificación cruzada.
- Metro LAN puerto 8083; sesión expo.dev activa; app probada en iPhone real.

## En curso / siguiente sesión
1. **Esperar resultado de la revisión** (respuesta enviada 2026-10-30; si Apple
   pide algo más o aprueba, llega por correo).
2. **Pegar la URL de política** `github.com/natanaelr16/TurnosApp/blob/main/docs/
   POLITICA_PRIVACIDAD.md` en la ficha de ASC (y como URL de soporte).
3. **Verificación visual de los PDFs corregidos** en el iPhone (retención,
   bonificación, planilla compacta cronológica) y de la tarjeta "Información y legal".
4. Migrar datos Expo Go → app oficial con PDF de respaldo (el usuario lo hace).
5. Declaración de encriptación (D-040): "solo algoritmos estándar" → código →
   `ITSEncryptionExportComplianceCode` en `app.json` → **build 3** (incluye fix
   PDFs D-042, OTA D-043 y tarjeta legal D-044).
6. Beta externo para clientes (D-041): grupo TestFlight + link público +
   instrucciones; los builds caducan a 90 días.
7. `/revision-legal` recomendada (D-036). Limpieza de caché de PDFs.

## Decisiones pendientes con el usuario / bloqueos
- Respuesta a App Review enviada; esperando resultado.
- EAS Update configurado (D-043); CI/CD con GitHub Actions: propuesto, decisión pendiente.
- Repo GitHub **público** confirmado (D-044) y sincronizado (`main` al día).
- Restaurar reemplaza todos los datos (sin mezclar): confirmar que así lo quiere.

## Riesgos que retomar
- npm audit: 3 high en deps de desarrollo (deepmerge, zod vía Expo CLI); no van en
  la app; `--force` bajaría a Expo 51 → no aplicar; auditoría dedicada pendiente.
- Limpieza de caché de PDFs privados al borrar datos; provider recarga toda la BD.
- Revisión visual del usuario de los PDFs corregidos (D-042).

## Recordatorios
- No reintroducir CTA de registro en Historial/Resumen ni listas de días faltantes.
- Novedades por fecha de inicio (D-019); no inferir descansos.
- Salud/pensión 4 % sobre devengado; FSP/retención solo al final del mes sobre el
  mes real (el PDF ya no los calcula con medio mes — D-042).
