#!/bin/bash
set -e

# Railway asigna PORT; si no existe, usar 8000
export PORT="${PORT:-8000}"

echo "=== Iniciando backend (PORT=$PORT) ==="

# Verificar que Django carga y la BD responde
echo "Verificando Django y base de datos..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
import django
django.setup()
from django.db import connection
connection.ensure_connection()
print('Django y BD OK')
" || { echo "Error: Django o conexion a BD fallo"; exit 1; }

echo "Iniciando Gunicorn en 0.0.0.0:$PORT"
exec gunicorn project_grado_api.wsgi:application \
  --bind "0.0.0.0:$PORT" \
  --timeout 120 \
  --workers 1 \
  --access-logfile - \
  --error-logfile -
