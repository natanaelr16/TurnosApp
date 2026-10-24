# Reglas legales — Colombia (fuente de verdad del motor de cálculo)

> Verificado el 2026-10-24. Toda modificación a este archivo debe citar la norma y pasar por
> `/revision-legal`. El código en `src/domain/` debe implementar exactamente lo que dice aquí.
> **Aviso para el usuario final:** los cálculos son estimados informativos, no asesoría legal.

## 1. Parámetros por año

| Parámetro | 2025 | 2026 | Fuente |
|---|---|---|---|
| SMMLV | $1.423.500 | $1.750.905 | Decretos 1572/2024 y 1469/2025 |
| Auxilio de transporte | $200.000 | $249.095 | Decretos 1573/2024 y 1470/2025 |
| UVT | $49.799 | $52.374 | Res. DIAN 000193/2024 y 000238/2025 |

## 2. Jornada y valor de la hora ordinaria (Ley 2101 de 2021)

**Valor hora ordinaria = salario mensual ÷ divisor mensual**, con divisor = jornada semanal ÷ 6 × 30.

| Desde | Jornada máx. semanal | Divisor |
|---|---|---|
| antes de 2023-07-15 | 48 h | 240 |
| 2023-07-15 | 47 h | 235 |
| 2024-07-15 | 46 h | 230 |
| 2025-07-15 | 44 h | 220 |
| **2026-07-15** | **42 h** | **210** |

Ejemplo: salario $3.000.000 ÷ 210 = **$14.286** por hora.

## 3. Franja diurna y nocturna (Art. 160 CST, mod. Ley 2466 de 2025, art. 10)

| Desde | Diurno | Nocturno |
|---|---|---|
| antes de 2025-12-25 | 06:00–21:00 | 21:00–06:00 |
| **2025-12-25** | **06:00–19:00** | **19:00–06:00** |

La franja se evalúa **minuto a minuto** según la hora real de cada minuto trabajado.

## 4. Recargos y horas extra (Arts. 168 y 179 CST)

| Concepto | Porcentaje | Nota |
|---|---|---|
| Recargo nocturno (hora ordinaria nocturna) | 35 % | Art. 168 |
| Hora extra diurna | 25 % | Art. 168 |
| Hora extra nocturna | 75 % | Art. 168 |
| Recargo dominical / festivo | ver tabla gradual | Art. 179, mod. Ley 2466 art. 14 |

**Recargo dominical/festivo gradual (Ley 2466 de 2025):**

| Desde | % |
|---|---|
| antes de 2025-07-01 | 75 % |
| 2025-07-01 | 80 % |
| **2026-07-01** | **90 %** |
| 2027-07-01 | 100 % |

### 4.1 Cómo se paga cada minuto (valores vigentes a oct-2026)
`VH` = valor hora ordinaria. Las horas **ordinarias** ya están pagadas por el salario, así que solo
generan el **recargo**. Las horas **extra** no están en el salario, así que se pagan completas (100 % + %).

| Tipo de minuto | Se paga adicional al salario | Factor sobre VH |
|---|---|---|
| Ordinario diurno (lun–sáb, no festivo) | nada | 0 |
| Ordinario nocturno | recargo nocturno | 0,35 |
| Ordinario diurno dominical/festivo | recargo dominical | 0,90 |
| Ordinario nocturno dominical/festivo | nocturno + dominical | 1,25 |
| Extra diurna | hora + 25 % | 1,25 |
| Extra nocturna | hora + 75 % | 1,75 |
| Extra diurna dominical/festiva | hora + 25 % + dominical | 2,15 |
| Extra nocturna dominical/festiva | hora + 75 % + dominical | 2,65 |

Regla de composición: `factor = (esExtra ? 1 + %extra(diurna|nocturna) : %nocturno si es noche)
+ (esDominicalOFestivo ? %dominical : 0)`. Todos los % son configurables por el usuario (D-005).

### 4.2 Qué es dominical/festivo
Se decide por la **fecha calendario de cada minuto** (un turno sáb 18:00 → dom 06:00 tiene 6 h de
sábado y 6 h de domingo). Domingo = día de descanso obligatorio por defecto.

### 4.3 Cuándo un minuto es extra (decisión D-004)
Se recorren los turnos en orden cronológico. Un minuto es **extra** si, al trabajarlo, ya se
cumplió el **límite diario** (horas ordinarias acumuladas en la jornada, la jornada pertenece a la
fecha de *inicio* del turno) **o** el **límite semanal** (lunes a domingo, según la fecha de inicio
del turno). Si no, es ordinario y suma a ambos contadores. Por defecto: 8 h/día, 42 h/semana.

### 4.4 Límites de trabajo suplementario (Ley 2466 de 2025)
Máximo **2 h extra diarias y 12 semanales**. La app **no bloquea**; muestra un aviso.

## 5. Festivos de Colombia (Ley 51 de 1983 — "Ley Emiliani")
- **Fijos:** 1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic.
- **Trasladables al lunes siguiente** (si no caen en lunes): 6 ene (Reyes), 19 mar (San José),
  29 jun (San Pedro y San Pablo), 15 ago (Asunción), 12 oct (Día de la Raza), 1 nov (Todos los Santos),
  11 nov (Independencia de Cartagena).
