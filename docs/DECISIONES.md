# Registro de decisiones (ADR)

Cada decisión importante se registra aquí. No se borran: si cambian, se marca la anterior como
**Reemplazada por D-XXX** y se agrega una nueva.

| ID | Fecha | Decisión | Motivo | Estado |
|----|-------|----------|--------|--------|
| D-001 | 2026-10-24 | Expo SDK 58 + React Native + TypeScript estricto + Expo Router | Multiplataforma (iOS/Android) con un solo código; recomendado por React Native | Vigente |
| D-002 | 2026-10-24 | Datos solo en el dispositivo (SQLite local con `expo-sqlite`), sin cuentas ni servidor | Privacidad, costo cero, simplicidad. **Confirmado por el usuario**; respaldo vía PDF (D-014) | Vigente |
| D-003 | 2026-10-24 | El motor de cálculo es TypeScript puro en `src/domain/`, sin dependencias de React ni Expo, 100% cubierto por pruebas | La exactitud legal es el núcleo de la app; debe poder probarse aislado | Vigente |
| D-004 | 2026-10-24 | Horas extra = minutos que superan el límite diario **o** el semanal (Lun–Dom), sin doble conteo. Ambos límites configurables (por defecto 8 h/día, 42 h/semana) | Cubre turnos de 4 a 12 h y cruce de medianoche; cada contrato distribuye la jornada distinto | Vigente |
| D-005 | 2026-10-24 | Todos los porcentajes (recargos, extras, deducciones) tienen valor legal por defecto según la fecha y el usuario puede sobrescribirlos | Requisito del usuario; la ley cambia gradualmente (Ley 2466/2025, Ley 2101/2021) | Vigente |
| D-006 | 2026-10-24 | Dinero en pesos enteros (`number` entero), redondeo solo al final de cada concepto. Fechas/horas como texto local `YYYY-MM-DDTHH:mm` (Colombia no tiene horario de verano) | Evita errores de zona horaria y de punto flotante acumulado | Vigente |
| D-007 | 2026-10-24 | Retención en la fuente y aporte solidario se muestran como **estimados** con aviso visible | El cálculo real depende de datos que la app no conoce (deducciones, procedimiento 2, etc.) | Vigente |
| D-008 | 2026-10-24 | Gestor de paquetes: npm; instalar dependencias siempre con `npx expo install` | Recomendación oficial de Expo; evita problemas de pnpm con React Native | Vigente |
| D-009 | 2026-10-24 | Auxilio de transporte es un interruptor manual Sí/No (más valor editable); la app nunca lo activa automáticamente por el salario | Pedido del usuario: hay empresas que no lo pagan o lo pagan sin cumplir la regla de 2 SMMLV; la app refleja lo que el usuario realmente recibe | Vigente |
| D-010 | 2026-10-24 | Onboarding guiado obligatorio al primer uso (aviso legal, salario, auxilio de transporte; periodo, jornada y plantillas con valores por defecto) | Pedido del usuario; sin salario no se puede calcular nada | Vigente |
| D-011 | 2026-10-24 | Valor hora del turno con el divisor de su fecha de inicio; porcentajes y franja nocturna por fecha de cada minuto. Dos turnos que inician el mismo día comparten el límite diario | El divisor es mensual (Ley 2101); los recargos dependen del momento real trabajado. Hallazgo H2 de la revisión legal | Vigente |
| D-012 | 2026-10-24 | Auxilio de transporte incluido en la base de retención (no en el IBC). Quincena: IBC mínimo ½ SMMLV; FSP y retención se calculan sobre el mes proyectado (×2) | Doctrina DIAN (Conceptos 39293/2003 y otros); el auditor sugirió lo contrario y se descartó tras verificar fuentes. Hallazgos H1 y H3 | Vigente |
| D-013 | 2026-10-24 | Horas ordinarias en domingo/festivo se pagan hora completa + recargo (1,90 diurna, 2,25 nocturna) por defecto; opción `solo-recargo` para quien recibe descanso compensatorio. Reemplaza el factor 0,90/1,25 de la versión inicial de REGLAS §4.1 | Art. 179 CST ("sin perjuicio del salario ordinario"); confirmado con la planilla real del usuario y doctrina (Gerencie) | Vigente |
| D-014 | 2026-10-24 | Respaldo = PDF exportado con un JSON versionado embebido (`TurnosAppBackup`, `format: 1`). Se restaura eligiendo el PDF. Generación con `expo-print` (HTML→PDF) y post-proceso para incrustar el JSON (librería a validar en Fase 3.6); el formato y su validación viven en `src/domain/backup.ts` | Pedido del usuario: datos solo en el teléfono (confirma D-002) pero poder migrar de móvil sin cuentas | Vigente |
