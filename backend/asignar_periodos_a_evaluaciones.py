#!/usr/bin/env python
"""
Script para asignar períodos académicos a evaluaciones existentes que no los tienen
"""

import os
import sys
import django
from datetime import date
from django.utils import timezone

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
django.setup()

from competencias.models import Estudiante, Evaluacion, PeriodoAcademico

def asignar_periodos_a_evaluaciones():
    """Asignar períodos académicos a evaluaciones existentes basándose en fechas"""
    
    print("=== ASIGNACIÓN DE PERÍODOS A EVALUACIONES ===")
    
    # Obtener todas las evaluaciones sin período asignado
    evaluaciones_sin_periodo = Evaluacion.objects.filter(periodo__isnull=True)
    print(f"Evaluaciones sin período asignado: {evaluaciones_sin_periodo.count()}")
    
    if evaluaciones_sin_periodo.count() == 0:
        print("✅ Todas las evaluaciones ya tienen período asignado")
        return
    
    # Obtener todos los períodos disponibles
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    print(f"Períodos disponibles: {[p.codigo for p in periodos]}")
    
    if not periodos:
        print("❌ No hay períodos académicos en la base de datos")
        return
    
    # Crear diccionario de períodos por rango de fechas
    periodos_por_fecha = {}
    for periodo in periodos:
        periodos_por_fecha[periodo.id] = {
            'periodo': periodo,
            'fecha_inicio': periodo.fecha_inicio,
            'fecha_fin': periodo.fecha_fin
        }
    
    # Procesar evaluaciones sin período
    evaluaciones_procesadas = 0
    evaluaciones_con_error = 0
    
    for evaluacion in evaluaciones_sin_periodo:
        try:
            # Determinar período basándose en la fecha de evaluación
            fecha_evaluacion = evaluacion.fecha.date()
            periodo_asignado = None
            
            # Buscar el período que contenga la fecha de evaluación
            for periodo_id, periodo_info in periodos_por_fecha.items():
                if (periodo_info['fecha_inicio'] <= fecha_evaluacion <= periodo_info['fecha_fin']):
                    periodo_asignado = periodo_info['periodo']
                    break
            
            # Si no se encuentra un período que contenga la fecha, usar lógica de fechas
            if not periodo_asignado:
                año = fecha_evaluacion.year
                mes = fecha_evaluacion.month
                
                # Determinar semestre basándose en el mes
                semestre = 1 if mes <= 6 else 2
                
                # Buscar o crear período
                periodo_asignado = PeriodoAcademico.objects.filter(
                    año=año,
                    semestre=semestre
                ).first()
                
                if not periodo_asignado:
                    # Crear período si no existe
                    codigo = f"{año}-{semestre}"
                    nombre = f"{'Primer' if semestre == 1 else 'Segundo'} Semestre {año}"
                    fecha_inicio = date(año, 1, 1) if semestre == 1 else date(año, 7, 1)
                    fecha_fin = date(año, 6, 30) if semestre == 1 else date(año, 12, 31)
                    
                    periodo_asignado = PeriodoAcademico.objects.create(
                        codigo=codigo,
                        nombre=nombre,
                        año=año,
                        semestre=semestre,
                        fecha_inicio=fecha_inicio,
                        fecha_fin=fecha_fin,
                        activo=False
                    )
                    print(f"📅 Período creado: {codigo} - {nombre}")
            
            # Asignar período a la evaluación
            evaluacion.periodo = periodo_asignado
            evaluacion.save()
            
            evaluaciones_procesadas += 1
            print(f"✅ Evaluación {evaluacion.id} asignada al período {periodo_asignado.codigo}")
            
        except Exception as e:
            evaluaciones_con_error += 1
            print(f"❌ Error procesando evaluación {evaluacion.id}: {e}")
    
    print(f"\n=== RESUMEN ===")
    print(f"Evaluaciones procesadas: {evaluaciones_procesadas}")
    print(f"Evaluaciones con error: {evaluaciones_con_error}")
    
    # Verificar resultado
    evaluaciones_sin_periodo_final = Evaluacion.objects.filter(periodo__isnull=True)
    print(f"Evaluaciones sin período restantes: {evaluaciones_sin_periodo_final.count()}")

def verificar_evaluaciones_por_periodo():
    """Verificar la distribución de evaluaciones por período"""
    
    print("\n=== VERIFICACIÓN DE EVALUACIONES POR PERÍODO ===")
    
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    
    for periodo in periodos:
        evaluaciones_count = Evaluacion.objects.filter(periodo=periodo).count()
        print(f"Período {periodo.codigo}: {evaluaciones_count} evaluaciones")
    
    # Evaluaciones sin período
    evaluaciones_sin_periodo = Evaluacion.objects.filter(periodo__isnull=True).count()
    print(f"Sin período: {evaluaciones_sin_periodo} evaluaciones")

if __name__ == "__main__":
    try:
        asignar_periodos_a_evaluaciones()
        verificar_evaluaciones_por_periodo()
        print("\n=== SCRIPT COMPLETADO ===")
    except Exception as e:
        print(f"❌ Error general: {e}")
        import traceback
        traceback.print_exc()
