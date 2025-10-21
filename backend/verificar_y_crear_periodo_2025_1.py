#!/usr/bin/env python
"""
Script para verificar si existe el período 2025-1 y crearlo si es necesario
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

from competencias.models import PeriodoAcademico

def verificar_y_crear_periodo_2025_1():
    """Verificar si existe el período 2025-1 y crearlo si es necesario"""
    
    print("=== VERIFICACIÓN Y CREACIÓN PERÍODO 2025-1 ===")
    
    # Verificar si existe el período 2025-1
    periodo_2025_1 = PeriodoAcademico.objects.filter(
        año=2025,
        semestre=1
    ).first()
    
    if periodo_2025_1:
        print(f"✅ El período 2025-1 ya existe:")
        print(f"   Código: {periodo_2025_1.codigo}")
        print(f"   Nombre: {periodo_2025_1.nombre}")
        print(f"   Fechas: {periodo_2025_1.fecha_inicio} - {periodo_2025_1.fecha_fin}")
        print(f"   Activo: {periodo_2025_1.activo}")
        return periodo_2025_1
    else:
        print("❌ El período 2025-1 no existe, creándolo...")
        
        try:
            # Crear el período 2025-1
            nuevo_periodo = PeriodoAcademico.objects.create(
                codigo="2025-1",
                nombre="Primer Semestre 2025",
                año=2025,
                semestre=1,
                fecha_inicio=date(2025, 1, 1),
                fecha_fin=date(2025, 6, 30),
                activo=False  # Se crea como inactivo por defecto
            )
            
            print(f"🎉 Período 2025-1 creado exitosamente:")
            print(f"   Código: {nuevo_periodo.codigo}")
            print(f"   Nombre: {nuevo_periodo.nombre}")
            print(f"   Fechas: {nuevo_periodo.fecha_inicio} - {nuevo_periodo.fecha_fin}")
            print(f"   Activo: {nuevo_periodo.activo}")
            
            return nuevo_periodo
            
        except Exception as e:
            print(f"❌ Error al crear el período 2025-1: {e}")
            import traceback
            traceback.print_exc()
            return None

def mostrar_todos_periodos():
    """Mostrar todos los períodos académicos disponibles"""
    
    print("\n=== TODOS LOS PERÍODOS ACADÉMICOS ===")
    
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    
    if not periodos:
        print("❌ No hay períodos académicos en la base de datos")
        return
    
    for periodo in periodos:
        print(f"   {periodo.codigo} - {periodo.nombre} (Activo: {periodo.activo})")
        print(f"      Fechas: {periodo.fecha_inicio} - {periodo.fecha_fin}")

if __name__ == "__main__":
    try:
        verificar_y_crear_periodo_2025_1()
        mostrar_todos_periodos()
        print("\n=== SCRIPT COMPLETADO ===")
    except Exception as e:
        print(f"❌ Error general: {e}")
        import traceback
        traceback.print_exc()
