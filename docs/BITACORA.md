# Bitácora de sesiones

Registro cronológico (más reciente arriba). Una entrada por sesión de trabajo.
Formato: fecha, objetivo, qué se hizo, verificación ejecutada, pendientes.

---

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
