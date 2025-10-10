#!/usr/bin/env python
"""
Script simple para configurar períodos académicos
"""
import os
import sys
import django
from datetime import date

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')

try:
    django.setup()
    print("✅ Django configurado correctamente")
except Exception as e:
    print(f"❌ Error configurando Django: {e}")
    sys.exit(1)

try:
    from competencias.models import PeriodoAcademico, Evaluacion
    print("✅ Modelos importados correctamente")
except Exception as e:
    print(f"❌ Error importando modelos: {e}")
    sys.exit(1)

def main():
    print("🚀 Configurando sistema de períodos académicos...")
    
    # 1. Crear período académico actual
    print("\n📅 Creando período académico actual...")
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
    print("\n📊 Asignando período a evaluaciones existentes...")
    evaluaciones_sin_periodo = Evaluacion.objects.filter(periodo__isnull=True)
    total_sin_periodo = evaluaciones_sin_periodo.count()
    
    if total_sin_periodo > 0:
        evaluaciones_actualizadas = evaluaciones_sin_periodo.update(periodo=periodo_actual)
        print(f"   ✅ {evaluaciones_actualizadas} evaluaciones asignadas al período {periodo_actual.codigo}")
    else:
        print("   ✅ Todas las evaluaciones ya tienen período asignado")
    
    # 3. Verificar configuración
    print("\n🔍 Verificando configuración...")
    total_evaluaciones = Evaluacion.objects.count()
    evaluaciones_con_periodo = Evaluacion.objects.filter(periodo__isnull=False).count()
    
    print(f"   📈 Total de evaluaciones: {total_evaluaciones}")
    print(f"   ✅ Evaluaciones con período: {evaluaciones_con_periodo}")
    
    # Mostrar períodos
    print(f"\n📋 Períodos académicos:")
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    for periodo in periodos:
        count = Evaluacion.objects.filter(periodo=periodo).count()
        estado = "ACTIVO" if periodo.activo else "Inactivo"
        print(f"   {periodo.codigo} - {periodo.nombre} ({estado}): {count} evaluaciones")
    
    print(f"\n🎉 ¡Configuración completada exitosamente!")

if __name__ == "__main__":
    main()
