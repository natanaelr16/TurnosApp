# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-25
**Fase actual:** Fase 3 — MVP en curso. F0/F1 implementados; usuario confirma buen aspecto en simulador.

## Qué existe hoy
- **Motor** `src/domain/`: cálculo validado contra planilla real (D-013), respaldo versionado,
  validación y combinación (`backup.ts`), valores predeterminados y `factorTable()`.
- **Datos** `src/data/`: SQLite, migraciones, settings JSON, turnos, plantillas Día/Noche,
  restauración atómica. `completeOnboarding` guarda settings + plantillas en una transacción.
  Borrar todo repone las plantillas predeterminadas. Pruebas con SQLite real de Node.
- **App**: `AppDataProvider`, `Stack.Protected` → onboarding o pestañas nativas.
- **F0**: siete pasos, aceptación legal, salario/valor hora, auxilio Sí/No sin preselección,
  periodo, jornada/pago dominical, plantillas, resumen editable y guardado atómico.
- **F1**: salario, auxilio, periodo, jornada, divisor/porcentajes; guardar/descartar,
  restaurar ley, vista previa de factores y borrar datos. Campos y validación compartidos.
- Última verificación de código: **88 pruebas, tipos, lint y expo-doctor 20/20 correctos**.
- Simulador TurnosApp iPhone 18 Pro Max iOS 27.0 abierto con Expo Go.
  Metro LAN: `npx expo start --go --lan --port 8083`; usuario: «se ve excelente».
- Datos locales + respaldo PDF confirmados (D-014). PDF pendiente de Fase 3.6.
- Repo: https://github.com/natanaelr16/TurnosApp. Cambios de esta sesión sin commit ni push.

## Requisitos confirmados, todavía NO implementados (D-015–D-017)
- Resumen: liquidar solo con registros completos; no presentar neto completo con datos parciales.
- FSP/retención en última quincena usando mes real completo, no quincena ×2.
- Registrar descansos/novedades junto a turnos. Descanso remunerado incluido en básico,
  sin sumar/restar ni generar horas; permisos diferenciados por remuneración.
- Incapacidad al 75 %: condición empresarial del usuario, no regla legal general.
- Campos por turno con nombre y valor texto/número/alfanumérico (Grúa → RTG19), sin efecto contable.

## Siguiente paso
1. Especificar novedades y cierre/reapertura de periodos; actualizar reglas legales y pruebas.
2. F2: turnos/plantillas + campos personalizados + descansos/novedades; F3 calendario → F4 detalle
   → F5 historial (`Screen scroll={false}` + FlatList) → F6 liquidación con mes completo.
3. Fase 3.6: PDF restaurable; validar librería para incrustar JSON con Expo SDK 58.

## Problemas conocidos / pendientes de verificar
- Motor/resumen aún usan básico completo y quincena proyectada: contradicen los requisitos nuevos;
  migración pendiente. No considerar la liquidación actual adaptada a D-015/D-016.
- Simulador `EB5FAFDF-45F8-48BA-800F-5B884C38F8F9`. Expo localhost falló por IPv4/IPv6;
  LAN puerto 8083 resolvió la apertura. Capturas negras; revisión visual del usuario.
- Falta probar teclado, letra grande, oscuro, persistencia, Android y padding inferior en iPhone real.
- Animaciones/háptica y PDF pendientes. Provider recarga toda BD; carga inicial sin UI de error.

## UI debe recordar
- Avisos de año sin parámetros, extras y validación de turnos; privacidad al exportar PDF.

## Decisiones pendientes / riesgos
- Concretar cierre/reapertura sin asumir que días vacíos son descansos.
- Revisar bases, mínimos y duración/tipo de incapacidad antes de programar el 75 % empresarial.
- REGLAS_LEGALES y motor conservan reglas anteriores hasta su revisión; no se modificaron hoy.
