# Roadmap

Marcar `[x]` al completar. Cada fase termina con `/verificar` en verde y `ESTADO.md` actualizado.

## Fase 0 — Fundaciones
- [x] Proyecto Expo SDK 58 creado
- [x] Documentación base (PRD, reglas legales, arquitectura, diseño, cumplimiento)
- [x] Agentes, skills y hooks de Devin
- [x] Repositorio en GitHub (https://github.com/natanaelr16/TurnosApp, `main` sincronizada)

## Fase 1 — Motor de cálculo (`src/domain/`)
- [x] Configurar Jest (`jest-expo`) y script `npm test`
- [x] `time.ts` y `holidays.ts` con pruebas (festivos 2025–2027)
- [x] `legal-params.ts` (parámetros por fecha) con pruebas
- [x] `shift-calc.ts`: clasificación minuto a minuto, extras diarios/semanales, valores
- [x] Casos de prueba: 06–18, 18–06, sábado→domingo, festivo, turno de 4 h, semana con extras
- [x] `payroll.ts`: devengado, auxilio (solo si está activado), salud, pensión, FSP, retención estimada
- [x] `/revision-legal` aplicada (hallazgos resueltos o documentados en D-011/D-012)

## Fase 2 — Datos y estructura de la app
- [x] `expo-sqlite`: tablas, migraciones, repositorios
- [x] Navegación por pestañas (Calendario, Historial, Resumen, Ajustes) + redirección a onboarding
- [x] Tema y colores semánticos
- [x] Eliminar pantallas de ejemplo de la plantilla (resuelve los errores de tipos/lint conocidos)
- [ ] Futuro: historial de salarios (hoy todo el historial se recalcula con el salario actual)

## Fase 3 — Funcionalidades MVP
- [x] Crear simulador iPhone 18 Pro Max (2026-10-25: TurnosApp iPhone 18 Pro Max, iOS 27.0)
- [x] Abrir app en pantalla grande: Expo Go + Metro LAN puerto 8083; usuario confirma que se ve excelente
- [ ] Especificar y revisar reglas de novedades/cierre mensual (D-015/D-016), actualizar REGLAS_LEGALES y pruebas antes de modificar el motor
- [x] Onboarding guiado al primer uso: aviso legal, salario, auxilio de transporte Sí/No, periodo, jornada, plantillas (F0; PDF pendiente de Fase 3.6)
- [x] Ajustes editables (F1), divisor/porcentajes, restaurar ley y vista previa
- [ ] Validación visual F0/F1 en iOS/Android: teclado, letra grande, oscuro, persistencia y navegación
- [ ] Pulido F0/F1: animaciones de transición (háptico al guardar hecho 2026-10-26, D-022)
- [x] Crear/editar/eliminar turno + plantillas (F2; pantallas `/registro` y `/plantillas`)
- [x] Campos personalizados informativos por turno: nombre + valor texto/número/alfanumérico (D-017; `fields_json`)
- [x] Registrar descansos, permisos remunerados/no remunerados e incapacidad con los turnos (D-016; tabla `novelties`; ajuste monetario pendiente)
- [ ] Ajustar básico por novedades y liquidación al completar periodo; FSP/retención en última quincena sobre mes real (D-015/D-016) — básico por día pago (D-027), incapacidad 75 % del promedio (D-028) y deducciones/neto estimado (D-029) hechos; faltan ingresos extra y cierre/reapertura
- [x] Calendario (F3; grilla mensual con festivos y registros por día)
- [x] Detalle de turno (F4; consulta `/detalle` separada de edición, horas extra y recargos)
- [x] Historial (F5; lista por periodo con búsqueda, turnos y novedades)
- [x] Resumen de pago (F6): cuadro de liquidación, básico prorrateado con tope 15 días, incapacidad 75 % del promedio, deducciones reales, neto estimado, ingreso adicional por periodo y cierre/reapertura (D-026 a D-032). Falta formato "planilla" en PDF (línea 64)
- [ ] `/revision-ui` aprobada (revisión global 2026-10-26 ejecutada: medios aplicados; alto pendiente = acumulado en Resumen a decisión del usuario; falta validación visual)
- [ ] Prueba visual F2–F5: noche con Grúa: RTG19, editar/eliminar, descanso siguiente día, plantillas y persistencia
- [x] Migración SQLite v2 + respaldo formato 2 con compatibilidad formato 1 (D-018)
- [x] Desglose expandible por categoría y avisos de extras en detalle del turno
- [x] Pantalla de error/reintento de carga de datos
- [x] Rediseño D-020: calendario sin scroll ni CTA, tap registra/consulta, colores día/noche/descanso/novedad
- [x] Registro rápido 06/18, salida automática y campos opcionales nombre/valor sin selector de tipo
- [x] Historial sin botones de registro; Resumen sin acumulados/progreso/faltantes ni CTA
- [ ] Validar en simulador y pantallas pequeñas calendario completo, colores, consulta separada y PDF
- [x] Vista de año estilo iPhone: tap en nombre del mes → 12 miniaturas con colores → tap abre el mes (D-022)
- [x] Campos renombrados a "Dato adicional" (ej.: Observaciones); háptico al guardar (expo-haptics ~58.0.7)
- [x] Decidir si Resumen muestra acumulado de recargos+extras del periodo → sí (D-026)
- [x] Hallazgos UI menores: memoizar `snapshot` en registro, "Limpiar búsqueda" en Historial, marcas con letra grande
- [x] Calendario estilo iOS completo (D-023/D-024): swipe entre meses, scroll por años, selector de bloques de 12, colores selección/actual diferenciados, marcas en esquina, popover por pulsación larga, zoom "genie", eliminación con basurita animada y en `/detalle`
- [x] Creación rápida con chips de turnos programados y formato de hora 12/24 global (D-025)
- [x] Resumen con cuadro de liquidación del periodo estilo planilla (D-026; validado con datos reales oct 1–15)
- [ ] Validar en simulador: swipe de meses, scroll de años, selector, popover, genie, basurita, chips y formato 12/24

## Fase 3.5 — Extras inspirados en la planilla real
- [ ] Vacaciones y otras novedades (Descanso, Permiso e Incapacidad ya registrables en Fase 3; liquidación pendiente)
- [ ] Permisos por horas (hoy novedades solo por jornada completa, D-019)
- [x] Vista "planilla" + cuadro "Detalle de liquidación" (concepto, factor, horas, valor) — Resumen (D-026), PDF de turnos y de liquidación (D-034)
- [x] Vista "Mes completo" en Resumen con FSP/retención del mes y umbrales legales visibles; PDF de mes completo (D-036)
- [ ] `/revision-legal` del tope de básico/fracción por duración del periodo (D-036)

## Fase 3.6 — Respaldo en PDF (F7, D-014)
- [x] Formato de respaldo versionado + validación (`src/domain/backup.ts`) — adelantado en Fase 2
- [x] PDF legible de acumulados del periodo desde Historial + compartir y aviso de privacidad (D-021; pendiente prueba nativa)
- [x] Incorporar liquidación salarial quincenal/mensual al PDF al completar F6 (básico, novedades, bonificación, deducciones y neto estimado ya están en el informe)
- [x] Incrustar JSON de respaldo en PDF (`lib/backup-file.ts`, D-033; el PDF de respaldo es restaurable)
- [x] Importar PDF (`expo-document-picker`), leer respaldo, resumen y confirmación; restaura reemplazando todos los datos
- [x] Opción "Ya tengo un respaldo" en el onboarding (D-034)
- [x] Tres PDFs distintos: respaldo, turnos con colores del calendario y liquidación coloreada (D-034)
- [x] Respaldo cifrado opcional con contraseña + código de recuperación local (D-038): onboarding, Ajustes (activar/cambiar/recuperar/quitar), importar pide secreto
- [ ] Prueba real del ciclo exportar→restaurar en dispositivo/simulador

## Fase 4 — Pulido y publicación
- [x] Aviso legal inicial, borrar datos, política de privacidad (POLITICA_PRIVACIDAD.md lista; falta publicarla en URL y enlazarla en Ajustes)
- [x] Ícono y splash definitivos (calendario D/N/L/V sobre azul; adaptativos Android)
- [ ] Pruebas en dispositivo real iOS y Android
- [ ] Resolver/revisar avisos high de npm audit en Expo CLI/zod/deepmerge con actualización compatible (sin --force ni downgrade SDK; node-forge corregido 2026-10-29, quedan 3 en deps de desarrollo)
- [ ] Limpiar caché de PDFs privados al borrar todos los datos y definir retención temporal
- [ ] Auditoría de seguridad dedicada (no sustituida por lint/pruebas/doctor)
- [ ] Cuenta Apple Developer ($99 USD/año) — trámite del usuario en developer.apple.com
- [x] Configurar `eas.json`, bundle identifier e ícono de la app
- [ ] Builds con EAS y publicación/TestFlight (checklist de `CUMPLIMIENTO.md`)
