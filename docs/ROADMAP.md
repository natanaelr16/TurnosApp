# Roadmap

Marcar `[x]` al completar. Cada fase termina con `/verificar` en verde y `ESTADO.md` actualizado.

## Fase 0 — Fundaciones
- [x] Proyecto Expo SDK 58 creado
- [x] Documentación base (PRD, reglas legales, arquitectura, diseño, cumplimiento)
- [x] Agentes, skills y hooks de Devin
- [ ] Repositorio en GitHub (requiere `gh auth login` del usuario)

## Fase 1 — Motor de cálculo (`src/domain/`)
- [x] Configurar Jest (`jest-expo`) y script `npm test`
- [x] `time.ts` y `holidays.ts` con pruebas (festivos 2025–2027)
- [x] `legal-params.ts` (parámetros por fecha) con pruebas
- [x] `shift-calc.ts`: clasificación minuto a minuto, extras diarios/semanales, valores
- [x] Casos de prueba: 06–18, 18–06, sábado→domingo, festivo, turno de 4 h, semana con extras
- [x] `payroll.ts`: devengado, auxilio (solo si está activado), salud, pensión, FSP, retención estimada
- [x] `/revision-legal` aplicada (hallazgos resueltos o documentados en D-011/D-012)

## Fase 2 — Datos y estructura de la app
- [ ] `expo-sqlite`: tablas, migraciones, repositorios
- [ ] Navegación por pestañas (Calendario, Historial, Resumen, Ajustes)
- [ ] Tema y colores semánticos
- [ ] Eliminar pantallas de ejemplo de la plantilla (resuelve los errores de tipos/lint conocidos)
- [ ] Futuro: historial de salarios (hoy todo el historial se recalcula con el salario actual)

## Fase 3 — Funcionalidades MVP
- [ ] Onboarding guiado al primer uso: aviso legal, salario, auxilio de transporte Sí/No, periodo, jornada, plantillas (F0)
- [ ] Ajustes (F1)
- [ ] Crear/editar/eliminar turno + plantillas (F2)
- [ ] Calendario (F3)
- [ ] Detalle de turno (F4)
- [ ] Historial (F5)
- [ ] Resumen de pago (F6)
- [ ] `/revision-ui` aprobada

## Fase 4 — Pulido y publicación
- [ ] Aviso legal inicial, borrar datos, política de privacidad
- [ ] Ícono y splash definitivos
- [ ] Pruebas en dispositivo real iOS y Android
- [ ] Builds con EAS y publicación (checklist de `CUMPLIMIENTO.md`)
