# TurnosApp

App móvil (iOS y Android) para registrar turnos laborales y calcular horas ordinarias, recargos,
horas extra y pago estimado según la legislación laboral colombiana.

## Empezar
```bash
npm install
npx expo start      # luego: i = simulador iPhone, a = emulador Android
```

## Documentación
| Archivo | Para qué |
|---|---|
| [docs/ESTADO.md](docs/ESTADO.md) | **Dónde vamos** y siguiente paso |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases y tareas |
| [docs/PRD.md](docs/PRD.md) | Qué hace la app |
| [docs/REGLAS_LEGALES.md](docs/REGLAS_LEGALES.md) | Normativa y fórmulas de cálculo |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Estructura técnica y comandos |
| [docs/DISENO.md](docs/DISENO.md) | Guía de diseño |
| [docs/CUMPLIMIENTO.md](docs/CUMPLIMIENTO.md) | Tiendas, privacidad, avisos |
| [docs/DECISIONES.md](docs/DECISIONES.md) | Decisiones tomadas y por qué |
| [docs/BITACORA.md](docs/BITACORA.md) | Historial de sesiones |

## Trabajar con Devin
Al abrir una sesión, Devin recibe automáticamente el estado del proyecto (hook en `.devin/hooks.v1.json`).
Comandos útiles en el chat:

| Comando | Qué hace |
|---|---|
| `/iniciar-sesion` | Resume dónde vamos y propone el siguiente paso |
| `/nueva-funcionalidad <descripción>` | Flujo completo: planear → pruebas → código → revisión → docs |
| `/verificar` | Pruebas + lint + tipos |
| `/revision-legal` | Revisa los cálculos contra la normativa |
| `/revision-ui` | Revisa diseño, accesibilidad y UX |
| `/actualizar-normativa` | Busca cambios legales (SMMLV, UVT, recargos) |
| `/cerrar-sesion` | Actualiza estado, bitácora y roadmap |

> Los cálculos son estimados informativos y no reemplazan la liquidación oficial del empleador.
