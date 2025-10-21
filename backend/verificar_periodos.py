#!/usr/bin/env python
"""
Script para verificar periodos académicos existentes
"""
import os
import sys

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')

# Intentar importar Django
try:
    import django
    django.setup()
    
    from competencias.models import PeriodoAcademico
    
    print("=" * 60)
    print("PERIODOS ACADEMICOS EXISTENTES")
    print("=" * 60)
    print()
    
    periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
    
    if periodos.exists():
        print("Periodos encontrados:")
        for periodo in periodos:
            estado = "ACTIVO" if periodo.activo else "Inactivo"
            print(f"- {periodo.codigo} | {periodo.nombre} | {estado} | {periodo.fecha_inicio} a {periodo.fecha_fin}")
    else:
        print("No hay periodos academicos en la base de datos")
    
    print()
    print("=" * 60)
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
