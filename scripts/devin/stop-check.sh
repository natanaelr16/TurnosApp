#!/bin/bash
# Al terminar un turno: si hay cambios sin commitear en código/config y docs/ESTADO.md no se actualizó,
# pide (una sola vez) actualizar la memoria del proyecto.
cd "${DEVIN_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
HOOK_INPUT="$(cat)"
export HOOK_INPUT

/usr/bin/python3 - <<'PY'
import json, os, subprocess, sys
try:
    datos = json.loads(os.environ.get("HOOK_INPUT") or "{}")
except ValueError:
    datos = {}
if datos.get("stop_hook_active"):
    sys.exit(0)
lineas = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout.splitlines()
rutas = [l[3:] for l in lineas]
codigo = [r for r in rutas if r.startswith(("src/", ".devin/", "app.json", "package.json"))]
if codigo and "docs/ESTADO.md" not in rutas:
    print(json.dumps({
        "decision": "block",
        "reason": "Hay cambios en código/config sin reflejar en docs/ESTADO.md. "
                  "Ejecuta el protocolo /cerrar-sesion (ESTADO, BITACORA, ROADMAP, DECISIONES) antes de terminar. "
                  "Si el trabajo sigue en curso, anota en ESTADO.md qué quedó a medias.",
    }))
PY
