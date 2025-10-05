#!/usr/bin/env python
"""
Script de prueba para verificar el endpoint de registro de estudiantes
"""
import os
import sys
import django
import requests
import json

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_grado_api.settings')
django.setup()

def test_endpoint_directly():
    """Probar el endpoint directamente con requests"""
    print("=== PRUEBA DIRECTA DEL ENDPOINT ===")
    
    # URL del endpoint
    url = "http://localhost:8000/api/register-estudiante/"
    
    # Datos de prueba
    test_data = {
        'documento': '12345678',
        'nombre': 'Juan Pérez García',
        'correo': 'juan.perez@unbosque.edu.co',
        'grupo': '1A',
        'estado': 'prematricula'
    }
    
    # Headers (necesitarás un token válido)
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Token YOUR_TOKEN_HERE'  # Reemplaza con un token válido
    }
    
    print(f"URL: {url}")
    print(f"Datos: {test_data}")
    
    try:
        response = requests.post(url, json=test_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Endpoint funciona correctamente")
            return True
        else:
            print("❌ Endpoint devuelve error")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor. Asegúrate de que el servidor esté ejecutándose.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_with_django_client():
    """Probar usando el cliente de Django"""
    print("\n=== PRUEBA CON CLIENTE DJANGO ===")
    
    from django.test import Client
    from django.contrib.auth import get_user_model
    from rest_framework.authtoken.models import Token
    
    # Crear un usuario de prueba
    User = get_user_model()
    try:
        user = User.objects.get(correo='admin@test.com')
    except User.DoesNotExist:
        user = User.objects.create_user(
            correo='admin@test.com',
            nombre='Admin Test',
            cedula='123456789',
            contrasenia='admin123'
        )
        user.is_staff = True
        user.save()
    
    # Crear token
    token, created = Token.objects.get_or_create(user=user)
    
    # Crear cliente
    client = Client()
    
    # Datos de prueba
    test_data = {
        'documento': '87654321',
        'nombre': 'María García López',
        'correo': 'maria.garcia@unbosque.edu.co',
        'grupo': '2B',
        'estado': 'matriculado'
    }
    
    print(f"Datos: {test_data}")
    
    # Hacer la petición
    response = client.post(
        '/api/register-estudiante/',
        data=json.dumps(test_data),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    
    if response.status_code == 201:
        print("✅ Endpoint funciona correctamente con Django client")
        return True
    else:
        print("❌ Endpoint devuelve error con Django client")
        return False

if __name__ == "__main__":
    print("Iniciando pruebas del endpoint de registro de estudiantes...\n")
    
    # Probar con cliente Django (más confiable)
    success = test_with_django_client()
    
    if success:
        print("\n🎉 ¡El endpoint funciona correctamente!")
    else:
        print("\n❌ El endpoint tiene problemas")
        sys.exit(1)
