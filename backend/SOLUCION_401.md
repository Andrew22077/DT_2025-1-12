# Solución al Error 401

## Problema
El error 401 (Unauthorized) aparece en `/api/listar-estudiantes/` porque el endpoint requiere autenticación y no hay un token válido.

## Solución Paso a Paso

### 1. Verifica que el Backend esté corriendo
```bash
cd backend
.\proyecto_grado\Scripts\Activate.ps1
python manage.py runserver
```
Debe mostrar: `Starting development server at http://127.0.0.1:8000/`

### 2. Verifica que el Frontend esté corriendo
```bash
cd client
npm run dev
```
Debe mostrar algo como: `Local: http://localhost:5173/`

### 3. Abre el Navegador y ve a la página de Login
- URL: `http://localhost:5173/login`

### 4. Ingresa las credenciales:
```
Correo: admin@test.com
Contraseña: admin123
```

### 5. Haz clic en "Entrar"

### 6. Verifica el Login en la Consola del Navegador
Presiona F12 para abrir las herramientas de desarrollador:

1. Ve a la pestaña **Console**
2. Intenta hacer login
3. Verifica si hay errores

### 7. Verifica que el Token se Guardó
En la consola del navegador (F12), ve a la pestaña **Application** (o **Storage**):
1. Expande **Local Storage**
2. Selecciona `http://localhost:5173`
3. Busca la clave `token`
4. Deberías ver: `364f433910519c63d2bd65f4a20f3e110ded2e6d` (o similar)

### 8. Si el Login Falla
Si ves un error en la consola, verifica:

**Error de conexión (Network Error):**
- El backend no está corriendo
- La URL está mal configurada

**Error 404:**
- La ruta de login no está correcta
- Verifica que el backend responda en `http://localhost:8000/api/login/`

**Error 401 en el login:**
- Las credenciales son incorrectas
- El usuario no existe o no está activo

**Error 500:**
- Hay un error en el servidor
- Revisa los logs del servidor Django

## Comandos de Verificación Rápida

### Verificar que el usuario existe:
```bash
cd backend
.\proyecto_grado\Scripts\Activate.ps1
python manage.py shell -c "from usuarios.models import Profesor; p = Profesor.objects.first(); print(f'Usuario: {p.correo}, Activo: {p.is_active}, Staff: {p.is_staff}')"
```

### Verificar el token:
```bash
python manage.py shell -c "from rest_framework.authtoken.models import Token; from usuarios.models import Profesor; p = Profesor.objects.get(correo='admin@test.com'); token = Token.objects.get(user=p); print(f'Token: {token.key}')"
```

## Si Todo Falla

1. Limpia el localStorage del navegador:
   - F12 → Application → Local Storage → Clear All

2. Verifica que el servidor Django esté respondiendo:
   - Abre: `http://localhost:8000/api/login/` en el navegador
   - Deberías ver un error de método (Method Not Allowed), lo cual está bien porque es un POST

3. Prueba el login directamente con curl (desde otra terminal):
```bash
curl -X POST http://localhost:8000/api/login/ -H "Content-Type: application/json" -d "{\"correo\":\"admin@test.com\",\"contrasenia\":\"admin123\"}"
```

## Información Importante

- **El error 401 en `/api/listar-estudiantes/` es NORMAL si no has hecho login**
- **DEBES hacer login primero antes de acceder a páginas protegidas**
- **Después del login exitoso, el token se guarda automáticamente**
- **Las siguientes peticiones usarán ese token automáticamente**

## Estado Actual del Sistema

✅ Base de datos conectada
✅ Usuario de prueba creado: `admin@test.com` / `admin123`
✅ URLs corregidas
✅ Autenticación configurada correctamente

El sistema está listo, solo necesitas hacer login desde el frontend.


