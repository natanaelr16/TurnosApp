#!/bin/bash
# Inyecta docs/ESTADO.md y los cambios sin commitear en el contexto del agente al iniciar sesión.
cd "${DEVIN_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
[ -f docs/ESTADO.md ] || exit 0

/usr/bin/python3 - <<'PY'
import json, subprocess
estado = open("docs/ESTADO.md", encoding="utf-8").read()
cambios = subprocess.run(["git", "status", "--short"], capture_output=True, text=True).stdout.strip()
contexto = (
    "Memoria del proyecto TurnosApp (docs/ESTADO.md). Sigue el protocolo de memoria de AGENTS.md "
    "y usa /cerrar-sesion al terminar.\n\n" + estado
    + "\n\nCambios sin commitear:\n" + (cambios or "(ninguno)")
)
print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": contexto}}))
PY
