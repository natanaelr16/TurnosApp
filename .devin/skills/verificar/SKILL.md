---
name: verificar
description: Ejecuta pruebas, verificación de tipos y lint con el agente qa-tester y reporta resultados
agent: qa-tester
---

Verifica el estado de calidad del proyecto TurnosApp en la raíz del repositorio:

1. `npm test -- --watchAll=false` (si existe el script `test` en package.json)
2. `npx tsc --noEmit`
3. `npx expo lint`

Reporta la tabla de resultados, la causa raíz de cada fallo con archivo:línea y casos de prueba faltantes
para los archivos modificados según `git status`.
