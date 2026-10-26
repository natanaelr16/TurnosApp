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
- [ ] Pulido F0/F1: animaciones de transición y feedback háptico
- [x] Crear/editar/eliminar turno + plantillas (F2; pantallas `/registro` y `/plantillas`)
- [x] Campos personalizados informativos por turno: nombre + valor texto/número/alfanumérico (D-017; `fields_json`)
- [x] Registrar descansos, permisos remunerados/no remunerados e incapacidad con los turnos (D-016; tabla `novelties`; ajuste monetario pendiente)
- [ ] Ajustar básico por novedades y liquidación al completar periodo; FSP/retención en última quincena sobre mes real (D-015/D-016)
- [x] Calendario (F3; grilla mensual con festivos y registros por día)
- [x] Detalle de turno (F4; consulta `/detalle` separada de edición, horas extra y recargos)
- [x] Historial (F5; lista por periodo con búsqueda, turnos y novedades)
- [ ] Resumen de pago (F6)
- [ ] `/revision-ui` aprobada (revisión F2–F5 ejecutada; hallazgos altos/medios aplicados, falta validación visual)
- [ ] Prueba visual F2–F5: noche con Grúa: RTG19, editar/eliminar, descanso siguiente día, plantillas y persistencia
- [x] Migración SQLite v2 + respaldo formato 2 con compatibilidad formato 1 (D-018)
- [x] Desglose expandible por categoría y avisos de extras en detalle del turno
- [x] Pantalla de error/reintento de carga de datos
- [x] Rediseño D-020: calendario sin scroll ni CTA, tap registra/consulta, colores día/noche/descanso/novedad
- [x] Registro rápido 06/18, salida automática y campos opcionales nombre/valor sin selector de tipo
- [x] Historial sin botones de registro; Resumen sin acumulados/progreso/faltantes ni CTA
- [ ] Validar en simulador y pantallas pequeñas calendario completo, colores, consulta separada y PDF

## Fase 3.5 — Extras inspirados en la planilla real
- [ ] Vacaciones y otras novedades (Descanso, Permiso e Incapacidad ya registrables en Fase 3; liquidación pendiente)
- [ ] Permisos por horas (hoy novedades solo por jornada completa, D-019)
- [ ] Vista "planilla" + cuadro "Detalle de liquidación" (concepto, factor, horas, valor)

## Fase 3.6 — Respaldo en PDF (F7, D-014)
- [x] Formato de respaldo versionado + validación (`src/domain/backup.ts`) — adelantado en Fase 2
- [x] PDF legible de acumulados del periodo desde Historial + compartir y aviso de privacidad (D-021; pendiente prueba nativa)
- [ ] Incorporar liquidación salarial quincenal/mensual al PDF al completar F6
- [ ] Incrustar JSON de respaldo en PDF (el PDF de acumulados actual NO es restaurable)
- [ ] Importar PDF (`expo-document-picker`), leer respaldo, vista previa y confirmación (reemplazar/combinar)
- [ ] Opción "Ya tengo un respaldo" en el onboarding

## Fase 4 — Pulido y publicación
- [ ] Aviso legal inicial, borrar datos, política de privacidad
- [ ] Ícono y splash definitivos
- [ ] Pruebas en dispositivo real iOS y Android
- [ ] Resolver/revisar 5 avisos high de npm audit en Expo CLI/node-forge/zod con actualización compatible (sin --force ni downgrade SDK)
- [ ] Limpiar caché de PDFs privados al borrar todos los datos y definir retención temporal
- [ ] Auditoría de seguridad dedicada (no sustituida por lint/pruebas/doctor)
- [ ] Builds con EAS y publicación (checklist de `CUMPLIMIENTO.md`)
