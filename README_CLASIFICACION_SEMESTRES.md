# 📚 Clasificación de Evaluaciones por Semestre

## 🔍 **¿Cómo se Distinguen las Evaluaciones del Primer Semestre?**

### **Criterio Principal: Fecha de Evaluación**

El sistema utiliza la **fecha de la evaluación** (campo `fecha` en el modelo `Evaluacion`) para determinar a qué semestre pertenece cada evaluación:

- **Primer Semestre**: Enero a Junio (meses 1-6)
- **Segundo Semestre**: Julio a Diciembre (meses 7-12)

### **Lógica de Clasificación**

```python
def determinar_semestre_por_fecha(fecha_evaluacion, grupo_estudiante):
    mes = fecha_evaluacion.month
    
    if 1 <= mes <= 6:  # Enero a Junio
        return 'primer_semestre'
    elif 7 <= mes <= 12:  # Julio a Diciembre
        return 'segundo_semestre'
    else:
        # Fallback: usar el grupo del estudiante
        if grupo_estudiante in ['2A', '2B', '2C']:
            return 'segundo_semestre'
        else:
            return 'primer_semestre'
```

## 🛠️ **Endpoints Disponibles**

### **1. Resultados por Semestre**
```
GET /api/evaluaciones/resultados-estudiante-semestre/<estudiante_id>/
```
- Retorna resultados separados por semestre
- Incluye información de clasificación

### **2. Debug de Clasificación**
```
GET /api/evaluaciones/debug-clasificacion-semestres/<estudiante_id>/
```
- Muestra cómo se clasificó cada evaluación
- Útil para verificar la lógica

## 📊 **Estructura de Respuesta**

```json
{
  "estudiante": {
    "id": 1,
    "nombre": "Juan Pérez",
    "grupo": "2A",
    "documento": "12345678",
    "es_segundo_semestre": true
  },
  "primer_semestre": {
    "semestre": "Primer Semestre",
    "resumen_general": { ... },
    "grafico_profesores": [ ... ],
    "grafico_gacs": [ ... ],
    "evaluaciones": [ ... ]
  },
  "segundo_semestre": {
    "semestre": "Segundo Semestre",
    "resumen_general": { ... },
    "grafico_profesores": [ ... ],
    "grafico_gacs": [ ... ],
    "evaluaciones": [ ... ]
  },
  "clasificacion": {
    "total_evaluaciones": 10,
    "evaluaciones_primer_semestre": 4,
    "evaluaciones_segundo_semestre": 6,
    "criterio_clasificacion": "Por fecha de evaluación (Enero-Junio: 1er semestre, Julio-Diciembre: 2do semestre)"
  }
}
```

## 🔧 **Configuración Personalizable**

### **Cambiar Fechas de Corte**

Para ajustar las fechas según el calendario académico de tu universidad, modifica la función `determinar_semestre_por_fecha`:

```python
# Ejemplo: Si el año académico va de agosto a julio
if 8 <= mes <= 12 or 1 <= mes <= 7:  # Agosto a Julio
    return 'primer_semestre'
elif 1 <= mes <= 7:  # Enero a Julio
    return 'segundo_semestre'
```

### **Agregar Más Criterios**

Puedes extender la lógica para incluir otros criterios:

```python
def determinar_semestre_avanzado(evaluacion):
    # Criterio 1: Fecha
    mes = evaluacion.fecha.month
    
    # Criterio 2: Materia específica
    if evaluacion.rac.materias.filter(nombre__icontains='avanzada').exists():
        return 'segundo_semestre'
    
    # Criterio 3: Rango de fechas específico
    if evaluacion.fecha.month in [3, 4, 5]:  # Marzo a Mayo
        return 'primer_semestre'
    
    # Fallback a lógica original
    return determinar_semestre_por_fecha(evaluacion.fecha, evaluacion.estudiante.grupo)
```

## 🧪 **Verificación y Testing**

### **Endpoint de Debug**

Usa el endpoint de debug para verificar la clasificación:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/competencias/api/evaluaciones/debug-clasificacion-semestres/1/
```

### **Ejemplo de Respuesta de Debug**

```json
{
  "estudiante": {
    "id": 1,
    "nombre": "Juan Pérez",
    "grupo": "2A"
  },
  "evaluaciones_detalle": [
    {
      "id": 1,
      "fecha": "2024-03-15 10:30:00",
      "mes": 3,
      "rac": 1,
      "profesor": "Dr. García",
      "puntaje": 4,
      "semestre_asignado": "primer_semestre",
      "criterio": "Por fecha"
    },
    {
      "id": 2,
      "fecha": "2024-09-20 14:15:00",
      "mes": 9,
      "rac": 2,
      "profesor": "Dra. López",
      "puntaje": 5,
      "semestre_asignado": "segundo_semestre",
      "criterio": "Por fecha"
    }
  ]
}
```

## ⚠️ **Consideraciones Importantes**

1. **Fechas de Evaluación**: Asegúrate de que las evaluaciones tengan fechas correctas
2. **Calendario Académico**: Ajusta las fechas según tu universidad
3. **Datos Históricos**: Las evaluaciones antiguas sin fecha correcta usarán el grupo como fallback
4. **Consistencia**: Verifica que la clasificación sea consistente con la realidad académica

## 🚀 **Próximas Mejoras**

- [ ] Configuración de fechas de corte desde la interfaz
- [ ] Clasificación por período académico específico
- [ ] Validación automática de fechas de evaluación
- [ ] Reportes de clasificación por lote
