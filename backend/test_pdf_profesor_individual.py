#!/usr/bin/env python
"""
Script para probar la generación del PDF individual del profesor
"""
import os
import sys
import django
import requests

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
django.setup()

from competencias.models import Profesor, Evaluacion

def test_pdf_profesor_individual():
    """Probar la generación del PDF individual del profesor"""
    
    print("=" * 60)
    print("PRUEBA DE PDF INDIVIDUAL DEL PROFESOR")
    print("=" * 60)
    print()
    
    # Obtener el primer profesor que tenga evaluaciones
    profesores_con_evaluaciones = Profesor.objects.filter(
        evaluaciones__isnull=False
    ).distinct()
    
    if not profesores_con_evaluaciones.exists():
        print("❌ No hay profesores con evaluaciones en la base de datos")
        return
    
    profesor = profesores_con_evaluaciones.first()
    print(f"📋 Profesor seleccionado: {profesor.nombre}")
    print(f"📧 Correo: {profesor.correo}")
    
    # Contar evaluaciones del profesor
    evaluaciones = Evaluacion.objects.filter(profesor=profesor)
    total_evaluaciones = evaluaciones.count()
    print(f"📊 Total de evaluaciones: {total_evaluaciones}")
    
    if total_evaluaciones == 0:
        print("❌ Este profesor no tiene evaluaciones")
        return
    
    # Contar estudiantes únicos
    estudiantes_unicos = evaluaciones.values('estudiante').distinct().count()
    print(f"👥 Estudiantes evaluados: {estudiantes_unicos}")
    
    # Mostrar algunas evaluaciones
    print("\n📝 Primeras 5 evaluaciones:")
    for i, eval in enumerate(evaluaciones[:5]):
        print(f"   {i+1}. Estudiante: {eval.estudiante.nombre} | RAC: {eval.rac.numero} | Puntaje: {eval.puntaje}")
    
    print("\n" + "=" * 60)
    print("🔧 INSTRUCCIONES PARA PROBAR")
    print("=" * 60)
    print()
    print("1. Asegúrate de que el servidor Django esté ejecutándose")
    print("2. Ve a la página de informes en el navegador")
    print("3. Selecciona un profesor y haz clic en 'Descargar PDF Individual'")
    print("4. Revisa la consola del navegador y los logs del servidor Django")
    print("5. Si hay errores, se mostrarán en la consola")
    print()
    print("📋 Datos del profesor para probar:")
    print(f"   - ID: {profesor.id}")
    print(f"   - Nombre: {profesor.nombre}")
    print(f"   - Evaluaciones: {total_evaluaciones}")
    print()
    
    # URL del endpoint
    url = f"http://localhost:8000/api/pdf/profesor-individual/{profesor.id}/"
    print(f"🌐 URL del endpoint: {url}")
    print()
    print("=" * 60)
    print("✅ INFORMACIÓN DE PRUEBA GENERADA")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_pdf_profesor_individual()
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
