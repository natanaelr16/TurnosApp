---
name: revision-ui
description: Revisa pantallas y componentes contra docs/DISENO.md, accesibilidad y patrones nativos usando el agente ui-designer
argument-hint: "[pantalla o carpeta a revisar]"
agent: ui-designer
---

Revisa la interfaz de TurnosApp. Si no se indicó una pantalla concreta, revisa todo `src/app/` y
`src/components/`.

Evalúa contra `docs/DISENO.md`: flujo (registrar turno en ≤ 3 toques), claridad del dinero, accesibilidad,
modo oscuro, estados (cargando/vacío/error), patrones nativos iOS/Android, rendimiento y textos en español.

Entrega el veredicto, los problemas por severidad con archivo:línea y propuestas concretas, y mejoras
opcionales para que la app sea más dinámica.
