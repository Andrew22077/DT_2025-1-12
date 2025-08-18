# Sistema de Evaluación de Estudiantes

## Descripción

Este sistema permite a los profesores evaluar estudiantes asignando calificaciones a cada RAC (Resultado de Aprendizaje por Competencia) en una escala de 0.0 a 5.0.

## Características

- **Selector de Estudiante**: Permite elegir qué estudiante evaluar
- **Lista de RACs**: Muestra todos los RACs disponibles con sus descripciones
- **Campos de Calificación**: Input numérico para cada RAC (0.0 - 5.0)
- **Guardado Individual**: Botón para guardar cada evaluación por separado
- **Guardado Masivo**: Botón para guardar todas las evaluaciones de una vez
- **Validación**: Verifica que todos los campos estén completos antes de guardar
- **Persistencia**: Las evaluaciones se guardan en la base de datos

## Estructura del Proyecto

### Backend (Django)

- **`competencias/models.py`**: Modelos para GAC, RAC, Materia y Evaluación
- **`competencias/views.py`**: API endpoints para manejar evaluaciones
- **`competencias/urls.py`**: URLs de la API
- **`competencias/serializers.py`**: Serializadores para la API

### Frontend (React)

- **`src/pages/EvaluacionEstudiantesPage.jsx`**: Página principal de evaluación
- **`src/api/EvaluacionApi.jsx`**: Cliente API para comunicarse con el backend

## Instalación y Configuración

### 1. Backend

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py populate_sample_data  # Crear datos de ejemplo
python manage.py runserver
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

## Uso del Sistema

### 1. Acceso a la Página

1. Inicie sesión como profesor
2. En el menú de usuario, haga clic en "Evaluar Estudiantes"
3. Será redirigido a `/evaluacion-estudiantes`

### 2. Seleccionar Estudiante

1. Use el selector desplegable para elegir el estudiante a evaluar
2. Solo se muestran estudiantes con estado "matriculado"
3. Al seleccionar un estudiante, se cargarán sus evaluaciones existentes (si las hay)

### 3. Asignar Calificaciones

1. Para cada RAC, ingrese una calificación entre 0.0 y 5.0
2. Puede usar decimales (ej: 4.5, 3.8)
3. Los campos se validan automáticamente

### 4. Guardar Evaluaciones

**Opción 1: Guardado Individual**
- Haga clic en el botón verde (✓) junto a cada RAC
- Útil para guardar evaluaciones una por una

**Opción 2: Guardado Masivo**
- Complete todos los campos
- Haga clic en "Guardar Todas las Evaluaciones"
- Más eficiente para evaluaciones completas

## API Endpoints

### Obtener Estudiantes
```
GET /competencias/api/estudiantes/
```

### Obtener RACs
```
GET /competencias/api/racs/
```

### Obtener Evaluaciones de un Estudiante
```
GET /competencias/api/evaluaciones/estudiante/{id}/
```

### Crear/Actualizar Evaluación
```
POST /competencias/api/evaluaciones/crear/
Body: {
  "estudiante_id": 1,
  "rac_id": 1,
  "puntaje": 4.5
}
```

### Crear Evaluaciones Masivas
```
POST /competencias/api/evaluaciones/masivas/
Body: {
  "estudiante_id": 1,
  "evaluaciones": [
    {"rac_id": 1, "puntaje": 4.5},
    {"rac_id": 2, "puntaje": 3.8}
  ]
}
```

## Modelos de Datos

### Evaluación
```python
class Evaluacion(models.Model):
    rac = models.ForeignKey(RAC, on_delete=models.CASCADE)
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE)
    profesor = models.ForeignKey(Profesor, on_delete=models.CASCADE)
    puntaje = models.DecimalField(max_digits=5, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
```

### RAC
```python
class RAC(models.Model):
    descripcion = models.TextField()
    numero = models.IntegerField(unique=True)
    gacs = models.ManyToManyField("GAC", related_name="racs")
```

## Seguridad

- Solo usuarios autenticados pueden acceder a la funcionalidad
- Las evaluaciones están asociadas al profesor que las crea
- Validación de rangos de puntaje (0.0 - 5.0)
- Protección CSRF habilitada

## Personalización

### Agregar Nuevos RACs

1. Use el admin de Django: `/admin/competencias/rac/`
2. O ejecute el comando: `python manage.py populate_sample_data`

### Modificar Escala de Calificación

1. Edite el modelo `Evaluacion` en `competencias/models.py`
2. Ajuste los validadores en `competencias/views.py`
3. Actualice la interfaz en `EvaluacionEstudiantesPage.jsx`

## Solución de Problemas

### Error de CORS
- Verifique que `corsheaders` esté configurado correctamente
- Asegúrese de que el frontend esté en la lista de orígenes permitidos

### Error de Base de Datos
- Ejecute `python manage.py migrate`
- Verifique la conexión a MySQL
- Revise los logs del servidor

### Error de Autenticación
- Verifique que el usuario esté logueado
- Compruebe que el token de autenticación sea válido

## Contribución

Para contribuir al proyecto:

1. Cree una rama para su feature
2. Implemente los cambios
3. Ejecute las pruebas
4. Envíe un pull request

## Licencia

Este proyecto es parte del sistema de gestión de la Universidad El Bosque.
