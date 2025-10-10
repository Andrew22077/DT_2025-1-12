#!/usr/bin/env python
"""
Script completo para configurar el sistema de períodos académicos
1. Crear período académico inicial
2. Asignar período a evaluaciones existentes
3. Verificar configuración
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

def setup_periodos_academicos():
    """Configurar completamente el sistema de períodos académicos"""
    
    print("🚀 Configurando sistema de períodos académicos...")
    
    # 1. Crear período académico actual
    print("\n📅 1. Creando período académico actual...")
    fecha_actual = date.today()
    año = fecha_actual.year
    mes = fecha_actual.month
    
    semestre = 1 if mes <= 6 else 2
    
    # Verificar si ya existe
    periodo_existente = PeriodoAcademico.objects.filter(
        año=año,
        semestre=semestre
    ).first()
    
    if periodo_existente:
        print(f"   ✅ Período existente: {periodo_existente.codigo} - {periodo_existente.nombre}")
        periodo_actual = periodo_existente
    else:
        # Crear fechas del período
        if semestre == 1:
            fecha_inicio = date(año, 1, 1)
            fecha_fin = date(año, 6, 30)
            nombre = f"Primer Semestre {año}"
        else:
            fecha_inicio = date(año, 7, 1)
            fecha_fin = date(año, 12, 31)
            nombre = f"Segundo Semestre {año}"
        
        # Desactivar otros períodos
        PeriodoAcademico.objects.filter(activo=True).update(activo=False)
        
        # Crear nuevo período
        periodo_actual = PeriodoAcademico.objects.create(
            año=año,
            semestre=semestre,
            nombre=nombre,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            activo=True
        )
        
        print(f"   ✅ Período creado: {periodo_actual.codigo} - {periodo_actual.nombre}")
    
    # 2. Asignar período a evaluaciones existentes
    print("\n📊 2. Asignando período a evaluaciones existentes...")
    evaluaciones_sin_periodo = Evaluacion.objects.filter(periodo__isnull=True)
    total_sin_periodo = evaluaciones_sin_periodo.count()
    
    if total_sin_periodo > 0:
        evaluaciones_actualizadas = evaluaciones_sin_periodo.update(periodo=periodo_actual)
        print(f"   ✅ {evaluaciones_actualizadas} evaluaciones asignadas al período {periodo_actual.codigo}")
    else:
        print("   ✅ Todas las evaluaciones ya tienen período asignado")
    
    # 3. Verificar configuración
    print("\n🔍 3. Verificando configuración...")
    
    # Estadísticas generales
    total_evaluaciones = Evaluacion.objects.count()
    evaluaciones_con_periodo = Evaluacion.objects.filter(periodo__isnull=False).count()
    evaluaciones_sin_periodo_final = Evaluacion.objects.filter(periodo__isnull=True).count()
    
    print(f"   📈 Total de evaluaciones: {total_evaluaciones}")
    print(f"   ✅ Evaluaciones con período: {evaluaciones_con_periodo}")
    print(f"   ❌ Evaluaciones sin período: {evaluaciones_sin_periodo_final}")
    
    # Estadísticas por período
    print(f"\n📋 Períodos académicos:")
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    for periodo in periodos:
        count = Evaluacion.objects.filter(periodo=periodo).count()
        estado = "ACTIVO" if periodo.activo else "Inactivo"
        print(f"   {periodo.codigo} - {periodo.nombre} ({estado}): {count} evaluaciones")
    
    # 4. Verificar integridad
    print(f"\n🔧 4. Verificando integridad...")
    
    # Verificar que el período actual existe
    periodo_actual_verificado = PeriodoAcademico.objects.filter(activo=True).first()
    if periodo_actual_verificado:
        print(f"   ✅ Período actual verificado: {periodo_actual_verificado.codigo}")
    else:
        print(f"   ⚠️  No hay período marcado como activo")
    
    # Verificar que hay al menos un período
    total_periodos = PeriodoAcademico.objects.count()
    if total_periodos > 0:
        print(f"   ✅ Total de períodos creados: {total_periodos}")
    else:
        print(f"   ❌ No se encontraron períodos")
    
    print(f"\n🎉 Configuración completada exitosamente!")
    print(f"\n📝 Próximos pasos:")
    print(f"   1. Reiniciar el servidor backend: python manage.py runserver")
    print(f"   2. Verificar que no hay errores en la consola del navegador")
    print(f"   3. Probar el selector de períodos en la página de Informes")

if __name__ == "__main__":
    try:
        setup_periodos_academicos()
        
    except Exception as e:
        print(f"❌ Error durante la configuración: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
