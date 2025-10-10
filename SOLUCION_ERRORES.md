# 🔧 Solución de Errores - Períodos Académicos

## 📋 Errores Identificados

1. **Error 401 (Unauthorized)** - ✅ **SOLUCIONADO**
   - **Causa**: Formato incorrecto de autenticación (`Bearer` vs `Token`)
   - **Solución**: Cambiado a `Token ${token}` en todos los hooks

2. **Error 500 (Internal Server Error)** - 🔄 **EN PROCESO**
   - **Causa**: Modelo `PeriodoAcademico` no existe en la base de datos
   - **Solución**: Aplicar migraciones y configurar períodos

## 🚀 Pasos para Solucionar

### **Paso 1: Aplicar Migraciones**
```bash
cd backend
python manage.py migrate competencias
```

### **Paso 2: Configurar Períodos Académicos**
```bash
cd backend
python configurar_periodos.py
```

### **Paso 3: Reiniciar Servidores**
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd client
npm run dev
```

## 🔍 Verificación

Después de ejecutar los pasos anteriores:

1. **Abrir la consola del navegador** (F12)
2. **Ir a la página de Informes**
3. **Verificar que NO aparecen errores 401 o 500**
4. **Verificar que aparece el selector de período** en la parte superior derecha

## 📊 Lo que hace el script `configurar_periodos.py`:

- ✅ Crea el período académico actual (2025-2)
- ✅ Asigna período a todas las evaluaciones existentes
- ✅ Marca el período como activo
- ✅ Muestra estadísticas de la configuración

## 🆘 Si los errores persisten:

### **Verificar que las migraciones se aplicaron:**
```bash
cd backend
python manage.py showmigrations competencias
```

### **Verificar que existe el período:**
```bash
cd backend
python manage.py shell
>>> from competencias.models import PeriodoAcademico
>>> PeriodoAcademico.objects.all()
```

### **Verificar que las evaluaciones tienen período:**
```bash
cd backend
python manage.py shell
>>> from competencias.models import Evaluacion
>>> Evaluacion.objects.filter(periodo__isnull=True).count()
```

## 📝 Cambios Realizados

### **Frontend:**
- ✅ Corregido formato de autenticación en `usePeriodosAcademicos.js`
- ✅ Corregido formato de autenticación en `PeriodoSelector.jsx`
- ✅ URLs corregidas a `/competencias/api/periodos/`

### **Backend:**
- ✅ Migración creada para modelo `PeriodoAcademico`
- ✅ Campo `periodo` agregado a `Evaluacion`
- ✅ Vistas API creadas para períodos académicos
- ✅ Scripts de configuración creados

---

**Nota**: Si necesitas ayuda adicional, verifica que:
1. El servidor backend esté corriendo
2. Estés autenticado en la aplicación
3. Las migraciones se hayan aplicado correctamente
