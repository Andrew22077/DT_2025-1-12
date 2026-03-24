# Base de datos MySQL en Railway

> **Para el despliegue completo**, consulta la guía principal: [RAILWAY_DEPLOY.md](../RAILWAY_DEPLOY.md)

## 1. Crear la base de datos en Railway

1. Entra a [railway.app](https://railway.app) e inicia sesión.
2. Crea un nuevo proyecto (o usa uno existente).
3. Haz clic en **+ New** → **Database** → **MySQL**.
4. Espera a que el servicio se despliegue.
5. Haz clic en el servicio MySQL → **Variables** para ver las credenciales.

## 2. Variables de entorno que proporciona Railway

Railway expone automáticamente:

| Variable     | Descripción                    |
|--------------|--------------------------------|
| MYSQLHOST    | Host del servidor              |
| MYSQLPORT    | Puerto (por defecto 3306)      |
| MYSQLUSER    | Usuario                        |
| MYSQLPASSWORD| Contraseña                     |
| MYSQLDATABASE| Nombre de la base de datos     |

## 3. Conectar Django (backend en Railway)

Si tu backend Django está en el **mismo proyecto** de Railway:

1. En el servicio de tu API Django, ve a **Variables**.
2. Haz clic en **+ New Variable** → **Add a reference**.
3. Elige el servicio MySQL y las variables: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.

Django usará automáticamente estas variables.

## 4. Conectar desde tu máquina local

Si quieres ejecutar Django localmente contra la base de Railway:

1. En el servicio MySQL de Railway, ve a **Settings** → **Networking**.
2. Activa **TCP Proxy** para exponer el puerto.
3. Copia el host y puerto públicos que te muestra.
4. Crea un archivo `.env` en `backend/` (o configura variables de entorno):

```env
MYSQLHOST=tu-host-publico.railway.app
MYSQLPORT=12345
MYSQLUSER=root
MYSQLPASSWORD=tu_password
MYSQLDATABASE=railway
```

5. Asegúrate de cargar estas variables antes de ejecutar Django (por ejemplo con `python-decouple` o `django-environ`).

> **Nota:** Si la conexión externa requiere SSL, agrega `MYSQL_SSL=true`.

## 5. Ejecutar migraciones

Con las variables configuradas:

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser  # opcional, para el admin
```

## 6. Probar la conexión

```bash
cd backend
python manage.py check
```

Si no hay errores, la conexión a Railway está bien configurada.
