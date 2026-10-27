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

Pantallas modales: crear/editar turno, consulta de detalle separada y plantillas.

## Flujo simplificado (pedido del usuario, D-020)
- Calendario: mes completo sin scroll ni botones de registro/"Ir a hoy"; abrir en fecha actual.
  Tap vacío → registrar; tap ocupado → consultar. Flechas compactas cambian de mes; tocar el
  nombre del mes abre la vista de año con los 12 meses en miniatura (mismos colores), estilo iPhone.
- Registro: elegir Día 06–18 o Noche 18–06; salida automática. Horario especial plegado.
  "Dato adicional" solo nombre + valor (ej.: Observaciones), sin selector de tipo ni panel de operación.
  Feedback háptico de éxito al guardar (expo-haptics).
- Historial: lista por periodo, consulta de horas/recargos y exportación PDF; sin CTA de registro.
- Resumen: solo estimación o mensaje breve de periodo incompleto, sin progreso ni lista de faltantes.
  No reintroducir esos controles por recomendaciones genéricas de revisión UI.

## Onboarding (primer uso, ver PRD F0)
- Una pregunta por pantalla, título grande, barra de progreso, botón principal fijo abajo.
- Salario: teclado numérico, formato de moneda mientras escribe, valor hora en vivo debajo.
- Auxilio de transporte: dos tarjetas grandes "Sí, lo recibo" / "No lo recibo" (ninguna preseleccionada);
  la ayuda contextual aparece debajo con tono informativo.
- Animación suave entre pasos; el teclado no debe tapar el botón (`KeyboardAvoidingView`).
- Pantalla final de resumen con cada dato tocable para editarlo.

## Lenguaje visual
- Modo claro y oscuro (automático).
- Colores semánticos (definir en `src/constants/theme.ts`):
  - Importes/desgloses: diurno ámbar, nocturno índigo, dominical/festivo rojo coral, extra verde.
  - Calendario (`lib/calendar.ts`): día azul cielo, noche azul oscuro, descanso verde, novedad violeta;
    letras D/N/L/V además del color, alto contraste del número. Hoy contorno, festivo subrayado.
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
