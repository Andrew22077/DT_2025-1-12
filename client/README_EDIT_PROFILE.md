# EditProfile Component - Documentación

## Descripción

El componente `EditProfile` permite a los usuarios autenticados editar su información personal y subir una foto de perfil que se guarda en la base de datos.

## Funcionalidades

### 1. Edición de Información Personal

- **Nombre completo**: Campo editable para el nombre del usuario
- **Cédula**: Campo editable para el número de cédula
- **Correo electrónico**: Campo editable para el email del usuario

### 2. Cambio de Contraseña

- **Nueva contraseña**: Campo opcional para cambiar la contraseña
- **Confirmar contraseña**: Campo para confirmar la nueva contraseña
- Validación automática para asegurar que ambas contraseñas coincidan

### 3. Subida de Foto de Perfil

- **Preview en tiempo real**: Muestra una vista previa de la imagen seleccionada
- **Validación de archivos**: Solo acepta archivos de imagen (JPG, PNG, GIF)
- **Límite de tamaño**: Máximo 5MB por archivo
- **Eliminación de foto**: Botón para remover la foto seleccionada

## Características Técnicas

### APIs Utilizadas

- `getCurrentUser()`: Obtiene los datos del usuario autenticado
- `actualizarPerfil()`: Actualiza la información básica del perfil
- `actualizarFoto()`: Sube la nueva foto del usuario

### Validaciones

- **Campos requeridos**: Nombre, cédula y correo son obligatorios
- **Formato de email**: Validación automática del formato de correo
- **Contraseñas**: Verificación de coincidencia entre contraseña y confirmación
- **Archivos**: Validación de tipo y tamaño de imagen

### Estados de la Aplicación

- **Loading**: Indicador de carga durante las operaciones de API
- **Error**: Manejo de errores con mensajes informativos
- **Success**: Confirmación de operaciones exitosas

## Rutas y Protección

- **Ruta**: `/editar-perfil`
- **Protección**: Requiere autenticación (`ProtectedRoute`)
- **Acceso**: Disponible desde el menú de usuario para usuarios autenticados

## Estructura del Formulario

### Sección 1: Foto de Perfil

- Preview circular de la imagen actual/seleccionada
- Input de archivo con estilos personalizados
- Botón de eliminación de foto

### Sección 2: Información Personal

- Grid responsivo con campos de información básica
- Validación en tiempo real

### Sección 3: Cambio de Contraseña

- Campos opcionales para cambio de contraseña
- Instrucciones claras sobre el uso opcional

### Sección 4: Botones de Acción

- Botón "Cancelar": Regresa a la página anterior
- Botón "Guardar Cambios": Envía los datos actualizados

## Manejo de Errores

- **Errores de API**: Mostrados en tiempo real con mensajes descriptivos
- **Errores de validación**: Validación del lado del cliente antes del envío
- **Errores de archivo**: Validación de tipo y tamaño de imagen

## Experiencia de Usuario

- **Carga inicial**: Spinner mientras se cargan los datos del usuario
- **Feedback visual**: Mensajes de éxito y error claramente visibles
- **Responsive**: Diseño adaptativo para diferentes tamaños de pantalla
- **Accesibilidad**: Labels apropiados y navegación por teclado

## Integración con Backend

- Utiliza el modelo `Profesor` de Django
- Almacena fotos en el directorio `profesores_fotos/`
- Maneja autenticación mediante tokens
- Soporte para archivos multimedia con configuración CORS

## Dependencias

- React Hooks (useState, useEffect)
- API personalizada (useUserApi)
- Tailwind CSS para estilos
- React Router para navegación
