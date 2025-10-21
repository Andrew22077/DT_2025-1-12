#!/usr/bin/env python
"""
Script para probar la lógica de evolución entre periodos para estudiantes de segundo semestre
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

def test_evolucion_estudiantes():
    """Probar la lógica de evolución entre periodos"""
    
    print("=== TEST EVOLUCIÓN ESTUDIANTES ===")
    
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
    
    # Determinar período anterior
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
    
    if periodo_anterior:
        print(f"   Período anterior: {periodo_anterior.codigo} - {periodo_anterior.nombre}")
    else:
        print("   Período anterior: No encontrado")
    
    # Obtener evaluaciones del período actual
    evaluaciones_periodo_actual = Evaluacion.objects.filter(
        estudiante=estudiante,
        periodo=periodo_actual
    )
    print(f"   Evaluaciones período actual: {evaluaciones_periodo_actual.count()}")
    
    # Obtener evaluaciones del período anterior
    evaluaciones_periodo_anterior = []
    if es_segundo_semestre and periodo_anterior:
        evaluaciones_periodo_anterior = Evaluacion.objects.filter(
            estudiante=estudiante,
            periodo=periodo_anterior
        )
        print(f"   Evaluaciones período anterior: {len(evaluaciones_periodo_anterior)}")
    
    # Mostrar todas las evaluaciones del estudiante
    todas_evaluaciones = Evaluacion.objects.filter(estudiante=estudiante)
    print(f"   Total evaluaciones: {todas_evaluaciones.count()}")
    
    print("\n=== DETALLE DE EVALUACIONES ===")
    for evaluacion in todas_evaluaciones:
        print(f"   RAC: {evaluacion.rac.numero} | Puntaje: {evaluacion.puntaje} | Período: {evaluacion.periodo.codigo if evaluacion.periodo else 'Sin período'} | Fecha: {evaluacion.fecha.strftime('%Y-%m-%d')}")
    
    # Verificar periodos disponibles
    print("\n=== PERIODOS DISPONIBLES ===")
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    for periodo in periodos:
        print(f"   {periodo.codigo} - {periodo.nombre} (Activo: {periodo.activo})")
    
    print("\n=== TEST COMPLETADO ===")

if __name__ == "__main__":
    test_evolucion_estudiantes()
