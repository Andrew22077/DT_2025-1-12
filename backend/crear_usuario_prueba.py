#!/usr/bin/env python
"""
Script para crear un usuario de prueba
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
django.setup()

from usuarios.models import Profesor
from rest_framework.authtoken.models import Token

def crear_usuario_prueba():
    """Crear un usuario de prueba"""
    print("="*60)
    print("CREANDO USUARIO DE PRUEBA")
    print("="*60)
    
    # Datos del usuario de prueba
    correo = 'admin@test.com'
    nombre = 'Administrador Test'
    cedula = '12345678'
    contrasenia = 'admin123'
    
    try:
        # Verificar si ya existe
        if Profesor.objects.filter(correo=correo).exists():
            profesor = Profesor.objects.get(correo=correo)
            print(f"[INFO] El usuario ya existe: {correo}")
            print(f"[INFO] Actualizando contraseña...")
            profesor.set_password(contrasenia)
            profesor.is_active = True
            profesor.is_staff = True
            profesor.save()
        else:
            # Crear nuevo usuario
            profesor = Profesor.objects.create_user(
                correo=correo,
                nombre=nombre,
                cedula=cedula,
                contrasenia=contrasenia
            )
            profesor.is_active = True
            profesor.is_staff = True
            profesor.save()
            print(f"[OK] Usuario creado exitosamente")
        
        # Crear o obtener token
        token, created = Token.objects.get_or_create(user=profesor)
        
        print("\n" + "="*60)
        print("DATOS DEL USUARIO")
        print("="*60)
        print(f"Correo: {correo}")
        print(f"Nombre: {nombre}")
        print(f"Contraseña: {contrasenia}")
        print(f"Es staff: {profesor.is_staff}")
        print(f"Está activo: {profesor.is_active}")
        print(f"Token: {token.key}")
        print("\n" + "="*60)
        print("Puedes usar estos datos para hacer login en el frontend")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error al crear usuario: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    crear_usuario_prueba()


