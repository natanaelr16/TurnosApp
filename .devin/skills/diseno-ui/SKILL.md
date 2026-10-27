---
name: diseno-ui
description: Genera o modifica UI de alta calidad estilo iOS nativo — invocar antes de escribir pantallas, componentes o animaciones de TurnosApp
argument-hint: "[pantalla o componente a diseñar]"
---

# Diseño UI de nivel nativo — protocolo antes de programar

Esta skill potencia la calidad visual/interactiva del código que vas a escribir. Aplícala
siempre que el usuario pida una pantalla, componente, animación o mejora visual.

## Paso 0 — Fuentes obligatorias (leer antes de escribir código)
1. `docs/DISENO.md` — principios y flujos vigentes del proyecto. Nunca contradecir una decisión
   (D-XXX) sin registrar reemplazo en `docs/DECISIONES.md`.
2. El código existente del área a tocar (`src/app/`, `src/components/`, `src/constants/theme.ts`)
   para reutilizar `ThemedText`, `Screen`, `Button`, `Card`, colores semánticos y convenciones.
3. Si dudas de una API de Expo/RN, consulta `https://docs.expo.dev/llms.txt` — no confíes en
   memoria para animaciones o APIs nativas.

## Estándar de calidad — checklist que el resultado debe cumplir

### Sensación nativa iOS
- Toda acción tiene respuesta visible inmediata: estado `pressed` (opacidad/escala sutil),
  selección clara, transiciones animadas. Nada cambia "de golpe" sin animación.
- Animaciones con `Animated` o `react-native-reanimated` (si está instalada): 200–300 ms,
  easing `Easing.out(Easing.cubic)` al entrar, más rápido al salir. Usar `useNativeDriver: true`
  para opacity/transform; nunca animar layout costoso por frame.
- Patrones iOS reales cuando el usuario los pida "estilo iPhone": tap selecciona → segundo tap
  abre, chevrons ‹ ›, títulos de navegación tocables, celdas redondeadas (10–12 pt), agrupación
  tipo `UITableView` inset.
- Feedback háptico (`expo-haptics`): `notificationAsync(Success)` al guardar/eliminar,
  `impactAsync(Light)` en selecciones relevantes. No saturar.

### Accesibilidad (no negociable)
- `accessibilityRole` + `accessibilityLabel` descriptivo en TODO lo tocable; `accessibilityState`
  cuando hay selección/deshabilitado.
- Objetivos táctiles ≥ 44×44 pt; `maxFontSizeMultiplier` en textos dentro de celdas fijas para
  que Dynamic Type no rompa la grilla (1.1–1.4 según espacio).
- Contraste AA en texto sobre fondos de marca (los colores de `CALENDAR_KINDS` ya lo cumplen).

### Estados completos
- Pensar y cubrir: cargando, vacío, error, deshabilitado, seleccionado, presionado. Una pantalla
  que solo tiene "camino feliz" está a medias.

### Estructura
- Pantallas solo componen; la lógica vive en `src/domain/`/`src/lib/`. Componentes reusables en
  `src/components/`; estilos con `StyleSheet.create` al final del archivo.
- Memoizar lo pesado (`useMemo`) y cuidar `FlatList` (`initialNumToRender`, `windowSize`).
- Textos en español, sin emojis salvo pedido explícito.

## Paso final — autorrevisión antes de entregar
Releer el código generado y responder: ¿un usuario de iPhone diría "esto se siente nativo"?
¿Qué elemento no tiene feedback táctil/visual? ¿Qué texto se trunca con letra grande?
Corregir lo encontrado, luego `npx tsc --noEmit` + `npx expo lint` + pruebas.

Reportar al usuario en español: qué se hizo, qué patrones iOS se imitaron y qué queda por
validar visualmente en el simulador.
