---
name: cerrar-sesion
description: Cierra la sesión de trabajo - actualiza ESTADO, BITACORA, ROADMAP y DECISIONES y propone commit
allowed-tools:
  - read
  - edit
  - grep
  - glob
  - exec
permissions:
  allow:
    - Exec(git status)
    - Exec(git diff)
    - Exec(git log)
---

Cierra la sesión dejando la memoria del proyecto al día:

1. Revisa qué cambió: `git status --short` y `git diff --stat` (y lo hecho en esta conversación).
2. Actualiza `docs/ESTADO.md` (reemplaza su contenido, máx. ~60 líneas):
   fecha, fase actual, qué existe hoy, en curso, siguiente paso, decisiones pendientes con el usuario, bloqueos.
3. Agrega arriba en `docs/BITACORA.md` una entrada: fecha — título; objetivo; hecho; verificación ejecutada
   (con resultado real, no supuesto); pendientes.
4. Marca `[x]` en `docs/ROADMAP.md` lo completado; agrega tareas nuevas descubiertas.
5. Si se tomó alguna decisión técnica o de producto, regístrala en `docs/DECISIONES.md` con el siguiente ID.
6. Si cambió la estructura, comandos o dependencias, actualiza `docs/ARQUITECTURA.md`.
7. Muestra al usuario un resumen de 3–5 líneas y propone un mensaje de commit en español.
   Haz el commit solo si el usuario lo aprueba (o si ya lo pidió en esta sesión). Nunca hagas push sin permiso.
