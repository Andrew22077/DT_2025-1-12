#!/usr/bin/env python
"""
Script para crear el período académico 2025-1 usando Django shell
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
    
    from competencias.models import PeriodoAcademico
    
    def crear_periodo_2025_1():
        """Crear el período académico 2025-1"""
        
        print("=" * 60)
        print("CREACION DEL PERIODO ACADEMICO 2025-1")
        print("=" * 60)
        print()
        
        # Verificar si ya existe
        periodo_existente = PeriodoAcademico.objects.filter(
            año=2025,
            semestre=1
        ).first()
        
        if periodo_existente:
            print(f"El periodo 2025-1 ya existe:")
            print(f"   - Codigo: {periodo_existente.codigo}")
            print(f"   - Nombre: {periodo_existente.nombre}")
            print(f"   - Fechas: {periodo_existente.fecha_inicio} a {periodo_existente.fecha_fin}")
            print(f"   - Activo: {'Si' if periodo_existente.activo else 'No'}")
            return periodo_existente
        
        print("Creando periodo 2025-1...")
        
        # Crear el período 2025-1
        fecha_inicio = date(2025, 1, 1)
        fecha_fin = date(2025, 6, 30)
        nombre = "Primer Semestre 2025"
        
        # Crear el período
        nuevo_periodo = PeriodoAcademico.objects.create(
            año=2025,
            semestre=1,
            nombre=nombre,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            activo=False  # No activo porque es futuro
        )
        
        print()
        print("Periodo creado exitosamente:")
        print(f"   - Codigo: {nuevo_periodo.codigo}")
        print(f"   - Nombre: {nuevo_periodo.nombre}")
        print(f"   - Fecha inicio: {nuevo_periodo.fecha_inicio}")
        print(f"   - Fecha fin: {nuevo_periodo.fecha_fin}")
        print(f"   - Activo: {'Si' if nuevo_periodo.activo else 'No'}")
        print()
        
        # Mostrar todos los períodos
        print("-" * 60)
        print("PERIODOS ACADEMICOS DISPONIBLES:")
        print("-" * 60)
        periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
        
        for periodo in periodos:
            estado = "ACTIVO" if periodo.activo else "Inactivo"
            print(f"{estado} | {periodo.codigo:8s} | {periodo.nombre:25s} | {periodo.fecha_inicio} a {periodo.fecha_fin}")
        
        print()
        print("=" * 60)
        print("PROCESO COMPLETADO")
        print("=" * 60)
        
        return nuevo_periodo

    if __name__ == "__main__":
        try:
            periodo = crear_periodo_2025_1()
            print("Script ejecutado exitosamente")
        except Exception as e:
            print(f"Error al ejecutar el script: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

except Exception as e:
    print(f"Error configurando Django: {e}")
    sys.exit(1)
