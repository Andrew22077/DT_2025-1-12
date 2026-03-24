# Guía completa: Despliegue en Railway

Esta guía te lleva paso a paso para desplegar el proyecto (Django + React + MySQL) en Railway con HTTPS.

---

## Requisitos previos

- Cuenta en [Railway](https://railway.app)
- Cuenta en [GitHub](https://github.com)
- Proyecto subido a un repositorio de GitHub

---

## Parte 1: Crear el proyecto en Railway

### Paso 1.1: Crear proyecto y base de datos MySQL

1. Ve a [railway.app](https://railway.app) e inicia sesión (puedes usar GitHub).
2. Haz clic en **"New Project"**.
3. Selecciona **"Deploy from GitHub repo"** y conecta tu cuenta si aún no lo has hecho.
4. Elige tu repositorio y crea el proyecto.
5. Una vez creado, haz clic en **"+ New"** → **"Database"** → **"MySQL"**.
6. Espera a que el servicio MySQL se despliegue (icono verde).
7. Haz clic en el servicio **MySQL** → pestaña **Variables**.
8. Verás variables como `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`. Las usarás después.

---

## Parte 2: Desplegar el Backend (Django)

### Paso 2.1: Añadir servicio Backend

1. En tu proyecto Railway, haz clic en **"+ New"** → **"GitHub Repo"** (o **"Empty Service"** si prefieres conectar después).
2. Si usas el mismo repo, selecciona el mismo repositorio.
3. Railway creará un nuevo servicio. Haz clic en él para configurarlo.

### Paso 2.2: Configurar Root Directory

1. En el servicio del backend, ve a **Settings**.
2. En **"Root Directory"**, escribe: `backend`
3. Guarda los cambios.

### Paso 2.3: Variables de entorno del Backend

1. Ve a la pestaña **Variables** del servicio backend.
2. Haz clic en **"+ New Variable"** → **"Add a reference"**.
3. Selecciona el servicio **MySQL** y añade las variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

4. Añade estas variables manualmente (con valores propios):

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SECRET_KEY` | (genera una nueva) | Clave secreta de Django. Ejemplo: `openssl rand -base64 50` |
| `DEBUG` | `False` | Siempre False en producción |
| `ALLOWED_HOSTS` | `*` o tu dominio | Para empezar usa `*`. Luego: `tu-backend.railway.app` |
| `CORS_ALLOWED_ORIGINS` | URL del frontend | Ejemplo: `https://tu-frontend.railway.app` (la añadirás cuando tengas la URL) |

> **Generar SECRET_KEY:** En tu terminal ejecuta:
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

### Paso 2.4: Dominio público del Backend

1. En el servicio backend, ve a **Settings** → **Networking**.
2. Haz clic en **"Generate Domain"**.
3. Copia la URL generada (ej: `tu-backend-production.up.railway.app`).
4. Si añadiste `*` en ALLOWED_HOSTS, ya está bien. Si no, añade esta URL a `ALLOWED_HOSTS` en Variables.

### Paso 2.5: Migraciones de la base de datos

1. En el servicio backend, ve a **Settings** → **Deploy**.
2. En **"Release Command"**, añade (Railway ejecutará esto antes de cada deploy):
   ```
   python manage.py migrate --noinput
   ```
3. Guarda. Railway usará el Procfile para iniciar la app.
4. Haz **Deploy** del backend (o espera al primer deploy automático desde GitHub).

5. Para crear el superusuario la primera vez:
   - En la pestaña del servicio backend → **"..."** (tres puntos) → **"Run Command"**
   - Ejecuta: `python manage.py createsuperuser`
   - (Si no permite entrada interactiva, usa la CLI de Railway como en la Parte 4)

### Paso 2.6: Verificar Backend

1. Abre la URL del backend en el navegador: `https://tu-backend.railway.app/admin/`
2. Deberías ver la pantalla de login del admin (o un 404 si no tienes rutas en /).
3. Anota la **URL base del backend** (sin / al final): `https://tu-backend.railway.app`

---

## Parte 3: Desplegar el Frontend (React)

### Paso 3.1: Añadir servicio Frontend

1. En tu proyecto Railway, haz clic en **"+ New"** → **"GitHub Repo"**.
2. Selecciona el mismo repositorio.
3. Se crea otro servicio. Haz clic en él.

### Paso 3.2: Configurar Root Directory

1. En el servicio frontend, ve a **Settings**.
2. En **"Root Directory"**, escribe: `client`
3. Guarda.

### Paso 3.3: Variable de entorno del Frontend

1. Ve a la pestaña **Variables** del servicio frontend.
2. Añade:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://tu-backend.railway.app` |

> Reemplaza `tu-backend.railway.app` por la URL real de tu backend del Paso 2.6.

### Paso 3.4: Dominio público del Frontend

1. En el servicio frontend, ve a **Settings** → **Networking**.
2. Haz clic en **"Generate Domain"**.
3. Copia la URL (ej: `tu-frontend-production.up.railway.app`).

### Paso 3.5: Actualizar CORS en Backend

1. Vuelve al servicio **Backend** → **Variables**.
2. Edita `CORS_ALLOWED_ORIGINS` y pon la URL del frontend:
   ```
   https://tu-frontend-production.up.railway.app
   ```
   (sin barra al final)

3. El backend se redesplegará automáticamente con el nuevo CORS.

### Paso 3.6: Redeploy del Frontend

1. Si el frontend se desplegó antes de poner `VITE_API_URL`, haz un **Redeploy** para que tome la variable.
2. Abre la URL del frontend y verifica que cargue la app.
3. Prueba login y navegación.

---

## Parte 4: Crear usuario administrador

Si no creaste un superusuario antes:

1. Instala Railway CLI: [docs.railway.app/develop/cli](https://docs.railway.app/develop/cli)
2. Ejecuta:
   ```bash
   railway link   # Enlaza con tu proyecto
   railway run python manage.py createsuperuser
   ```
3. O usa el comando "Run Command" en el panel de Railway si está disponible.

---

## Parte 5: Archivos estáticos y media (Django)

- Los archivos estáticos se sirven con WhiteNoise.
- Las fotos de perfil se guardan en `media/`. En Railway el disco es efímero, así que las fotos se perderán al redeploy. Para producción seria recomendable usar un servicio de almacenamiento (S3, Cloudinary, etc.) más adelante.

---

## Resumen de URLs

| Servicio | URL ejemplo |
|----------|-------------|
| Frontend | `https://tu-frontend.railway.app` |
| Backend API | `https://tu-backend.railway.app` |
| Admin Django | `https://tu-backend.railway.app/admin/` |

---

## Solución de problemas

### Error 502 Bad Gateway (paso 2.6)

1. **Revisar logs**: En Railway → servicio backend → pestaña **Deployments** → clic en el último deploy → **View Logs**. Busca errores al iniciar (imports, base de datos, etc.).

2. **Verificar variables de entorno**:
   - Las variables `MYSQLHOST`, `MYSQLPORT`, etc. deben estar **referenciadas** al servicio MySQL (no copiadas a mano).
   - `DEBUG` debe ser `False`.
   - `ALLOWED_HOSTS`: usa `*` temporalmente o añade tu dominio `tu-backend.up.railway.app`.

3. **Base de datos**: Si el log muestra errores de conexión a MySQL, comprueba que el servicio MySQL esté en el mismo proyecto y que las referencias de variables sean correctas.

4. **Root Directory**: En Settings del backend debe estar `backend` (sin barra).

5. **Redeploy**: Después de cambios, haz **Redeploy** desde el menú del servicio.

6. **Migraciones**: Asegúrate de que el Release Command `python manage.py migrate --noinput` se ejecute y no falle. Revisa los logs del deploy.

7. **Logs del arranque**: Con el script `start.sh`, al iniciar deberías ver:
   - `=== Iniciando backend (PORT=xxxx) ===`
   - `Django y BD OK`
   - `Iniciando Gunicorn...`
   Si ves `Error: Django o conexion a BD fallo`, el problema está en Django o en la conexión a MySQL. Copia el traceback completo de los logs.

### Error de CORS
- Asegúrate de que `CORS_ALLOWED_ORIGINS` incluya exactamente la URL del frontend (con `https://`, sin barra final).
- Si usas `*` en desarrollo, en producción debes usar la lista explícita.

### Base de datos / Migraciones
- Verifica que las variables `MYSQL*` estén correctas.
- Ejecuta `python manage.py migrate` desde "Run Command" si hace falta.

### Frontend no conecta con la API
- Comprueba que `VITE_API_URL` esté definida y sea la URL correcta del backend.
- Haz redeploy del frontend después de cambiar variables (Vite las embebe en build time).

---

## Costos

Railway ofrece créditos gratuitos mensuales. Con uso moderado, el proyecto puede mantenerse dentro del tier gratuito. Revisa la sección [Pricing](https://railway.app/pricing) para más detalles.
