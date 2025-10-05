#!/usr/bin/env python
"""
Script de prueba para verificar la creación de estudiantes
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
django.setup()

from usuarios.models import Estudiante
from usuarios.serializers import EstudianteSerializer

def test_estudiante_creation():
    """Probar la creación de un estudiante"""
    print("=== PRUEBA DE CREACIÓN DE ESTUDIANTE ===")
    
    # Datos de prueba
    test_data = {
        'documento': '12345678',
        'nombre': 'Juan Pérez García',
        'correo': 'juan.perez@unbosque.edu.co',
        'grupo': '1A',
        'estado': 'prematricula'
    }
    
    print(f"Datos de prueba: {test_data}")
    
    try:
        # Probar serializer
        print("\n1. Probando serializer...")
        serializer = EstudianteSerializer(data=test_data)
        
        if serializer.is_valid():
            print("✅ Serializer válido")
            print(f"Datos validados: {serializer.validated_data}")
            
            # Crear estudiante
            print("\n2. Creando estudiante...")
            estudiante = serializer.save()
            print(f"✅ Estudiante creado exitosamente: {estudiante}")
            print(f"ID: {estudiante.id}")
            print(f"Documento: {estudiante.documento}")
            print(f"Nombre: {estudiante.nombre}")
            print(f"Correo: {estudiante.correo}")
            print(f"Grupo: {estudiante.grupo}")
            print(f"Estado: {estudiante.estado}")
            
            # Limpiar - eliminar el estudiante de prueba
            print("\n3. Limpiando datos de prueba...")
            estudiante.delete()
            print("✅ Estudiante de prueba eliminado")
            
            return True
            
        else:
            print("❌ Errores de validación en serializer:")
            for field, errors in serializer.errors.items():
                print(f"  {field}: {errors}")
            return False
            
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_estudiante_validation_errors():
    """Probar validaciones con datos incorrectos"""
    print("\n=== PRUEBA DE VALIDACIONES ===")
    
    test_cases = [
        {
            'name': 'Documento muy corto',
            'data': {
                'documento': '123',
                'nombre': 'Test User',
                'correo': 'test@unbosque.edu.co',
                'grupo': '1A',
                'estado': 'prematricula'
            }
        },
        {
            'name': 'Correo faltante',
            'data': {
                'documento': '12345678',
                'nombre': 'Test User',
                'correo': '',
                'grupo': '1A',
                'estado': 'prematricula'
            }
        },
        {
            'name': 'Grupo faltante',
            'data': {
                'documento': '12345678',
                'nombre': 'Test User',
                'correo': 'test@unbosque.edu.co',
                'grupo': '',
                'estado': 'prematricula'
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\nProbando: {test_case['name']}")
        serializer = EstudianteSerializer(data=test_case['data'])
        
        if serializer.is_valid():
            print(f"❌ Debería haber fallado: {test_case['name']}")
        else:
            print(f"✅ Validación correcta para: {test_case['name']}")
            print(f"   Errores: {serializer.errors}")

if __name__ == "__main__":
    print("Iniciando pruebas de creación de estudiantes...\n")
    
    # Ejecutar pruebas
    success = test_estudiante_creation()
    test_estudiante_validation_errors()
    
    if success:
        print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
    else:
        print("\n❌ Algunas pruebas fallaron")
        sys.exit(1)
