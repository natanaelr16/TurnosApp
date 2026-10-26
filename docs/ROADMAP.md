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
- [ ] Crear/editar/eliminar turno + plantillas (F2)
- [ ] Campos personalizados informativos por turno: nombre + valor texto/número/alfanumérico (D-017)
- [ ] Registrar descansos, permisos remunerados/no remunerados e incapacidad con los turnos (D-016)
- [ ] Ajustar básico por novedades y liquidación al completar periodo; FSP/retención en última quincena sobre mes real (D-015/D-016)
- [ ] Calendario (F3)
- [ ] Detalle de turno (F4)
- [ ] Historial (F5)
- [ ] Resumen de pago (F6)
- [ ] `/revision-ui` aprobada

## Fase 3.5 — Extras inspirados en la planilla real
- [ ] Vacaciones y otras novedades (Descanso, Permiso e Incapacidad adelantados a Fase 3; aún pendientes)
- [ ] Vista "planilla" + cuadro "Detalle de liquidación" (concepto, factor, horas, valor)

## Fase 3.6 — Respaldo en PDF (F7, D-014)
- [x] Formato de respaldo versionado + validación (`src/domain/backup.ts`) — adelantado en Fase 2
- [ ] Generar PDF legible (`expo-print`) con JSON embebido y compartir (`expo-sharing`)
- [ ] Importar PDF (`expo-document-picker`), leer respaldo, vista previa y confirmación (reemplazar/combinar)
- [ ] Opción "Ya tengo un respaldo" en el onboarding

## Fase 4 — Pulido y publicación
- [ ] Aviso legal inicial, borrar datos, política de privacidad
- [ ] Ícono y splash definitivos
- [ ] Pruebas en dispositivo real iOS y Android
- [ ] Builds con EAS y publicación (checklist de `CUMPLIMIENTO.md`)
