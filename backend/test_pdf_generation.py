#!/usr/bin/env python
"""
Script de prueba para verificar la generación de PDFs
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
    print("✅ Django configurado correctamente")
except Exception as e:
    print(f"❌ Error configurando Django: {e}")
    sys.exit(1)

try:
    from competencias.models import Profesor, Evaluacion, PeriodoAcademico
    from competencias.views import generar_pdf_informe_profesor
    print("✅ Modelos y vistas importados correctamente")
except Exception as e:
    print(f"❌ Error importando modelos/vistas: {e}")
    sys.exit(1)

def test_pdf_generation():
    """Probar la generación de PDF con datos de prueba"""
    try:
        print("\n🔍 Buscando profesores con evaluaciones...")
        
        # Buscar un profesor que tenga evaluaciones
        profesor_con_evaluaciones = None
        for profesor in Profesor.objects.all()[:5]:  # Probar con los primeros 5 profesores
            evaluaciones_count = Evaluacion.objects.filter(profesor=profesor).count()
            if evaluaciones_count > 0:
                profesor_con_evaluaciones = profesor
                print(f"   ✅ Profesor encontrado: {profesor.nombre} ({evaluaciones_count} evaluaciones)")
                break
        
        if not profesor_con_evaluaciones:
            print("   ⚠️  No se encontraron profesores con evaluaciones")
            return False
        
        # Obtener evaluaciones del profesor
        evaluaciones = Evaluacion.objects.filter(
            profesor=profesor_con_evaluaciones
        ).select_related('estudiante', 'rac', 'periodo').prefetch_related(
            'rac__gacs', 'rac__materias'
        ).order_by('estudiante__nombre', 'rac__numero')
        
        if not evaluaciones.exists():
            print("   ⚠️  No hay evaluaciones disponibles")
            return False
        
        print(f"   📊 Procesando {evaluaciones.count()} evaluaciones...")
        
        # Calcular estadísticas básicas
        total_evaluaciones = evaluaciones.count()
        promedio_general = sum(e.puntaje for e in evaluaciones) / total_evaluaciones if total_evaluaciones > 0 else 0
        
        # Estadísticas por puntaje
        estadisticas_puntaje = {}
        for puntaje in [0.0, 1.0, 2.0, 3.0, 3.5, 4.0, 5.0]:
            count = evaluaciones.filter(puntaje=puntaje).count()
            estadisticas_puntaje[puntaje] = count
        
        # Estudiantes únicos
        estudiantes_evaluados = evaluaciones.values('estudiante').distinct()
        total_estudiantes = estudiantes_evaluados.count()
        
        # Agrupar por estudiante
        estudiantes_detalle = {}
        for evaluacion in evaluaciones:
            estudiante = evaluacion.estudiante
            if estudiante.id not in estudiantes_detalle:
                estudiantes_detalle[estudiante.id] = {
                    'estudiante': estudiante,
                    'evaluaciones': [],
                }
            estudiantes_detalle[estudiante.id]['evaluaciones'].append(evaluacion)
        
        # Calcular estadísticas por estudiante
        for estudiante_id, data in estudiantes_detalle.items():
            evaluaciones_estudiante = data['evaluaciones']
            data['total_evaluaciones'] = len(evaluaciones_estudiante)
            data['promedio'] = sum(e.puntaje for e in evaluaciones_estudiante) / len(evaluaciones_estudiante)
        
        # Obtener período actual
        periodo_actual = None
        try:
            periodo_actual = PeriodoAcademico.get_periodo_actual()
            print(f"   📅 Período actual: {periodo_actual.codigo}")
        except:
            print("   ⚠️  No se pudo obtener período actual")
        
        # Preparar datos para el PDF
        datos_informe = {
            'profesor': profesor_con_evaluaciones,
            'periodo': periodo_actual,
            'fecha_generacion': date.today(),
            'estadisticas_generales': {
                'total_evaluaciones': total_evaluaciones,
                'total_estudiantes': total_estudiantes,
                'promedio_general': promedio_general,
                'estadisticas_puntaje': estadisticas_puntaje
            },
            'estudiantes': estudiantes_detalle
        }
        
        print(f"   📝 Datos preparados:")
        print(f"      - Profesor: {profesor_con_evaluaciones.nombre}")
        print(f"      - Evaluaciones: {total_evaluaciones}")
        print(f"      - Estudiantes: {total_estudiantes}")
        print(f"      - Promedio: {promedio_general:.2f}")
        
        # Generar PDF
        print(f"\n🔧 Generando PDF...")
        response = generar_pdf_informe_profesor(datos_informe)
        
        if hasattr(response, 'content') and len(response.content) > 0:
            print(f"   ✅ PDF generado exitosamente!")
            print(f"   📄 Tamaño: {len(response.content)} bytes")
            print(f"   📋 Tipo: {response.get('Content-Type', 'N/A')}")
            
            # Guardar PDF de prueba
            filename = f"test_informe_{profesor_con_evaluaciones.nombre.replace(' ', '_')}.pdf"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"   💾 PDF guardado como: {filename}")
            
            return True
        else:
            print(f"   ❌ PDF vacío o error en generación")
            return False
            
    except Exception as e:
        print(f"   ❌ Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Iniciando prueba de generación de PDF...")
    
    success = test_pdf_generation()
    
    if success:
        print("\n🎉 ¡Prueba completada exitosamente!")
        print("📝 El sistema de generación de PDF está funcionando correctamente.")
    else:
        print("\n❌ La prueba falló. Revisar errores arriba.")
        sys.exit(1)
