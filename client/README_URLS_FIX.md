# 🔧 Corrección de URLs Duplicadas - API

## Problema Identificado

El error 404 `Not Found: /api/api/profesores/2/foto/` indicaba que las URLs estaban duplicando `/api/` porque:

- `API_URL = "http://localhost:8000/api"` (ya incluye `/api`)
- Las funciones agregaban `/api/` otra vez
- Resultado: `/api/api/profesores/2/foto/` ❌

## URLs Corregidas

### ✅ Funciones de Hooks (useUserApi)

- `actualizarFoto()`: `/profesores/${id}/foto/`
- `exportProfesoresExcel()`: `/export-excel-profesores/`
- `getEstudiante()`: `/estudiante/${id}/`
- `registerEstudiante()`: `/register-estudiante/`
- `updateEstudiante()`: `/estudiante/${id}/`
- `deleteEstudiante()`: `/estudiante/${id}/`
- `importExcelEstudiantes()`: `/import-excel-estudiantes/`
- `exportEstudiantesExcel()`: `/export-excel-estudiantes/`
- `getEstudiantesPorGrupo()`: `/estudiantes-por-grupo/${grupo}/`
- `getGrupos()`: `/grupos/`
- `getCurrentUser()`: `/perfil/`

### ✅ Funciones Individuales (export)

- `exportProfesoresExcel()`: `/export-excel-profesores/`
- `getEstudiante()`: `/estudiante/${id}/`
- `registerEstudiante()`: `/register-estudiante/`
- `updateEstudiante()`: `/estudiante/${id}/`
- `deleteEstudiante()`: `/estudiante/${id}/`
- `importExcelEstudiantes()`: `/import-excel-estudiantes/`
- `exportEstudiantesExcel()`: `/export-excel-estudiantes/`
- `getEstudiantesPorGrupo()`: `/estudiantes-por-grupo/${grupo}/`
- `getGrupos()`: `/grupos/`
- `getCurrentUser()`: `/perfil/`

## URLs Correctas del Backend

### Con `/api/` en el backend:

- `/api/profesores/{id}/foto/` ✅
- `/api/profesores/{id}/update/` ✅
- `/api/export-excel-profesores/` ✅
- `/api/estudiante/{id}/` ✅
- `/api/register-estudiante/` ✅
- `/api/estudiantes-por-grupo/{grupo}/` ✅
- `/api/grupos/` ✅
- `/api/import-excel-estudiantes/` ✅
- `/api/export-excel-estudiantes/` ✅
- `/api/perfil/` ✅

### Sin `/api/` en el backend:

- `/login/` ✅
- `/register/` ✅
- `/logout/` ✅
- `/listar-profesores/` ✅
- `/profesor/{id}/` ✅
- `/perfil/actualizar/` ✅
- `/import-excel-profesores/` ✅
- `/listar-estudiantes/` ✅

## Resultado Final

Ahora todas las URLs se construyen correctamente:

- `API_URL` = `"http://localhost:8000/api"`
- URLs del frontend = `${API_URL}/endpoint/`
- URLs finales = `http://localhost:8000/api/endpoint/` ✅

## Prueba de Funcionamiento

La subida de fotos ahora debería funcionar correctamente:

1. Usuario selecciona foto en EditProfile
2. Se envía a `/api/profesores/{id}/foto/` ✅
3. Backend procesa y guarda la foto
4. Foto aparece en TeacherListPage ✅

## Archivos Modificados

- `client/src/api/UserApi.jsx` - Todas las URLs corregidas
