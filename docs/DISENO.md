# Guía de diseño (UI/UX)

## Principios
1. **Registrar rápido:** un turno frecuente en ≤ 3 toques (plantillas).
2. **Claridad del dinero:** siempre mostrar de dónde sale cada valor (desglose tocable).
3. **Dinámica y fluida:** transiciones suaves (`react-native-reanimated`), feedback háptico al guardar.
4. **Nativa en cada plataforma:** respetar patrones de iOS y Android (navegación, selectores de fecha).
5. **Accesible:** contraste AA, tamaño de letra dinámico, etiquetas para lectores de pantalla,
   objetivos táctiles ≥ 44×44 pt.

## Navegación (pestañas)
| Pestaña | Contenido |
|---|---|
| Calendario | Mes con días marcados; tocar día → turnos del día / agregar |
| Historial | Lista por periodo con totales |
| Resumen | Pago estimado de la quincena/mes |
| Ajustes | Salario, límites, porcentajes, periodo de pago |

Pantallas modales: crear/editar turno, detalle de turno.

## Lenguaje visual
- Modo claro y oscuro (automático).
- Colores semánticos (definir en `src/constants/theme.ts`):
  - Diurno: ámbar · Nocturno: índigo · Dominical/Festivo: rojo coral · Extra: verde.
- Números de dinero con fuente tabular (`fontVariant: ['tabular-nums']`).
- Formato: `$ 1.234.567`, horas `7 h 30 min`, fechas `vie 24 oct`.

## Textos
- Español de Colombia, tuteo, frases cortas.
- Avisos legales con tono informativo, no alarmista.
- Estados vacíos con llamado a la acción ("Aún no tienes turnos. Agrega el primero").

## Checklist de revisión de pantalla
- [ ] Funciona en iPhone pequeño (SE) y Android mediano.
- [ ] Modo oscuro correcto.
- [ ] Letra grande del sistema no rompe el diseño.
- [ ] Todos los botones tienen `accessibilityLabel`.
- [ ] Estados: cargando, vacío, error.
