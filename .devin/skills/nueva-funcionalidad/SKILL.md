---
name: nueva-funcionalidad
description: Flujo completo para construir una funcionalidad - entender, planear, pruebas, implementar, revisar con agentes y documentar
argument-hint: "<descripción de la funcionalidad o ítem del ROADMAP>"
---

Construye la funcionalidad que pidió el usuario siguiendo este flujo. Explica cada paso en español,
de forma breve, porque el usuario está aprendiendo.

## 1. Entender
- Lee `docs/ESTADO.md`, `docs/PRD.md` (sección relevante), `docs/ARQUITECTURA.md` y `docs/DECISIONES.md`.
- Si toca cálculos: lee `docs/REGLAS_LEGALES.md`. Si toca UI: lee `docs/DISENO.md`.
- Si la petición contradice el PRD o una decisión vigente, o es ambigua, pregunta antes de seguir.

## 2. Planear
- Crea una lista de tareas (todo list) con pasos pequeños y verificables.
- Si requiere una dependencia nueva: revisa la documentación de Expo SDK 58, instala con
  `npx expo install`, y regístrala en `docs/DECISIONES.md`.

## 3. Pruebas primero (lógica)
- Para lógica de `src/domain/` o `src/data/`: escribe primero las pruebas en `__tests__/*-test.ts`
  con casos calculados a mano (incluye bordes) y confirma que fallan.

## 4. Implementar
- Respeta capas: cálculos en `src/domain/`, persistencia en `src/data/`, UI en `src/app/` y `src/components/`.
- Código TypeScript estricto, sin `any`, componentes pequeños, textos en español.

## 5. Revisar
- Ejecuta `/verificar` y corrige hasta que esté en verde.
- Si cambió algo de `src/domain/` → `/revision-legal`. Si cambió UI → `/revision-ui`.
- Aplica los hallazgos de severidad alta/media; anota los demás en `docs/ESTADO.md`.

## 6. Documentar y cerrar
- Ejecuta `/cerrar-sesion` (estado, bitácora, roadmap, decisiones) y propone el commit.
- Indica al usuario cómo probarlo en la app (ej. `npx expo start` → `i`).
