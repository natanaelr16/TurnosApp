---
name: actualizar-normativa
description: Investiga cambios en la normativa laboral/tributaria colombiana (SMMLV, auxilio, UVT, recargos, jornada, FSP, retención) y actualiza REGLAS_LEGALES y el motor
triggers:
  - user
---

Actualiza la base legal de TurnosApp:

1. Lee `docs/REGLAS_LEGALES.md` y anota la fecha de "Verificado el".
2. Investiga en la web (prioriza fuentes oficiales: Diario Oficial, Secretaría del Senado, Ministerio del
   Trabajo, DIAN, Corte Constitucional, Función Pública) si cambió algo de:
   - SMMLV y auxilio de transporte del año actual y siguiente.
   - UVT del año actual y siguiente.
   - Jornada máxima/divisor, franja nocturna, recargo dominical/festivo, horas extra.
   - Fondo de Solidaridad Pensional (Ley 2381 de 2024 y su vigencia) y aportes del trabajador.
   - Tabla y topes de retención en la fuente (Art. 383, 336, 206-10 ET) y redondeo.
   - Festivos nuevos.
3. Presenta al usuario una tabla: parámetro | valor actual en el doc | valor encontrado | fuente (URL) | vigencia.
   **No cambies nada sin su confirmación.**
4. Con la confirmación: actualiza `docs/REGLAS_LEGALES.md` (fecha de verificación y fuentes),
   `src/domain/legal-params.ts` y las pruebas; ejecuta `/verificar` y `/revision-legal`.
5. Registra el cambio en `docs/DECISIONES.md` si aplica y ejecuta `/cerrar-sesion`.
