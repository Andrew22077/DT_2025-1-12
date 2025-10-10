# Sistema de Períodos Académicos

## 📋 Descripción

Se ha implementado un sistema completo de períodos académicos que permite organizar las evaluaciones por semestre académico (2025-1, 2025-2, 2026-1, etc.). El sistema se actualiza automáticamente cada mitad de año y mantiene un registro histórico de todas las evaluaciones.

## 🎯 Características Principales

### ✅ **Detección Automática de Períodos**
- **Actualización semestral**: El sistema detecta automáticamente el período actual basado en la fecha
- **Primer semestre**: Enero - Junio (2025-1)
- **Segundo semestre**: Julio - Diciembre (2025-2)
- **Creación automática**: Si no existe un período activo, se crea automáticamente

### ✅ **Gestión de Evaluaciones por Período**
- **Asignación automática**: Las nuevas evaluaciones se asignan automáticamente al período actual
- **Filtrado por período**: Los informes pueden filtrarse por período específico
- **Histórico completo**: Mantiene registro de evaluaciones de todos los períodos

### ✅ **Interfaz de Usuario**
- **Selector de período**: Dropdown para seleccionar período en los informes
- **Indicador visual**: Muestra el período seleccionado con fechas
- **Período actual**: Marcado claramente como "Actual"

## 📁 Archivos Implementados

### **Backend**

#### 1. **Modelo: `backend/competencias/models.py`**
```python
class PeriodoAcademico(models.Model):
    codigo = models.CharField(max_length=10, unique=True)  # "2025-1", "2025-2"
    nombre = models.CharField(max_length=50)               # "Primer Semestre 2025"
    año = models.IntegerField()                            # 2025
    semestre = models.IntegerField()                       # 1 o 2
    fecha_inicio = models.DateField()                      # Fecha de inicio
    fecha_fin = models.DateField()                         # Fecha de fin
    activo = models.BooleanField()                         # Período actual
```

#### 2. **Evaluaciones con Período: `backend/competencias/models.py`**
```python
class Evaluacion(models.Model):
    # ... campos existentes ...
    periodo = models.ForeignKey(PeriodoAcademico, ...)  # Nuevo campo
    # ... restricción unique_together incluye 'periodo'
```

#### 3. **Serializers: `backend/competencias/serializers.py`**
- `PeriodoAcademicoSerializer`: Serialización completa del período
- `EvaluacionSerializer`: Actualizado para incluir período

#### 4. **Vistas: `backend/competencias/views.py`**
- `obtener_periodos_academicos()`: Lista todos los períodos
- `obtener_periodo_actual()`: Obtiene el período actual
- `crear_periodo_academico()`: Crea nuevos períodos

#### 5. **URLs: `backend/competencias/urls.py`**
- `api/periodos/`: Lista de períodos
- `api/periodos/actual/`: Período actual
- `api/periodos/crear/`: Crear período

#### 6. **Comando de Gestión: `backend/competencias/management/commands/crear_periodo_actual.py`**
```bash
python manage.py crear_periodo_actual
python manage.py crear_periodo_actual --año 2025 --semestre 1
python manage.py crear_periodo_actual --forzar
```

### **Frontend**

#### 1. **Hook Personalizado: `client/src/hooks/usePeriodosAcademicos.js`**
```javascript
const { 
  periodos, 
  periodoActual, 
  loading, 
  error,
  cargarPeriodos,
  crearPeriodo 
} = usePeriodosAcademicos();
```

#### 2. **Componente Selector: `client/src/components/PeriodoSelector.jsx`**
```jsx
<PeriodoSelector
  periodos={periodos}
  periodoSeleccionado={periodoSeleccionado}
  onPeriodoChange={setPeriodoSeleccionado}
  mostrarActual={true}
/>
```

#### 3. **Página Actualizada: `client/src/pages/Informes.jsx`**
- Selector de período en el header
- Indicador visual del período seleccionado
- Integración con el hook de períodos

## 🔧 Funcionalidades Implementadas

### **Detección Automática**
```python
@classmethod
def get_periodo_actual(cls):
    """Retorna el período académico actual basado en la fecha"""
    fecha_actual = timezone.now().date()
    
    # Buscar período activo
    periodo_actual = cls.objects.filter(
        activo=True,
        fecha_inicio__lte=fecha_actual,
        fecha_fin__gte=fecha_actual
    ).first()
    
    # Si no existe, crear automáticamente
    if not periodo_actual:
        año_actual = fecha_actual.year
        semestre = 1 if fecha_actual.month <= 6 else 2
        # ... crear período automáticamente
```

### **Asignación Automática a Evaluaciones**
```python
def save(self, *args, **kwargs):
    # Asignar período actual si no se proporciona
    if not self.periodo:
        self.periodo = PeriodoAcademico.get_periodo_actual()
    super().save(*args, **kwargs)
```

### **Filtrado por Período**
```javascript
// En el frontend, filtrar datos por período seleccionado
const datosFiltrados = datos.filter(item => 
  !periodoSeleccionado || item.periodo_id === periodoSeleccionado.id
);
```

## 📊 Ejemplos de Uso

### **Crear Período Manualmente**
```bash
# Crear período actual automáticamente
python manage.py crear_periodo_actual

# Crear período específico
python manage.py crear_periodo_actual --año 2025 --semestre 1

# Forzar actualización de período existente
python manage.py crear_periodo_actual --forzar
```

### **Usar en el Frontend**
```jsx
import { usePeriodosAcademicos } from '../hooks/usePeriodosAcademicos';
import PeriodoSelector from '../components/PeriodoSelector';

function MiComponente() {
  const { periodos, periodoActual, crearPeriodo } = usePeriodosAcademicos();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(periodoActual);

  return (
    <div>
      <PeriodoSelector
        periodos={periodos}
        periodoSeleccionado={periodoSeleccionado}
        onPeriodoChange={setPeriodoSeleccionado}
      />
      
      {periodoSeleccionado && (
        <div>
          Mostrando datos para: {periodoSeleccionado.codigo}
        </div>
      )}
    </div>
  );
}
```

## 🚀 Migración y Configuración

### **1. Crear Migraciones**
```bash
cd backend
python manage.py makemigrations competencias
python manage.py migrate
```

### **2. Crear Período Inicial**
```bash
python manage.py crear_periodo_actual
```

### **3. Verificar en Admin de Django**
- Ir a `/admin/competencias/periodoacademico/`
- Verificar que se creó el período actual
- Marcar como activo si es necesario

## 📈 Beneficios del Sistema

1. **Organización Temporal**: Las evaluaciones se organizan por semestre académico
2. **Histórico Completo**: Mantiene registro de todos los períodos anteriores
3. **Actualización Automática**: No requiere intervención manual cada semestre
4. **Filtrado Flexible**: Permite ver datos de períodos específicos
5. **Escalabilidad**: Fácil agregar nuevos períodos o modificar existentes
6. **Integridad de Datos**: Las evaluaciones siempre tienen un período asignado

## 🔮 Próximos Pasos

- [ ] Implementar filtrado por período en todas las vistas de informes
- [ ] Agregar validación para evitar evaluaciones en períodos futuros
- [ ] Crear reportes comparativos entre períodos
- [ ] Implementar cierre automático de períodos al final del semestre
- [ ] Agregar estadísticas de progreso por período

---

**Nota**: El sistema mantiene compatibilidad total con evaluaciones existentes. Las evaluaciones sin período se asignan automáticamente al período actual al guardarse.
