#!/usr/bin/env python
"""
Script para crear el período académico inicial
"""
import os
import sys
import django
from datetime import date

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
django.setup()

from competencias.models import PeriodoAcademico

def crear_periodo_inicial():
    """Crear el período académico actual (2025-2)"""
    
    # Determinar el período actual
    fecha_actual = date.today()
    año = fecha_actual.year
    mes = fecha_actual.month
    
    # Determinar semestre
    semestre = 1 if mes <= 6 else 2
    
    # Verificar si ya existe
    periodo_existente = PeriodoAcademico.objects.filter(
        año=año,
        semestre=semestre
    ).first()
    
    if periodo_existente:
        print(f"El período {año}-{semestre} ya existe: {periodo_existente.codigo} - {periodo_existente.nombre}")
        return periodo_existente
    
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
    nuevo_periodo = PeriodoAcademico.objects.create(
        año=año,
        semestre=semestre,
        nombre=nombre,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        activo=True
    )
    
    print(f"Período creado: {nuevo_periodo.codigo} - {nuevo_periodo.nombre}")
    print(f"Fechas: {fecha_inicio} - {fecha_fin}")
    print(f"Activo: {nuevo_periodo.activo}")
    
    return nuevo_periodo

if __name__ == "__main__":
    try:
        periodo = crear_periodo_inicial()
        print("✅ Período académico creado exitosamente!")
        
        # Mostrar todos los períodos
        print("\nPeríodos existentes:")
        periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
        for p in periodos:
            estado = "ACTIVO" if p.activo else "Inactivo"
            print(f"  {p.codigo} - {p.nombre} ({estado})")
            
    except Exception as e:
        print(f"❌ Error creando período: {e}")
        sys.exit(1)
