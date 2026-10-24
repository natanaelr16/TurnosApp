# Cumplimiento: tiendas, privacidad y normativa

## Protección de datos (Colombia — Ley 1581 de 2012, Habeas Data)
- La app guarda datos **solo en el dispositivo** (salario, turnos). No se envían a servidores.
- Aun así, incluir **política de privacidad** accesible desde Ajustes y publicada en una URL
  (requisito de App Store y Google Play).
- Opción en Ajustes: **"Borrar todos mis datos"** (requisito de las tiendas).
- **PDF de respaldo (D-014):** contiene salario y turnos. Al exportar, avisar: *"Este PDF contiene tus datos
  salariales; compártelo solo con quien confíes."* La app no lo envía a ningún lado: lo comparte el usuario.
  Importar un PDF solo lee el respaldo embebido; validar estrictamente su contenido antes de guardarlo.
- No incluir analítica ni SDKs de terceros sin documentarlo aquí y en la política.

## Apple App Store
- Formulario "App Privacy" (etiquetas de privacidad): declarar "No se recopilan datos" mientras D-002 siga vigente.
- Privacy Manifest (`PrivacyInfo.xcprivacy`): configurarlo vía `app.json` → `ios.privacyManifests`
  si alguna API lo requiere (ej. `UserDefaults`, fecha de archivos).
- Guideline 1.4 / 5.1: los cálculos financieros deben presentarse como estimados informativos.
- Requiere cuenta Apple Developer (USD 99/año) para publicar.

## Google Play
- Formulario "Seguridad de los datos": declarar que no se recopilan ni comparten datos.
- Target API level mínimo exigido por Google (Expo SDK 58 lo cumple por defecto).
- Cuenta de desarrollador (USD 25, pago único).

## Avisos dentro de la app
- En Resumen y en detalle de pago: *"Valores estimados con fines informativos según la normativa
  colombiana vigente. Pueden diferir de la liquidación oficial de tu empleador."*
- En la primera apertura: aceptar el aviso anterior.

## Normativa laboral
- Fuente única: `docs/REGLAS_LEGALES.md`. Revisar con `/actualizar-normativa`:
  - Cada enero (SMMLV, auxilio de transporte, UVT).
  - 2027-04-01 (Ley 2381 / FSP) y 2027-07-01 (recargo dominical 100 %).

## Checklist antes de publicar
- [ ] Política de privacidad publicada y enlazada.
- [ ] Opción de borrar datos.
- [ ] Avisos de estimado visibles.
- [ ] Ícono, splash y nombre definitivos.
- [ ] Formularios de privacidad de ambas tiendas.
- [ ] Pruebas del motor en verde y revisión legal aprobada.
