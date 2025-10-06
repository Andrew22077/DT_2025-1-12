# 📊 Funcionalidad de Semestres en Informes - TAB Estudiantes

## 🎯 **Funcionalidad Implementada**

Se ha agregado la funcionalidad para mostrar resultados por semestre en el TAB de "Por Estudiante" de la página de Informes, similar a la implementación en ResultadosEstudiantesPage.

## 🔧 **Cambios Realizados**

### **1. Estados Agregados**
```javascript
// Estados para funcionalidad de semestres en estudiantes
const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
const [resultadosEstudianteSemestre, setResultadosEstudianteSemestre] = useState(null);
const [mostrarResultadosEstudiante, setMostrarResultadosEstudiante] = useState(false);
```

### **2. Funciones Implementadas**

#### **Detección de Segundo Semestre**
```javascript
const esSegundoSemestre = (grupo) => {
  const gruposSegundoSemestre = ['2A', '2B', '2C'];
  return gruposSegundoSemestre.includes(grupo);
};
```

#### **Carga de Resultados por Estudiante**
```javascript
const cargarResultadosEstudiante = async (estudiante) => {
  // Detecta automáticamente si es segundo semestre
  // Usa la API apropiada según el grupo
  // Maneja tanto resultados normales como por semestre
};
```

#### **Renderizado de Resultados por Semestre**
```javascript
const renderResultadosSemestre = (datosSemestre, semestreNombre) => {
  // Renderiza gráficos, tablas y estadísticas
  // Para cada semestre individualmente
};
```

### **3. Interfaz de Usuario**

#### **Tabla de Estudiantes Mejorada**
- **Nueva columna "Acciones"** con botón "Ver Detalles"
- **Indicador visual** para estudiantes de segundo semestre (📚 2do Semestre)
- **Integración** con la funcionalidad de semestres

#### **Modal de Resultados Detallados**
- **Vista completa** de resultados del estudiante
- **Separación por semestres** para estudiantes de segundo semestre
- **Gráficos independientes** para cada semestre
- **Tablas detalladas** de evaluaciones por semestre

## 📋 **Flujo de Funcionamiento**

### **Para Estudiantes de Primer Semestre (1A, 1B, 1C, Virtual 1)**
1. Usuario hace clic en "Ver Detalles"
2. Se carga la API normal de resultados
3. Se muestra un modal con resultados del primer semestre únicamente
4. Interfaz similar a la funcionalidad original

### **Para Estudiantes de Segundo Semestre (2A, 2B, 2C)**
1. Usuario hace clic en "Ver Detalles"
2. Se detecta automáticamente que es segundo semestre
3. Se carga la API de resultados por semestre
4. Se muestra un modal con:
   - **Sección de Primer Semestre** (si hay datos)
   - **Sección de Segundo Semestre** (si hay datos)
   - **Indicador visual** de que es estudiante de segundo semestre

## 🎨 **Características Visuales**

### **Indicadores en la Tabla**
- **Etiqueta "📚 2do Semestre"** para estudiantes de grupos 2A, 2B, 2C
- **Botón "Ver Detalles"** con icono de ojo
- **Colores diferenciados** para cada semestre

### **Modal de Resultados**
- **Diseño responsivo** con scroll vertical
- **Gráficos separados** por semestre
- **Tablas detalladas** de evaluaciones
- **Estadísticas independientes** para cada semestre

## 🔄 **Integración con APIs**

### **APIs Utilizadas**
1. **`obtenerResultadosEstudiantePorSemestre()`** - Para estudiantes de segundo semestre
2. **`obtenerResultadosEstudiante()`** - Para estudiantes de primer semestre

### **Lógica de Selección**
```javascript
if (esSegundoSemestre(estudiante.estudiante_grupo)) {
  // Usar API por semestre
  const resultados = await evaluacionApi.obtenerResultadosEstudiantePorSemestre(estudiante.estudiante_id);
} else {
  // Usar API normal
  const resultados = await evaluacionApi.obtenerResultadosEstudiante(estudiante.estudiante_id);
}
```

## 📊 **Estructura de Datos**

### **Para Estudiantes de Segundo Semestre**
```json
{
  "estudiante": {
    "id": 1,
    "nombre": "Juan Pérez",
    "grupo": "2A",
    "documento": "12345678",
    "es_segundo_semestre": true
  },
  "primer_semestre": { /* datos del primer semestre */ },
  "segundo_semestre": { /* datos del segundo semestre */ }
}
```

### **Para Estudiantes de Primer Semestre**
```json
{
  "estudiante": { /* info del estudiante */ },
  "primer_semestre": { /* datos del primer semestre */ },
  "segundo_semestre": { /* vacío o con datos nulos */ }
}
```

## ✅ **Beneficios de la Implementación**

1. **Consistencia**: Misma funcionalidad que en ResultadosEstudiantesPage
2. **Detección Automática**: No requiere intervención manual del usuario
3. **Interfaz Intuitiva**: Indicadores visuales claros
4. **Datos Separados**: Visualización independiente por semestre
5. **Compatibilidad**: Funciona con estudiantes de ambos semestres

## 🚀 **Uso**

1. **Navegar** a la página de Informes
2. **Seleccionar** el TAB "Por Estudiante"
3. **Identificar** estudiantes de segundo semestre por la etiqueta "📚 2do Semestre"
4. **Hacer clic** en "Ver Detalles" para cualquier estudiante
5. **Explorar** los resultados separados por semestre (si aplica)

La funcionalidad está completamente integrada y lista para usar, proporcionando una experiencia consistente y completa para la visualización de resultados de estudiantes por semestre.
