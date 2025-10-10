#!/usr/bin/env python
"""
Script completo para configurar el sistema de períodos académicos
Incluye migraciones y configuración
"""
import os
import sys
import subprocess
from datetime import date

def ejecutar_comando(comando, descripcion):
    """Ejecutar un comando y mostrar el resultado"""
    print(f"\n🔧 {descripcion}...")
    try:
        result = subprocess.run(comando, shell=True, capture_output=True, text=True, cwd='backend')
        if result.returncode == 0:
            print(f"   ✅ {descripcion} completado")
            if result.stdout:
                print(f"   📝 {result.stdout}")
        else:
            print(f"   ❌ Error en {descripcion}")
            print(f"   📝 {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Excepción en {descripcion}: {e}")
        return False
    return True

def main():
    print("🚀 Configurando sistema completo de períodos académicos...")
    
    # 1. Aplicar migraciones
    if not ejecutar_comando("python manage.py migrate competencias", "Aplicando migraciones de competencias"):
        print("❌ Error aplicando migraciones. Continuando de todas formas...")
    
    # 2. Ejecutar script de configuración
    print("\n📅 Configurando períodos académicos...")
    try:
        # Importar y ejecutar el script de configuración
        sys.path.append('backend')
        from configurar_periodos import main as configurar_main
        configurar_main()
    except Exception as e:
        print(f"❌ Error ejecutando configuración: {e}")
        print("💡 Intenta ejecutar manualmente:")
        print("   cd backend")
        print("   python configurar_periodos.py")
    
    print(f"\n🎉 ¡Configuración completada!")
    print(f"\n📝 Próximos pasos:")
    print(f"   1. Reiniciar el servidor backend")
    print(f"   2. Verificar que no hay errores en la consola")
    print(f"   3. Probar el selector de períodos en Informes")

if __name__ == "__main__":
    main()
