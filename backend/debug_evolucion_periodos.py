#!/usr/bin/env python
"""
Script para debuggear la evolución entre periodos y verificar el estado de las evaluaciones
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

from competencias.models import Estudiante, Evaluacion, PeriodoAcademico, RAC, Profesor

def debug_evolucion_periodos():
    """Debuggear la evolución entre periodos para estudiantes de segundo semestre"""
    
    print("=== DEBUG EVOLUCIÓN PERIODOS ===")
    
    # Buscar el estudiante FRAILE OJEDA ANDRES FELIPE (ID: 140)
    try:
        estudiante = Estudiante.objects.get(id=140)
        print(f"✅ Estudiante encontrado: {estudiante.nombre}")
        print(f"   Grupo: {estudiante.grupo}")
        print(f"   Documento: {estudiante.documento}")
    except Estudiante.DoesNotExist:
        print("❌ Estudiante con ID 140 no encontrado")
        return
    
    # Verificar si es de segundo semestre
    segundo_semestre_grupos = ['2A', '2B', '2C']
    es_segundo_semestre = estudiante.grupo in segundo_semestre_grupos
    print(f"   Es segundo semestre: {es_segundo_semestre}")
    
    # Obtener período actual
    periodo_actual = PeriodoAcademico.get_periodo_actual()
    print(f"   Período actual: {periodo_actual.codigo} - {periodo_actual.nombre}")
    
    # Mostrar todos los períodos disponibles
    print("\n=== PERIODOS DISPONIBLES ===")
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    for periodo in periodos:
        print(f"   {periodo.codigo} - {periodo.nombre} (Activo: {periodo.activo})")
    
    # Obtener todas las evaluaciones del estudiante
    todas_evaluaciones = Evaluacion.objects.filter(estudiante=estudiante)
    print(f"\n=== EVALUACIONES DEL ESTUDIANTE ===")
    print(f"Total evaluaciones: {todas_evaluaciones.count()}")
    
    if todas_evaluaciones.count() == 0:
        print("❌ No hay evaluaciones para este estudiante")
        return
    
    # Agrupar evaluaciones por período
    evaluaciones_por_periodo = {}
    for evaluacion in todas_evaluaciones:
        periodo_key = evaluacion.periodo.codigo if evaluacion.periodo else "Sin período"
        if periodo_key not in evaluaciones_por_periodo:
            evaluaciones_por_periodo[periodo_key] = []
        evaluaciones_por_periodo[periodo_key].append(evaluacion)
    
    print(f"\n=== EVALUACIONES POR PERÍODO ===")
    for periodo_key, evaluaciones in evaluaciones_por_periodo.items():
        print(f"\n📅 Período: {periodo_key} ({len(evaluaciones)} evaluaciones)")
        for eval in evaluaciones:
            print(f"   - RAC {eval.rac.numero} | Puntaje: {eval.puntaje} | Fecha: {eval.fecha.strftime('%Y-%m-%d')}")
    
    # Determinar período anterior para estudiantes de segundo semestre
    periodo_anterior = None
    if es_segundo_semestre:
        if periodo_actual.semestre == 2:  # Si estamos en segundo semestre
            # El período anterior es el primer semestre del mismo año
            periodo_anterior = PeriodoAcademico.objects.filter(
                año=periodo_actual.año,
                semestre=1
            ).first()
        elif periodo_actual.semestre == 1:  # Si estamos en primer semestre
            # El período anterior es el segundo semestre del año anterior
            periodo_anterior = PeriodoAcademico.objects.filter(
                año=periodo_actual.año - 1,
                semestre=2
            ).first()
    
    print(f"\n=== LÓGICA DE PERIODOS ===")
    print(f"Período actual: {periodo_actual.codigo if periodo_actual else 'No encontrado'}")
    print(f"Período anterior: {periodo_anterior.codigo if periodo_anterior else 'No encontrado'}")
    
    # Obtener evaluaciones del período actual
    evaluaciones_periodo_actual = Evaluacion.objects.filter(
        estudiante=estudiante,
        periodo=periodo_actual
    )
    
    # Obtener evaluaciones del período anterior
    evaluaciones_periodo_anterior = []
    if es_segundo_semestre and periodo_anterior:
        evaluaciones_periodo_anterior = Evaluacion.objects.filter(
            estudiante=estudiante,
            periodo=periodo_anterior
        )
    
    print(f"\n=== EVALUACIONES POR LÓGICA DE PERIODOS ===")
    print(f"Evaluaciones período actual ({periodo_actual.codigo}): {evaluaciones_periodo_actual.count()}")
    print(f"Evaluaciones período anterior ({periodo_anterior.codigo if periodo_anterior else 'N/A'}): {len(evaluaciones_periodo_anterior)}")
    
    # Si no hay evaluaciones con períodos asignados, usar lógica de fechas
    if not evaluaciones_periodo_actual and not evaluaciones_periodo_anterior:
        print("\n=== FALLBACK: LÓGICA DE FECHAS ===")
        
        # Separar por fechas
        evaluaciones_primer_semestre = []
        evaluaciones_segundo_semestre = []
        
        for evaluacion in todas_evaluaciones:
            mes = evaluacion.fecha.month
            if 1 <= mes <= 6:  # Enero a Junio = Primer Semestre
                evaluaciones_primer_semestre.append(evaluacion)
            elif 7 <= mes <= 12:  # Julio a Diciembre = Segundo Semestre
                evaluaciones_segundo_semestre.append(evaluacion)
        
        print(f"Evaluaciones primer semestre (por fecha): {len(evaluaciones_primer_semestre)}")
        for eval in evaluaciones_primer_semestre:
            print(f"   - RAC {eval.rac.numero} | Puntaje: {eval.puntaje} | Fecha: {eval.fecha.strftime('%Y-%m-%d')}")
        
        print(f"Evaluaciones segundo semestre (por fecha): {len(evaluaciones_segundo_semestre)}")
        for eval in evaluaciones_segundo_semestre:
            print(f"   - RAC {eval.rac.numero} | Puntaje: {eval.puntaje} | Fecha: {eval.fecha.strftime('%Y-%m-%d')}")
    
    # Calcular promedios para mostrar evolución
    print(f"\n=== CÁLCULO DE EVOLUCIÓN ===")
    
    if evaluaciones_periodo_anterior:
        promedio_anterior = sum(eval.puntaje for eval in evaluaciones_periodo_anterior) / len(evaluaciones_periodo_anterior)
        print(f"Promedio período anterior ({periodo_anterior.codigo}): {promedio_anterior:.2f}")
    
    if evaluaciones_periodo_actual:
        promedio_actual = sum(eval.puntaje for eval in evaluaciones_periodo_actual) / len(evaluaciones_periodo_actual)
        print(f"Promedio período actual ({periodo_actual.codigo}): {promedio_actual:.2f}")
    
    if evaluaciones_periodo_anterior and evaluaciones_periodo_actual:
        diferencia = promedio_actual - promedio_anterior
        print(f"Diferencia: {diferencia:+.2f}")
        if diferencia > 0:
            print("📈 Mejora en el rendimiento")
        elif diferencia < 0:
            print("📉 Disminución en el rendimiento")
        else:
            print("➡️ Sin cambios en el rendimiento")

if __name__ == "__main__":
    try:
        debug_evolucion_periodos()
        print("\n=== DEBUG COMPLETADO ===")
    except Exception as e:
        print(f"❌ Error general: {e}")
        import traceback
        traceback.print_exc()
