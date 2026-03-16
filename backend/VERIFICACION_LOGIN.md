# 🔍 Verificación de Login y Autenticación

## ✅ Estado Actual

- ✅ Base de datos configurada y conectada
- ✅ Usuario de prueba creado
- ✅ Token de autenticación generado
- ✅ Autenticación funcionando correctamente
- ✅ URL del endpoint corregida: `api/listar-estudiantes`

## 👤 Credenciales de Prueba

```
Correo: admin@test.com
Contraseña: admin123
Token: 364f433910519c63d2bd65f4a20f3e110ded2e6d
```

## 📋 Pasos para Solucionar el Error 401

### 1. Verificar que el Frontend esté corriendo
```bash
cd client
npm run dev
```
Debe estar en `http://localhost:5173`

### 2. Verificar que el Backend esté corriendo
```bash
cd backend
.\proyecto_grado\Scripts\Activate.ps1
python manage.py runserver
```
Debe estar en `http://localhost:8000`

### 3. Hacer Login desde el Frontend

1. Abre el navegador en `http://localhost:5173`
2. Ve a la página de login
3. Ingresa las credenciales:
   - Correo: `admin@test.com`
   - Contraseña: `admin123`
4. Haz clic en "Iniciar Sesión"

### 4. Verificar que el Token se Guardó

Abre la consola del navegador (F12) y ejecuta:
```javascript
localStorage.getItem('token')
```

Deberías ver el token guardado. Si no hay token, el login falló.

### 5. Verificar las Peticiones

En la consola del navegador, ve a la pestaña "Network" y:
1. Recarga la página que hace la petición a `/api/listar-estudiantes/`
2. Busca la petición en la lista
3. Haz clic en ella
4. Ve a la pestaña "Headers"
5. Verifica que tenga: `Authorization: Token 364f433910519c63d2bd65f4a20f3e110ded2e6d`

Si no tiene este header, el token no se está enviando.

## 🐛 Si el Login Falla

### Verificar el endpoint de login
Abre la consola del navegador y verifica:
- ¿Qué URL se está usando para el login?
- ¿Hay algún error en la consola?
- ¿Qué respuesta está dando el servidor?

### Probar el login manualmente
Puedes probar el login directamente con curl o Postman:

```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@test.com","contrasenia":"admin123"}'
```

Deberías recibir una respuesta con el token.

## 🔧 Si el Token No se Envía

Si el token está guardado pero no se envía en las peticiones:

1. Verifica que `getAuthHeaders()` esté siendo usado correctamente
2. Verifica que `useUserApi` esté obteniendo el token del localStorage
3. Verifica que axios esté configurado correctamente

## 📝 Notas Importantes

- El endpoint `/api/listar-estudiantes/` requiere autenticación
- Debes hacer login PRIMERO antes de intentar acceder a este endpoint
- El token se guarda en localStorage después del login exitoso
- El token debe incluirse en el header `Authorization: Token <token>` en todas las peticiones autenticadas


