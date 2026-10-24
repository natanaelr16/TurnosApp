# Registro de decisiones (ADR)

Cada decisión importante se registra aquí. No se borran: si cambian, se marca la anterior como
**Reemplazada por D-XXX** y se agrega una nueva.

| ID | Fecha | Decisión | Motivo | Estado |
|----|-------|----------|--------|--------|
| D-001 | 2026-10-24 | Expo SDK 58 + React Native + TypeScript estricto + Expo Router | Multiplataforma (iOS/Android) con un solo código; recomendado por React Native | Vigente |
| D-002 | 2026-10-24 | Datos solo en el dispositivo (SQLite local con `expo-sqlite`), sin cuentas ni servidor | Privacidad, costo cero, simplicidad. Respaldo/exportación se evalúa en fase posterior. *Asumido: confirmar con el usuario* | Vigente |
| D-003 | 2026-10-24 | El motor de cálculo es TypeScript puro en `src/domain/`, sin dependencias de React ni Expo, 100% cubierto por pruebas | La exactitud legal es el núcleo de la app; debe poder probarse aislado | Vigente |
| D-004 | 2026-10-24 | Horas extra = minutos que superan el límite diario **o** el semanal (Lun–Dom), sin doble conteo. Ambos límites configurables (por defecto 8 h/día, 42 h/semana) | Cubre turnos de 4 a 12 h y cruce de medianoche; cada contrato distribuye la jornada distinto | Vigente |
| D-005 | 2026-10-24 | Todos los porcentajes (recargos, extras, deducciones) tienen valor legal por defecto según la fecha y el usuario puede sobrescribirlos | Requisito del usuario; la ley cambia gradualmente (Ley 2466/2025, Ley 2101/2021) | Vigente |
| D-006 | 2026-10-24 | Dinero en pesos enteros (`number` entero), redondeo solo al final de cada concepto. Fechas/horas como texto local `YYYY-MM-DDTHH:mm` (Colombia no tiene horario de verano) | Evita errores de zona horaria y de punto flotante acumulado | Vigente |
| D-007 | 2026-10-24 | Retención en la fuente y aporte solidario se muestran como **estimados** con aviso visible | El cálculo real depende de datos que la app no conoce (deducciones, procedimiento 2, etc.) | Vigente |
| D-008 | 2026-10-24 | Gestor de paquetes: npm; instalar dependencias siempre con `npx expo install` | Recomendación oficial de Expo; evita problemas de pnpm con React Native | Vigente |
| D-009 | 2026-10-24 | Auxilio de transporte es un interruptor manual Sí/No (más valor editable); la app nunca lo activa automáticamente por el salario | Pedido del usuario: hay empresas que no lo pagan o lo pagan sin cumplir la regla de 2 SMMLV; la app refleja lo que el usuario realmente recibe | Vigente |
| D-010 | 2026-10-24 | Onboarding guiado obligatorio al primer uso (aviso legal, salario, auxilio de transporte; periodo, jornada y plantillas con valores por defecto) | Pedido del usuario; sin salario no se puede calcular nada | Vigente |