- **Según Pascua (P = domingo de Pascua):** Jueves Santo P−3, Viernes Santo P−2 (no se trasladan);
  Ascensión P+43, Corpus Christi P+64, Sagrado Corazón P+71 (ya son lunes).
- Caso de prueba: 2026 → Pascua 5 abr; Jueves Santo 2 abr; Viernes Santo 3 abr; Ascensión 18 may;
  Corpus 8 jun; Sagrado Corazón 15 jun; Reyes 12 ene; San José 23 mar; San Pedro 29 jun;
  Asunción 17 ago; Raza 12 oct; Todos los Santos 2 nov; Cartagena 16 nov.

## 6. Devengado del periodo
- **Salario básico del periodo:** mensual = salario; quincenal = salario ÷ 2.
- **Recargos + extras:** suma de los turnos cuya fecha de inicio cae en el periodo.
- **Auxilio de transporte:** se suma **solo si el usuario lo activó** en la configuración (D-009), con el
  valor que configuró (por defecto el legal vigente); quincenal = auxilio ÷ 2. **No** es base de aportes
  (salud, pensión, FSP), pero **sí** integra la base de retención en la fuente: la DIAN sostiene que todo
  pago laboral, sea o no factor salarial, es gravable salvo exención expresa (Conceptos DIAN 39293 de 2003,
  30392 de 2003 y 32320 de 1999; Art. 206 ET). Referencia: aplica a quien devenga hasta 2 SMMLV
  (Ley 15 de 1959), dato que la app usa solo como ayuda informativa.
- **IBC (base de aportes)** = básico + recargos + extras (sin auxilio). Mínimo 1 SMMLV mensual; en
  liquidación quincenal el piso es ½ SMMLV por quincena (equivalente mensual).
- **Valor hora de un turno:** se usa el divisor vigente en la **fecha de inicio** del turno para todo el
  turno (el divisor es mensual, no por minuto). Los porcentajes y la franja nocturna sí se evalúan con la
  fecha de cada minuto (D-011).
- **Años sin parámetros cargados:** se usan los del último año conocido y la UI debe avisarlo.

## 7. Descuentos al trabajador
- **Salud:** 4 % del IBC. **Pensión:** 4 % del IBC.
- **Fondo de Solidaridad Pensional (FSP)** — Ley 100 de 1993 art. 27 (mod. Ley 797 de 2003), vigente
  hasta 2027-03-31, sobre IBC mensual expresado en SMMLV:

| IBC | % |
|---|---|
| < 4 SMMLV | 0 % |
| ≥ 4 y < 16 | 1,0 % |
| 16 a < 17 | 1,2 % |
| 17 a < 18 | 1,4 % |
| 18 a < 19 | 1,6 % |
| 19 a ≤ 20 | 1,8 % |
| > 20 | 2,0 % |

  > Desde **2027-04-01** rige la Ley 2381 de 2024 (Sentencia C-264 de 2026) con otra tabla
  > (≥4 <7: 1,5 %; ≥7 <11: 1,8 %; ≥11 <19: 2,5 %; ≥19 ≤20: 2,8 %; >20: 3,0 %). Ejecutar
  > `/actualizar-normativa` antes de esa fecha para confirmar.

- **Retención en la fuente — procedimiento 1 (Arts. 383, 387, 388 y 206-10 ET), ESTIMADO, mensual:**
  1. Ingreso laboral = básico + recargos + extras + auxilio de transporte del mes (todos los pagos laborales).
  2. − Ingresos no constitutivos de renta: salud + pensión + FSP del trabajador.
  3. = Subtotal. − Deducciones declaradas por el usuario (opcional, por defecto 0).
  4. Renta exenta 25 % del resultado, con tope 790 UVT anuales (≈ 65,83 UVT/mes).
  5. Deducciones + renta exenta no pueden superar el 40 % del subtotal ni 1.340 UVT anuales (≈ 111,67 UVT/mes).
  6. Base gravable en UVT → tabla Art. 383:

| Desde (UVT) | Hasta (UVT) | Impuesto |
|---|---|---|
| 0 | 95 | 0 |
| >95 | 150 | (base − 95) × 19 % |
| >150 | 360 | (base − 150) × 28 % + 10 UVT |
| >360 | 640 | (base − 360) × 33 % + 69 UVT |
| >640 | 945 | (base − 640) × 35 % + 162 UVT |
| >945 | 2.300 | (base − 945) × 37 % + 268 UVT |
| >2.300 | — | (base − 2.300) × 39 % + 770 UVT |

  Resultado en pesos aproximado al múltiplo de $1.000 más cercano (práctica DIAN; confirmar con
  `/actualizar-normativa`). Para quincena: se calcula el mes
  proyectado y se toma la mitad (aproximación declarada en la UI).

## 8. Redondeo
Pesos enteros; se redondea al final de cada concepto (no por minuto). Ver D-006.
