#!/usr/bin/env python
"""
Script para asignar período actual a evaluaciones existentes que no tienen período
"""
import os
import sys
import django
from datetime import date

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
django.setup()

from competencias.models import PeriodoAcademico, Evaluacion

def asignar_periodos_a_evaluaciones():
    """Asignar período actual a evaluaciones existentes"""
    
    # Obtener o crear período actual
    periodo_actual = PeriodoAcademico.get_periodo_actual()
    print(f"Período actual: {periodo_actual.codigo} - {periodo_actual.nombre}")
    
    # Encontrar evaluaciones sin período
    evaluaciones_sin_periodo = Evaluacion.objects.filter(periodo__isnull=True)
    total_sin_periodo = evaluaciones_sin_periodo.count()
    
    print(f"Evaluaciones sin período: {total_sin_periodo}")
    
    if total_sin_periodo == 0:
        print("✅ Todas las evaluaciones ya tienen período asignado")
        return
    
    # Asignar período actual a todas las evaluaciones sin período
    evaluaciones_actualizadas = evaluaciones_sin_periodo.update(periodo=periodo_actual)
    
    print(f"✅ {evaluaciones_actualizadas} evaluaciones actualizadas con período {periodo_actual.codigo}")
    
    # Verificar
    evaluaciones_sin_periodo_despues = Evaluacion.objects.filter(periodo__isnull=True).count()
    print(f"Evaluaciones sin período después: {evaluaciones_sin_periodo_despues}")
    
    # Mostrar estadísticas por período
    print("\nEstadísticas por período:")
    periodos_stats = {}
    for evaluacion in Evaluacion.objects.all():
        periodo_codigo = evaluacion.periodo.codigo if evaluacion.periodo else "Sin período"
        if periodo_codigo not in periodos_stats:
            periodos_stats[periodo_codigo] = 0
        periodos_stats[periodo_codigo] += 1
    
    for periodo, count in periodos_stats.items():
        print(f"  {periodo}: {count} evaluaciones")

if __name__ == "__main__":
    try:
        asignar_periodos_a_evaluaciones()
        print("\n✅ Proceso completado exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
