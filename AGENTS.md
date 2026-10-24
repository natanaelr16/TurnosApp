# TurnosApp — reglas del proyecto

App personal para registrar turnos laborales y calcular horas, recargos, extras y pago estimado
según la legislación colombiana. Responder al usuario **en español**. El usuario está aprendiendo
(vibe coding): explicar brevemente qué se hace y por qué.

## Protocolo de memoria (obligatorio)
1. **Al iniciar:** leer `docs/ESTADO.md` (o usar `/iniciar-sesion`). Consultar `docs/ROADMAP.md` y
   `docs/DECISIONES.md` antes de proponer cambios de alcance o de arquitectura.
2. **Al terminar:** usar `/cerrar-sesion` → actualizar `docs/ESTADO.md`, añadir entrada en
   `docs/BITACORA.md`, marcar `docs/ROADMAP.md`, registrar decisiones nuevas en `docs/DECISIONES.md`.
3. Nunca contradecir una decisión vigente sin registrar una nueva que la reemplace.

## Fuentes de verdad
| Tema | Archivo |
|---|---|
| Qué construir | `docs/PRD.md` |
| Cálculos legales | `docs/REGLAS_LEGALES.md` (el código de `src/domain/` debe coincidir exactamente) |
| Estructura/código | `docs/ARQUITECTURA.md` |
| UI/UX | `docs/DISENO.md` |
| Tiendas/privacidad | `docs/CUMPLIMIENTO.md` |

## Reglas clave
- `src/domain/` es TypeScript puro, sin React/Expo, con pruebas para cada regla. Pruebas primero.
- Toda lógica de cálculo vive en `src/domain/`; las pantallas solo muestran resultados.
- Dinero en pesos enteros; fechas como `YYYY-MM-DDTHH:mm` local (D-006).
- Cambios en cálculos o en `REGLAS_LEGALES.md` → `/revision-legal`. Pantallas nuevas → `/revision-ui`.
- Antes de dar algo por terminado → `/verificar` (pruebas + lint + tipos).
- Commits pequeños en español, uno por funcionalidad. No hacer push sin permiso del usuario.

## Skills y agentes disponibles
- Skills: `/iniciar-sesion`, `/cerrar-sesion`, `/nueva-funcionalidad`, `/verificar`,
  `/revision-legal`, `/revision-ui`, `/actualizar-normativa`.
- Subagentes (`.devin/agents/`): `legal-reviewer`, `ui-designer`, `qa-tester`, `store-compliance`.

---

# Expo (guía de la plantilla)

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
