# Comando de prueba para verificar la funcionalidad de fotos
# Ejecutar en el directorio backend con: python manage.py shell

from usuarios.models import Profesor
from django.conf import settings
import os

# Verificar configuración de media
print("=== CONFIGURACIÓN DE MEDIA ===")
print(f"MEDIA_URL: {settings.MEDIA_URL}")
print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"DEBUG: {settings.DEBUG}")

# Verificar si existe el directorio de fotos
fotos_dir = os.path.join(settings.MEDIA_ROOT, 'profesores_fotos')
print(f"\n=== DIRECTORIO DE FOTOS ===")
print(f"Directorio: {fotos_dir}")
print(f"Existe: {os.path.exists(fotos_dir)}")

if os.path.exists(fotos_dir):
    archivos = os.listdir(fotos_dir)
    print(f"Archivos en el directorio: {archivos}")

# Verificar profesores y sus fotos
print(f"\n=== PROFESORES Y FOTOS ===")
profesores = Profesor.objects.all()
for profesor in profesores:
    print(f"Profesor: {profesor.nombre}")
    print(f"  - ID: {profesor.id}")
    print(f"  - Foto: {profesor.foto}")
    print(f"  - Foto URL: {profesor.foto_url}")
    if profesor.foto:
        print(f"  - Foto existe en disco: {os.path.exists(profesor.foto.path)}")
    print()

# Probar serializer
print(f"\n=== SERIALIZER TEST ===")
from usuarios.serializers import ProfesorPerfilSerializer
if profesores.exists():
    profesor = profesores.first()
    serializer = ProfesorPerfilSerializer(profesor)
    print(f"Datos serializados: {serializer.data}")
    print(f"Foto URL del serializer: {serializer.data.get('foto_url')}")
    print(f"Foto URL del modelo: {profesor.foto_url}")
    
    # Probar URL completa
    if profesor.foto:
        print(f"Foto path: {profesor.foto.path}")
        print(f"Foto name: {profesor.foto.name}")
        print(f"Foto URL: {profesor.foto.url}")
